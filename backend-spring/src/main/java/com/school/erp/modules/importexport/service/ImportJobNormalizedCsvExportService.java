package com.school.erp.modules.importexport.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.export.CsvExportSupport;
import com.school.erp.modules.academic.entity.SchoolClass;
import com.school.erp.modules.academic.entity.Section;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
import com.school.erp.modules.academic.repository.SectionRepository;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.importexport.ImportCanonicalFieldCatalog;
import com.school.erp.modules.importexport.ImportJobConstants;
import com.school.erp.modules.importexport.ImportJobType;
import com.school.erp.modules.importexport.entity.ImportJob;
import com.school.erp.modules.importexport.entity.ImportJobLine;
import com.school.erp.modules.importexport.entity.ImportLedgerEntry;
import com.school.erp.modules.importexport.repository.ImportJobLineRepository;
import com.school.erp.modules.importexport.repository.ImportJobRepository;
import com.school.erp.modules.importexport.repository.ImportLedgerEntryRepository;
import com.school.erp.modules.rbac.entity.UserSchoolRoleAssignment;
import com.school.erp.modules.rbac.repository.UserSchoolRoleAssignmentRepository;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.port.StudentPersistencePort;
import com.school.erp.modules.teacher.entity.Teacher;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Builds a per-job CSV in canonical import column order, enriched from persisted entities for successful lines
 * and from the stored line payload for failures — the school’s “download for next update” round-trip file.
 */
@Service
public class ImportJobNormalizedCsvExportService {

    private static final List<String> META_COLUMNS = List.of(
            "import_line_index",
            "import_line_status",
            "import_line_entity_type",
            "import_line_entity_id",
            "import_ledger_outcome",
            "import_error_message");

    private final ImportJobRepository jobRepository;
    private final ImportJobLineRepository lineRepository;
    private final ImportLedgerEntryRepository ledgerRepository;
    private final ObjectMapper objectMapper;
    private final StudentPersistencePort studentPersistence;
    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SectionRepository sectionRepository;
    private final UserSchoolRoleAssignmentRepository userSchoolRoleAssignmentRepository;

    public ImportJobNormalizedCsvExportService(
            ImportJobRepository jobRepository,
            ImportJobLineRepository lineRepository,
            ImportLedgerEntryRepository ledgerRepository,
            ObjectMapper objectMapper,
            StudentPersistencePort studentPersistence,
            TeacherRepository teacherRepository,
            UserRepository userRepository,
            SchoolClassRepository schoolClassRepository,
            SectionRepository sectionRepository,
            UserSchoolRoleAssignmentRepository userSchoolRoleAssignmentRepository) {
        this.jobRepository = jobRepository;
        this.lineRepository = lineRepository;
        this.ledgerRepository = ledgerRepository;
        this.objectMapper = objectMapper;
        this.studentPersistence = studentPersistence;
        this.teacherRepository = teacherRepository;
        this.userRepository = userRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.sectionRepository = sectionRepository;
        this.userSchoolRoleAssignmentRepository = userSchoolRoleAssignmentRepository;
    }

