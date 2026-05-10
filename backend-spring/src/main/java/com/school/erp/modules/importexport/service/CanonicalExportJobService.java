package com.school.erp.modules.importexport.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.export.CsvExportSupport;
import com.school.erp.modules.academic.entity.SchoolClass;
import com.school.erp.modules.academic.entity.Section;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
import com.school.erp.modules.academic.repository.SectionRepository;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.fees.entity.FeeComponent;
import com.school.erp.modules.fees.entity.FeeStructure;
import com.school.erp.modules.fees.repository.FeeComponentRepository;
import com.school.erp.modules.fees.repository.FeeStructureRepository;
import com.school.erp.modules.importexport.ImportCanonicalFieldCatalog;
import com.school.erp.modules.importexport.ImportJobType;
import com.school.erp.modules.importexport.dto.ImportExportDTOs;
import com.school.erp.modules.importexport.entity.CanonicalExportJob;
import com.school.erp.modules.importexport.repository.CanonicalExportJobRepository;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.modules.teacher.entity.Teacher;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.tenant.TenantContext;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CanonicalExportJobService {
    private static final Set<String> TERMINAL_STATES = Set.of("COMPLETED", "FAILED");
    private static final Set<Enums.Role> STAFF_PORTAL_ROLES = EnumSet.of(Enums.Role.SCHOOL_STAFF, Enums.Role.LIBRARY_STAFF);
    private final CanonicalExportJobRepository canonicalExportJobRepository;
    private final CanonicalExportJobAsyncLauncher asyncLauncher;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SectionRepository sectionRepository;
    private final FeeStructureRepository feeStructureRepository;
    private final FeeComponentRepository feeComponentRepository;

    public CanonicalExportJobService(
            CanonicalExportJobRepository canonicalExportJobRepository,
            @Lazy CanonicalExportJobAsyncLauncher asyncLauncher,
            StudentRepository studentRepository,
            TeacherRepository teacherRepository,
            UserRepository userRepository,
            SchoolClassRepository schoolClassRepository,
            SectionRepository sectionRepository,
            FeeStructureRepository feeStructureRepository,
            FeeComponentRepository feeComponentRepository) {
        this.canonicalExportJobRepository = canonicalExportJobRepository;
        this.asyncLauncher = asyncLauncher;
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
        this.userRepository = userRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.sectionRepository = sectionRepository;
        this.feeStructureRepository = feeStructureRepository;
        this.feeComponentRepository = feeComponentRepository;
    }

    @Transactional
    public ImportExportDTOs.ExportJobSummaryResponse createJob(String exportTypeRaw) {
        ImportJobType exportType = parseExportType(exportTypeRaw);
        CanonicalExportJob job = new CanonicalExportJob();
        job.setTenantId(TenantContext.getTenantId());
        job.setExportType(exportType.name());
        job.setStatus("QUEUED");
        job.setRequestedByUserId(TenantContext.getUserId());
        canonicalExportJobRepository.save(job);
        asyncLauncher.start(job.getId(), job.getTenantId(), TenantContext.getUserId(), TenantContext.getUserRole());
        return toSummary(job);
    }

    @Transactional(readOnly = true)
    public PageResponse<ImportExportDTOs.ExportJobSummaryResponse> listJobs(int page, int size) {
        var p = canonicalExportJobRepository.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(
                TenantContext.getTenantId(), PageRequest.of(Math.max(0, page), Math.min(Math.max(size, 1), 100)));
        List<ImportExportDTOs.ExportJobSummaryResponse> content = p.getContent().stream().map(this::toSummary).toList();
        return PageResponse.of(content, page, size, p.getTotalElements());
    }

    @Transactional(readOnly = true)
    public ImportExportDTOs.ExportJobSummaryResponse getJob(Long id) {
        return toSummary(requireJob(id));
    }

    @Transactional(readOnly = true)
    public byte[] download(Long id) {
        CanonicalExportJob job = requireJob(id);
        if (!"COMPLETED".equalsIgnoreCase(job.getStatus()) || job.getFileContent() == null) {
            throw new BusinessException("Export is not ready yet. Please wait for status COMPLETED.");
        }
        return job.getFileContent();
    }

    @Transactional(readOnly = true)
    public String downloadFileName(Long id) {
        CanonicalExportJob job = requireJob(id);
        return job.getFileName() != null ? job.getFileName() : ("canonical-export-" + id + ".csv");
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void executeJob(Long jobId, String tenantId) {
        CanonicalExportJob job = canonicalExportJobRepository.findByIdAndTenantIdAndIsDeletedFalse(jobId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("CanonicalExportJob", jobId));
        if (TERMINAL_STATES.contains(job.getStatus())) {
            return;
        }
        try {
            job.setStatus("RUNNING");
            job.setStartedAt(LocalDateTime.now());
            canonicalExportJobRepository.save(job);

            ImportJobType type = ImportJobType.valueOf(job.getExportType());
            CsvBuildResult out = buildCanonicalCsv(type, tenantId);
            String fileName = "canonical-" + type.name().toLowerCase(Locale.ROOT) + "-" + LocalDate.now() + ".csv";

            job.setStatus("COMPLETED");
            job.setFileName(fileName);
            job.setContentType("text/csv;charset=UTF-8");
            job.setFileContent(out.bytes);
            job.setContentSizeBytes((long) out.bytes.length);
            job.setRowCount(out.rowCount);
            job.setErrorMessage(null);
            job.setFinishedAt(LocalDateTime.now());
            canonicalExportJobRepository.save(job);
        } catch (Exception ex) {
            job.setStatus("FAILED");
            job.setErrorMessage(ex.getMessage() == null ? ex.getClass().getSimpleName() : ex.getMessage());
            job.setFinishedAt(LocalDateTime.now());
            canonicalExportJobRepository.save(job);
        }
    }

    private CsvBuildResult buildCanonicalCsv(ImportJobType type, String tenantId) {
        List<String> canonical = ImportCanonicalFieldCatalog.canonicalFields(type);
        if (canonical.isEmpty()) {
            throw new BusinessException("Canonical export is not supported for type: " + type);
        }
        List<Map<String, String>> rows = switch (type) {
            case STUDENTS -> buildStudentRows(tenantId);
            case TEACHERS -> buildTeacherRows(tenantId, false);
            case STAFF -> buildTeacherRows(tenantId, true);
            case FEE_STRUCTURES -> buildFeeStructureRows(tenantId);
            default -> throw new BusinessException("Unsupported export type for now: " + type);
        };
        String csv = renderCsv(canonical, rows);
        return new CsvBuildResult(CsvExportSupport.utf8BomBytes(csv), rows.size());
    }

    private List<Map<String, String>> buildStudentRows(String tenantId) {
        List<Student> students = new ArrayList<>();
        int page = 0;
        Pageable pageable = PageRequest.of(0, 200);
        while (true) {
            var batch = studentRepository.findByTenantIdAndIsDeletedFalse(tenantId, PageRequest.of(page, pageable.getPageSize()));
            students.addAll(batch.getContent());
            if (batch.isLast()) break;
            page++;
        }
        Map<Long, SchoolClass> classById = schoolClassRepository.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId)
                .stream().collect(Collectors.toMap(SchoolClass::getId, c -> c));
        Map<Long, Section> sectionById = sectionRepository.findByTenantIdAndClassIdInAndIsDeletedFalse(
                        tenantId, new ArrayList<>(classById.keySet()))
                .stream().collect(Collectors.toMap(Section::getId, s -> s));
        Map<Long, User> parentById = loadUsersById(tenantId, students.stream().map(Student::getParentId).filter(v -> v != null).toList());

        List<Map<String, String>> out = new ArrayList<>();
        for (Student s : students) {
            SchoolClass c = s.getClassId() != null ? classById.get(s.getClassId()) : null;
            Section sec = s.getSectionId() != null ? sectionById.get(s.getSectionId()) : null;
            User p = s.getParentId() != null ? parentById.get(s.getParentId()) : null;
            Map<String, String> row = new LinkedHashMap<>();
            row.put("academic_year_id", "CURRENT");
            row.put("import_mode", "UPSERT");
            row.put("admission_number", nz(s.getAdmissionNumber()));
            row.put("admission_date", s.getAdmissionDate() == null ? "" : s.getAdmissionDate().toString());
            row.put("roll_number", nz(s.getRollNumber()));
            row.put("first_name", nz(s.getFirstName()));
            row.put("last_name", nz(s.getLastName()));
            row.put("gender", s.getGender() == null ? "" : s.getGender().name());
            row.put("date_of_birth", s.getDateOfBirth() == null ? "" : s.getDateOfBirth().toString());
            row.put("student_email", nz(s.getEmail()));
            row.put("class_id", c != null ? String.valueOf(c.getId()) : "");
            row.put("section_id", sec != null ? String.valueOf(sec.getId()) : "");
            row.put("classname", c != null ? nz(c.getName()) : "");
            row.put("sectionname", sec != null ? nz(sec.getName()) : "");
            row.put("primary_guardian_relation", "");
            row.put("primary_guardian_name", firstNonBlank(nz(s.getParentName()), p != null ? p.getName() : ""));
            row.put("primary_guardian_email", p != null ? nz(p.getEmail()) : "");
            row.put("primary_guardian_phone", p != null ? nz(p.getPhone()) : "");
            row.put("parent_code", p != null ? nz(p.getParentCode()) : "");
            row.put("parent_id", p != null && p.getId() != null ? String.valueOf(p.getId()) : "");
            row.put("create_parent_portal", "N");
            row.put("notify_credentials", "N");
            row.put("address", nz(s.getAddress()));
            row.put("blood_group", nz(s.getBloodGroup()));
            out.add(row);
        }
        return out;
    }

    private List<Map<String, String>> buildTeacherRows(String tenantId, boolean staffOnly) {
        List<Teacher> teachers = new ArrayList<>();
        int page = 0;
        while (true) {
            var batch = teacherRepository.findByTenantIdAndIsDeletedFalse(tenantId, PageRequest.of(page, 200));
            teachers.addAll(batch.getContent());
            if (batch.isLast()) break;
            page++;
        }
        Map<Long, User> userById = loadUsersById(tenantId, teachers.stream().map(Teacher::getUserId).filter(v -> v != null).toList());
        List<Map<String, String>> out = new ArrayList<>();
        for (Teacher t : teachers) {
            User user = t.getUserId() != null ? userById.get(t.getUserId()) : null;
            boolean isStaff = user != null && STAFF_PORTAL_ROLES.contains(user.getRole());
            if (staffOnly && !isStaff) continue;
            if (!staffOnly && isStaff) continue;
            Map<String, String> row = new LinkedHashMap<>();
            row.put("academic_year_id", "CURRENT");
            row.put("import_mode", "UPSERT");
            row.put("employee_code", nz(t.getEmployeeCode()));
            row.put("first_name", nz(t.getFirstName()));
            row.put("last_name", nz(t.getLastName()));
            row.put("phone", nz(t.getPhone()));
            row.put("join_date", t.getJoinDate() == null ? "" : t.getJoinDate().toString());
            row.put("status", t.getStatus() == null ? "" : t.getStatus().name());
            row.put("email", nz(t.getEmail()));
            row.put("gender", "");
            row.put("dob", "");
            row.put("qualification", nz(t.getQualification()));
            row.put("specialization", nz(t.getSpecialization()));
            row.put("department", "");
            row.put("subjects", t.getSubjects() == null ? "" : String.join("|", t.getSubjects()));
            row.put("can_class_teacher", "");
            row.put("class_teacher_slot", "");
            row.put("create_portal", user != null ? "Y" : "N");
            row.put("portal_password", "");
            row.put("portal_role", user != null && user.getRole() != null ? user.getRole().name() : (staffOnly ? "SCHOOL_STAFF" : "TEACHER"));
            row.put("library_role", t.getLibraryStaffRole() == null ? "" : t.getLibraryStaffRole().name());
            row.put("school_role_codes", "");
            row.put("notify_credentials", "N");
            row.put("salary", t.getSalary() == null ? "" : t.getSalary().toPlainString());
            row.put("bank_account_holder", nz(t.getBankAccountHolder()));
            row.put("bank_name", nz(t.getBankName()));
            row.put("bank_account_number", nz(t.getBankAccountNumber()));
            row.put("bank_ifsc", nz(t.getBankIfsc()));
            out.add(row);
        }
        return out;
    }

    private List<Map<String, String>> buildFeeStructureRows(String tenantId) {
        List<FeeStructure> structures = feeStructureRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        Map<Long, List<FeeComponent>> componentsByStructure = feeComponentRepository
                .findByTenantIdAndFeeStructureIdIn(tenantId, structures.stream().map(FeeStructure::getId).toList())
                .stream()
                .collect(Collectors.groupingBy(FeeComponent::getFeeStructureId));
        List<Map<String, String>> out = new ArrayList<>();
        for (FeeStructure f : structures) {
            List<FeeComponent> components = componentsByStructure.getOrDefault(f.getId(), List.of());
            String componentSpec = components.stream()
                    .map(c -> nz(c.getName()) + ":" + (c.getAmount() == null ? "0" : c.getAmount().toPlainString()))
                    .collect(Collectors.joining("|"));
            Map<String, String> row = new LinkedHashMap<>();
            row.put("name", nz(f.getName()));
            row.put("class_id", f.getClassId() == null ? "" : String.valueOf(f.getClassId()));
            row.put("class_name", nz(f.getClassName()));
            row.put("academic_year_id", f.getAcademicYearId() == null ? "CURRENT" : String.valueOf(f.getAcademicYearId()));
            row.put("component_spec", componentSpec);
            row.put("import_mode", "UPSERT");
            out.add(row);
        }
        return out;
    }

    private String renderCsv(List<String> canonical, List<Map<String, String>> rows) {
        StringBuilder sb = new StringBuilder();
        sb.append(canonical.stream().map(CsvExportSupport::escapeField).collect(Collectors.joining(","))).append('\n');
        for (Map<String, String> row : rows) {
            List<String> values = new ArrayList<>();
            for (String key : canonical) {
                values.add(CsvExportSupport.escapeField(row.getOrDefault(key, "")));
            }
            sb.append(String.join(",", values)).append('\n');
        }
        return sb.toString();
    }

    private Map<Long, User> loadUsersById(String tenantId, Collection<Long> ids) {
        if (ids == null || ids.isEmpty()) return Map.of();
        List<Long> unique = ids.stream().filter(v -> v != null).distinct().toList();
        if (unique.isEmpty()) return Map.of();
        return userRepository.findByTenantIdAndIdInAndIsDeletedFalse(tenantId, unique)
                .stream()
                .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a, HashMap::new));
    }

    private CanonicalExportJob requireJob(Long id) {
        return canonicalExportJobRepository.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("CanonicalExportJob", id));
    }

    private ImportJobType parseExportType(String raw) {
        if (raw == null || raw.isBlank()) throw new BusinessException("exportType is required");
        ImportJobType type;
        try {
            type = ImportJobType.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new BusinessException("Unsupported exportType. Use STUDENTS, TEACHERS, STAFF, or FEE_STRUCTURES.");
        }
        if (!Set.of(ImportJobType.STUDENTS, ImportJobType.TEACHERS, ImportJobType.STAFF, ImportJobType.FEE_STRUCTURES).contains(type)) {
            throw new BusinessException("Unsupported exportType. Use STUDENTS, TEACHERS, STAFF, or FEE_STRUCTURES.");
        }
        return type;
    }

    private ImportExportDTOs.ExportJobSummaryResponse toSummary(CanonicalExportJob job) {
        ImportExportDTOs.ExportJobSummaryResponse out = new ImportExportDTOs.ExportJobSummaryResponse();
        out.setId(job.getId());
        out.setExportType(job.getExportType());
        out.setStatus(job.getStatus());
        out.setFileName(job.getFileName());
        out.setContentSizeBytes(job.getContentSizeBytes());
        out.setRowCount(job.getRowCount());
        out.setErrorMessage(job.getErrorMessage());
        out.setStartedAt(job.getStartedAt());
        out.setFinishedAt(job.getFinishedAt());
        out.setCreatedAt(job.getCreatedAt());
        return out;
    }

    private String nz(String v) { return v == null ? "" : v; }
    private String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank()) return a;
        return b == null ? "" : b;
    }

    private record CsvBuildResult(byte[] bytes, int rowCount) {}
}