    @Transactional(readOnly = true)
    public byte[] buildNormalizedCsv(Long jobId) {
        String tenantId = TenantContext.getTenantId();
        ImportJob job = jobRepository.findByIdAndTenantIdAndIsDeletedFalse(jobId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("ImportJob", jobId));
        String st = job.getStatus();
        if (ImportJobConstants.JOB_QUEUED.equals(st) || ImportJobConstants.JOB_RUNNING.equals(st)) {
            throw new BusinessException("Job is still in progress; normalized CSV is available after the run finishes.");
        }
        ImportJobType jobType;
        try {
            jobType = ImportJobType.valueOf(job.getJobType().trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new BusinessException("Unsupported job type for normalized export: " + job.getJobType());
        }
        if (jobType != ImportJobType.STUDENTS && jobType != ImportJobType.TEACHERS && jobType != ImportJobType.STAFF) {
            throw new BusinessException("Normalized CSV export is only supported for STUDENTS, TEACHERS, and STAFF jobs.");
        }

        List<ImportJobLine> lines = lineRepository.findByJobIdAndTenantIdAndIsDeletedFalseOrderByLineIndexAsc(jobId, tenantId);
        List<ImportLedgerEntry> ledgerRows =
                ledgerRepository.findByTenantIdAndJobIdAndIsDeletedFalseOrderByLineIndexAsc(tenantId, jobId);
        Map<Integer, String> ledgerOutcomeByLine = new HashMap<>();
        for (ImportLedgerEntry e : ledgerRows) {
            if (e.getLineIndex() != null) {
                ledgerOutcomeByLine.putIfAbsent(e.getLineIndex(), e.getOutcome());
            }
        }

        List<String> dataColumns = ImportCanonicalFieldCatalog.canonicalFields(jobType);
        StringBuilder sb = new StringBuilder();
        sb.append(META_COLUMNS.stream().map(CsvExportSupport::escapeField).collect(Collectors.joining(",")))
                .append(',')
                .append(dataColumns.stream().map(CsvExportSupport::escapeField).collect(Collectors.joining(",")))
                .append('\n');

        Map<Long, Student> studentsById = preloadStudents(tenantId, lines);
        Map<Long, Teacher> teachersById = preloadTeachers(tenantId, lines);
        Set<Long> userIds = new HashSet<>();
        for (Student s : studentsById.values()) {
            if (s.getParentId() != null) {
                userIds.add(s.getParentId());
            }
        }
        Set<Long> teacherPortalUserIds = new HashSet<>();
        for (Teacher t : teachersById.values()) {
            if (t.getUserId() != null) {
                userIds.add(t.getUserId());
                teacherPortalUserIds.add(t.getUserId());
            }
        }
        Map<Long, User> usersById = loadUsers(tenantId, userIds);
        Map<Long, String> schoolRoleCsvByUserId = schoolRoleCodesCsv(tenantId, teacherPortalUserIds);

        for (ImportJobLine line : lines) {
            Map<String, String> data = switch (jobType) {
                case STUDENTS -> rowForStudentLine(tenantId, line, studentsById, usersById, dataColumns);
                case TEACHERS, STAFF -> rowForTeacherLine(tenantId, line, jobType, teachersById, usersById, schoolRoleCsvByUserId, dataColumns);
                default -> throw new IllegalStateException();
            };
            sb.append(CsvExportSupport.escapeField(String.valueOf(line.getLineIndex())))
                    .append(',')
                    .append(CsvExportSupport.escapeField(blankToEmpty(line.getStatus())))
                    .append(',')
                    .append(CsvExportSupport.escapeField(blankToEmpty(line.getEntityType())))
                    .append(',')
                    .append(CsvExportSupport.escapeField(line.getEntityId() != null ? String.valueOf(line.getEntityId()) : ""))
                    .append(',')
                    .append(CsvExportSupport.escapeField(blankToEmpty(ledgerOutcomeByLine.get(line.getLineIndex()))))
                    .append(',')
                    .append(CsvExportSupport.escapeField(blankToEmpty(line.getErrorMessage())));
            for (String col : dataColumns) {
                sb.append(',').append(CsvExportSupport.escapeField(blankToEmpty(data.get(col))));
            }
            sb.append('\n');
        }

        return CsvExportSupport.utf8BomBytes(sb.toString());
    }

    private Map<String, String> rowForStudentLine(
            String tenantId,
            ImportJobLine line,
            Map<Long, Student> studentsById,
            Map<Long, User> usersById,
            List<String> dataColumns) {
        Map<String, String> payload = parsePayload(line.getPayloadJson());
        StudentImportCanonicalRow.normalize(payload);
        Map<String, String> out = new LinkedHashMap<>();
        for (String c : dataColumns) {
            out.put(c, "");
        }
        if (ImportJobConstants.LINE_SUCCESS.equals(line.getStatus()) && line.getEntityId() != null) {
            Student s = studentsById.get(line.getEntityId());
            if (s != null) {
                out.put("import_mode", "UPSERT");
                out.put("admission_number", nz(s.getAdmissionNumber()));
                out.put("admission_date", s.getAdmissionDate() != null ? s.getAdmissionDate().toString() : "");
                out.put("roll_number", nz(s.getRollNumber()));
                out.put("first_name", nz(s.getFirstName()));
                out.put("last_name", nz(s.getLastName()));
                out.put("gender", s.getGender() != null ? s.getGender().name().toLowerCase(Locale.ROOT) : "");
                out.put("date_of_birth", s.getDateOfBirth() != null ? s.getDateOfBirth().toString() : "");
                out.put("student_email", nz(s.getEmail()));
                out.put("class_id", s.getClassId() != null ? String.valueOf(s.getClassId()) : "");
                out.put("section_id", s.getSectionId() != null ? String.valueOf(s.getSectionId()) : "");
                schoolClassRepository.findByIdAndTenantIdAndIsDeletedFalse(s.getClassId(), tenantId)
                        .map(SchoolClass::getName)
                        .ifPresent(n -> out.put("classname", n));
                if (s.getSectionId() != null) {
                    sectionRepository.findByIdAndTenantIdAndIsDeletedFalse(s.getSectionId(), tenantId)
                            .map(Section::getName)
                            .ifPresent(n -> out.put("sectionname", n));
                }
                out.put("primary_guardian_name", nz(s.getParentName()));
                out.put("parent_id", s.getParentId() != null ? String.valueOf(s.getParentId()) : "");
                if (s.getParentId() != null) {
                    User p = usersById.get(s.getParentId());
                    if (p != null) {
                        out.put("parent_code", nz(p.getParentCode()));
                        out.put("primary_guardian_email", nz(p.getEmail()));
                        out.put("primary_guardian_phone", nz(p.getPhone()));
                    }
                }
                out.put("address", nz(s.getAddress()));
                out.put("blood_group", nz(s.getBloodGroup()));
            }
        }
        mergeStudentPayloadFallback(out, payload);
        return out;
    }

    private void mergeStudentPayloadFallback(Map<String, String> out, Map<String, String> payload) {
        if (payload.isEmpty()) {
            return;
        }
        putIfEmpty(out, "academic_year_id", firstNonBlank(payload.get("academicyearid"), payload.get("academic_year_id")));
        putIfEmpty(out, "import_mode", firstNonBlank(payload.get("importmode"), payload.get("import_mode")));
        if (!out.containsKey("import_mode") || out.get("import_mode").isBlank()) {
            out.put("import_mode", "UPSERT");
        }
        putIfEmpty(out, "admission_number", firstNonBlank(payload.get("admissionnumber"), payload.get("admission_number")));
        putIfEmpty(out, "admission_date", firstNonBlank(payload.get("admissiondate"), payload.get("admission_date")));
        putIfEmpty(out, "roll_number", firstNonBlank(payload.get("rollnumber"), payload.get("roll_number")));
        putIfEmpty(out, "first_name", firstNonBlank(payload.get("firstname"), payload.get("first_name")));
        putIfEmpty(out, "last_name", firstNonBlank(payload.get("lastname"), payload.get("last_name")));
        putIfEmpty(out, "gender", firstNonBlank(payload.get("gender"), payload.get("student_gender")));
        putIfEmpty(out, "date_of_birth", firstNonBlank(payload.get("dateofbirth"), payload.get("date_of_birth")));
        putIfEmpty(out, "student_email", firstNonBlank(payload.get("email"), payload.get("student_email")));
        putIfEmpty(out, "class_id", firstNonBlank(payload.get("classid"), payload.get("class_id")));
        putIfEmpty(out, "section_id", firstNonBlank(payload.get("sectionid"), payload.get("section_id")));
        putIfEmpty(out, "classname", payload.get("classname"));
        putIfEmpty(out, "sectionname", firstNonBlank(payload.get("sectionname"), payload.get("section_name")));
        String rel = StudentImportCanonicalRow.rawPrimaryGuardianRelation(payload);
        putIfEmpty(out, "primary_guardian_relation", rel != null ? rel.toLowerCase(Locale.ROOT) : null);
        putIfEmpty(out, "primary_guardian_name", firstNonBlank(payload.get("parentname"), payload.get("primary_guardian_name")));
        putIfEmpty(out, "primary_guardian_email", firstNonBlank(payload.get("parentemail"), payload.get("primary_guardian_email")));
        putIfEmpty(out, "primary_guardian_phone", firstNonBlank(payload.get("parentphone"), payload.get("primary_guardian_phone")));
        putIfEmpty(out, "parent_code", firstNonBlank(payload.get("parentcode"), payload.get("parent_code")));
        putIfEmpty(out, "parent_id", firstNonBlank(payload.get("parentid"), payload.get("parent_id")));
        putIfEmpty(out, "create_parent_portal", firstNonBlank(payload.get("createparentportal"), payload.get("create_parent_portal")));
        putIfEmpty(out, "notify_credentials", firstNonBlank(payload.get("notifycredentials"), payload.get("notify_credentials")));
        putIfEmpty(out, "address", payload.get("address"));
        putIfEmpty(out, "blood_group", firstNonBlank(payload.get("bloodgroup"), payload.get("blood_group")));
    }

    private Map<String, String> rowForTeacherLine(
            String tenantId,
            ImportJobLine line,
            ImportJobType jobType,
            Map<Long, Teacher> teachersById,
            Map<Long, User> usersById,
            Map<Long, String> schoolRoleCsvByUserId,
            List<String> dataColumns) {
        Map<String, String> payload = parsePayload(line.getPayloadJson());
        Map<String, String> out = new LinkedHashMap<>();
        for (String c : dataColumns) {
            out.put(c, "");
        }
        boolean success = ImportJobConstants.LINE_SUCCESS.equals(line.getStatus()) && line.getEntityId() != null;
        if (success) {
            Teacher t = teachersById.get(line.getEntityId());
            if (t != null) {
                out.put("import_mode", "UPSERT");
                out.put("employee_code", nz(t.getEmployeeCode()));
                out.put("first_name", nz(t.getFirstName()));
                out.put("last_name", nz(t.getLastName()));
                out.put("phone", nz(t.getPhone()));
                out.put("join_date", t.getJoinDate() != null ? t.getJoinDate().toString() : "");
                out.put("status", t.getStatus() != null ? t.getStatus().name() : "");
                out.put("email", nz(t.getEmail()));
                out.put("qualification", nz(t.getQualification()));
                out.put("specialization", nz(t.getSpecialization()));
                out.put("department", nz(t.getSpecialization()));
                out.put("subjects", t.getSubjects() != null ? String.join("|", t.getSubjects()) : "");
                out.put("salary", t.getSalary() != null ? t.getSalary().toPlainString() : "");
                out.put("bank_account_holder", nz(t.getBankAccountHolder()));
                out.put("bank_name", nz(t.getBankName()));
                out.put("bank_account_number", nz(t.getBankAccountNumber()));
                out.put("bank_ifsc", nz(t.getBankIfsc()));
                out.put("create_portal", t.getUserId() != null ? "Y" : "N");
                if (t.getLibraryStaffRole() != null) {
                    out.put("library_role", t.getLibraryStaffRole().name());
                }
                if (t.getUserId() != null) {
                    User u = usersById.get(t.getUserId());
                    if (u != null && u.getRole() != null) {
                        out.put("portal_role", u.getRole().name());
                    }
                    String src = schoolRoleCsvByUserId.get(t.getUserId());
                    if (src != null && !src.isBlank()) {
                        out.put("school_role_codes", src);
                    }
                }
                String slot = resolveClassTeacherSlot(tenantId, t.getId());
                if (!slot.isBlank()) {
                    out.put("class_teacher_slot", slot);
                    out.put("can_class_teacher", jobType == ImportJobType.STAFF ? "" : "Y");
                }
            }
        }
        mergeTeacherPayloadFallback(out, payload);
        if (!out.containsKey("import_mode") || out.get("import_mode").isBlank()) {
            out.put("import_mode", "UPSERT");
        }
        return out;
    }

    private void mergeTeacherPayloadFallback(Map<String, String> out, Map<String, String> payload) {
        if (payload.isEmpty()) {
            return;
        }
        putIfEmpty(out, "academic_year_id", firstNonBlank(
                payload.get("academic_year_id"),
                payload.get("academicyearid")));
        putIfEmpty(out, "import_mode", firstNonBlank(payload.get("import_mode"), payload.get("importmode")));
        putIfEmpty(out, "employee_code", firstNonBlank(payload.get("employee_code"), payload.get("employeecode")));
        putIfEmpty(out, "first_name", firstNonBlank(payload.get("first_name"), payload.get("firstname")));
        putIfEmpty(out, "last_name", firstNonBlank(payload.get("last_name"), payload.get("lastname")));
        putIfEmpty(out, "phone", payload.get("phone"));
        putIfEmpty(out, "join_date", firstNonBlank(payload.get("join_date"), payload.get("joindate")));
        putIfEmpty(out, "status", payload.get("status"));
        putIfEmpty(out, "email", payload.get("email"));
        putIfEmpty(out, "gender", payload.get("gender"));
        putIfEmpty(out, "dob", payload.get("dob"));
        putIfEmpty(out, "qualification", payload.get("qualification"));
        putIfEmpty(out, "specialization", payload.get("specialization"));
        putIfEmpty(out, "department", firstNonBlank(payload.get("department"), payload.get("specialization")));
        putIfEmpty(out, "subjects", payload.get("subjects"));
        putIfEmpty(out, "can_class_teacher", firstNonBlank(payload.get("can_class_teacher"), payload.get("canclassteacher")));
        putIfEmpty(out, "class_teacher_slot", firstNonBlank(
                payload.get("class_teacher_slot"),
                payload.get("classteacherfor"),
                payload.get("classteacherslot")));
        putIfEmpty(out, "create_portal", firstNonBlank(payload.get("create_portal"), payload.get("createportal")));
        putIfEmpty(out, "portal_role", firstNonBlank(payload.get("portal_role"), payload.get("portalrole")));
        putIfEmpty(out, "library_role", firstNonBlank(payload.get("library_role"), payload.get("libraryrole")));
        putIfEmpty(out, "school_role_codes", firstNonBlank(payload.get("school_role_codes"), payload.get("schoolrolecodes")));
        putIfEmpty(out, "notify_credentials", firstNonBlank(payload.get("notify_credentials"), payload.get("notifycredentials")));
        putIfEmpty(out, "salary", payload.get("salary"));
        putIfEmpty(out, "bank_account_holder", firstNonBlank(payload.get("bank_account_holder"), payload.get("bankaccountholder")));
        putIfEmpty(out, "bank_name", firstNonBlank(payload.get("bank_name"), payload.get("bankname")));
        putIfEmpty(out, "bank_account_number", firstNonBlank(payload.get("bank_account_number"), payload.get("bankaccountnumber")));
        putIfEmpty(out, "bank_ifsc", firstNonBlank(payload.get("bank_ifsc"), payload.get("bankifsc")));
    }

    private String resolveClassTeacherSlot(String tenantId, Long teacherId) {
        if (teacherId == null) {
            return "";
        }
        List<String> labels = new ArrayList<>();
        for (SchoolClass c : schoolClassRepository.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId)) {
            if (teacherId.equals(c.getClassTeacherId())) {
                labels.add(c.getName());
            }
            for (Section sec : sectionRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, c.getId())) {
                if (teacherId.equals(sec.getClassTeacherId())) {
                    labels.add(c.getName() + "-" + sec.getName());
                }
            }
        }
        return String.join("|", labels);
    }

    private Map<Long, Student> preloadStudents(String tenantId, List<ImportJobLine> lines) {
        List<Long> ids = lines.stream()
                .filter(l -> ImportJobConstants.LINE_SUCCESS.equals(l.getStatus()))
                .filter(l -> "STUDENT".equalsIgnoreCase(blankToNull(l.getEntityType())))
                .map(ImportJobLine::getEntityId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<Long, Student> map = new HashMap<>();
        for (Student s : studentPersistence.findByTenantIdAndIdInAndIsDeletedFalse(tenantId, ids)) {
            map.put(s.getId(), s);
        }
        return map;
    }

    private Map<Long, Teacher> preloadTeachers(String tenantId, List<ImportJobLine> lines) {
        List<Long> ids = lines.stream()
                .filter(l -> ImportJobConstants.LINE_SUCCESS.equals(l.getStatus()))
                .filter(l -> {
                    String et = l.getEntityType();
                    return et != null && (et.equalsIgnoreCase("TEACHER") || et.equalsIgnoreCase("STAFF"));
                })
                .map(ImportJobLine::getEntityId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<Long, Teacher> map = new HashMap<>();
        for (Long id : ids) {
            teacherRepository.findByIdAndTenantIdAndIsDeletedFalse(id, tenantId).ifPresent(t -> map.put(t.getId(), t));
        }
        return map;
    }

    private Map<Long, User> loadUsers(String tenantId, Set<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, User> map = new HashMap<>();
        for (Long uid : userIds) {
            userRepository.findByIdAndTenantIdAndIsDeletedFalse(uid, tenantId).ifPresent(u -> map.put(u.getId(), u));
        }
        return map;
    }

    private Map<Long, String> schoolRoleCodesCsv(String tenantId, Collection<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Map.of();
        }
        List<UserSchoolRoleAssignment> roleRows =
                userSchoolRoleAssignmentRepository.findByTenantIdAndUserIdInFetchRoles(tenantId, userIds);
        Map<Long, List<String>> rolesByUser = new HashMap<>();
        for (UserSchoolRoleAssignment a : roleRows) {
            if (a.getUserId() == null || a.getSchoolRole() == null) {
                continue;
            }
            String code = a.getSchoolRole().getCode();
            if (code == null || code.isBlank()) {
                continue;
            }
            rolesByUser.computeIfAbsent(a.getUserId(), k -> new ArrayList<>()).add(code);
        }
        Map<Long, String> out = new HashMap<>();
        for (Map.Entry<Long, List<String>> e : rolesByUser.entrySet()) {
            String joined = e.getValue().stream().distinct().sorted().collect(Collectors.joining(","));
            out.put(e.getKey(), joined);
        }
        return out;
    }

    private Map<String, String> parsePayload(String json) {
        if (json == null || json.isBlank()) {
            return new HashMap<>();
        }
        try {
            Map<String, String> raw = objectMapper.readValue(json, new TypeReference<>() {
            });
            if (raw == null) {
                return new HashMap<>();
            }
            Map<String, String> out = new HashMap<>();
            for (Map.Entry<String, String> e : raw.entrySet()) {
                if (e.getKey() != null && e.getValue() != null) {
                    out.put(e.getKey(), e.getValue());
                }
            }
            return out;
        } catch (Exception ex) {
            return new HashMap<>();
        }
    }

    private static void putIfEmpty(Map<String, String> out, String key, String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        String cur = out.get(key);
        if (cur == null || cur.isBlank()) {
            out.put(key, value);
        }
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v.trim();
            }
        }
        return null;
    }

    private static String nz(String v) {
        return v != null ? v : "";
    }

    private static String blankToEmpty(String s) {
        return s != null ? s : "";
    }

    private static String blankToNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s;
    }
}
