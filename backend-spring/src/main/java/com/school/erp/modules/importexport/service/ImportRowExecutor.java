package com.school.erp.modules.importexport.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.importer.BulkImportRowPolicy;
import com.school.erp.modules.auth.service.PortalUserProvisioningService;
import com.school.erp.modules.importexport.ImportJobType;
import com.school.erp.modules.importexport.entity.ImportJob;
import com.school.erp.modules.importexport.entity.ImportJobLine;
import com.school.erp.modules.notification.service.NotificationService;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.modules.student.dto.StudentDTOs;
import com.school.erp.modules.student.service.StudentService;
import com.school.erp.modules.teacher.dto.TeacherDTOs;
import com.school.erp.modules.teacher.entity.Teacher;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.modules.teacher.service.TeacherService;
import com.school.erp.modules.timetable.entity.TimetableEntry;
import com.school.erp.modules.timetable.repository.TimetableRepository;
import com.school.erp.modules.timetable.service.TimetableService;
import com.school.erp.platform.port.NotificationDispatchPort;
import com.school.erp.tenant.TenantContext;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Executes one CSV / Excel row inside a dedicated transaction (see {@link ImportLineTransactionalRunner}).
 */
@Service
public class ImportRowExecutor {
    private final ObjectMapper objectMapper;
    private final StudentService studentService;
    private final TeacherService teacherService;
    private final TeacherRepository teacherRepository;
    private final com.school.erp.modules.academic.service.AcademicService academicService;
    private final TimetableService timetableService;
    private final TimetableRepository timetableRepository;
    private final PortalUserProvisioningService portalUserProvisioningService;
    private final NotificationService notificationService;
    private final NotificationDispatchPort notificationDispatchPort;
    private final TenantConfigRepository tenantConfigRepository;
    private final BulkImportAcademicResolver academicResolver;
    private final ImportBulkRowValidator bulkRowValidator;

    public ImportRowExecutor(ObjectMapper objectMapper,
                           StudentService studentService,
                           TeacherService teacherService,
                           TeacherRepository teacherRepository,
                           com.school.erp.modules.academic.service.AcademicService academicService,
                           TimetableService timetableService,
                           TimetableRepository timetableRepository,
                           PortalUserProvisioningService portalUserProvisioningService,
                           NotificationService notificationService,
                           NotificationDispatchPort notificationDispatchPort,
                           TenantConfigRepository tenantConfigRepository,
                           BulkImportAcademicResolver academicResolver,
                           ImportBulkRowValidator bulkRowValidator) {
        this.objectMapper = objectMapper;
        this.studentService = studentService;
        this.teacherService = teacherService;
        this.teacherRepository = teacherRepository;
        this.academicService = academicService;
        this.timetableService = timetableService;
        this.timetableRepository = timetableRepository;
        this.portalUserProvisioningService = portalUserProvisioningService;
        this.notificationService = notificationService;
        this.notificationDispatchPort = notificationDispatchPort;
        this.tenantConfigRepository = tenantConfigRepository;
        this.academicResolver = academicResolver;
        this.bulkRowValidator = bulkRowValidator;
    }

    public void execute(ImportJob job, ImportJobLine line) throws Exception {
        ImportJobType type = ImportJobType.valueOf(job.getJobType());
        Map<String, String> row = objectMapper.readValue(line.getPayloadJson(), new TypeReference<>() {
        });
        bulkRowValidator.validateBeforePersist(type, row, false);
        switch (type) {
            case STUDENTS -> {
                BulkImportAcademicResolver.ResolvedPlacement placement = academicResolver.resolveClassAndSection(row);
                handleStudent(job, line, row, placement);
            }
            case TEACHERS -> handleTeacher(job, line, row, false);
            case STAFF -> handleTeacher(job, line, row, true);
            case CLASSES -> handleClass(line, row);
            case TIMETABLE -> handleTimetable(line, row);
        }
    }

    private void handleStudent(ImportJob job, ImportJobLine line, Map<String, String> row,
                             BulkImportAcademicResolver.ResolvedPlacement placement) {
        String tenantId = TenantContext.getTenantId();

        StudentDTOs.CreateRequest request = new StudentDTOs.CreateRequest();
        request.setFirstName(required(row, "firstname"));
        request.setLastName(required(row, "lastname"));
        request.setEmail(blankToNull(row.get("email")));
        request.setPhone(blankToNull(row.get("phone")));
        request.setDateOfBirth(parseDate(row.get("dateofbirth")));
        request.setGender(parseGender(row.get("gender")));
        request.setClassId(placement.classId());
        request.setSectionId(placement.sectionId());
        request.setRollNumber(blankToNull(row.get("rollnumber")));
        request.setAdmissionNumber(blankToNull(row.get("admissionnumber")));
        request.setAdmissionDate(parseDate(row.get("admissiondate")));
        request.setAddress(blankToNull(row.get("address")));
        request.setBloodGroup(blankToNull(row.get("bloodgroup")));

        BulkImportRowPolicy policy = BulkImportRowPolicy.fromCsv(row.get("importmode"));

        String parentEmail = blankToNull(row.get("parentemail"));
        String parentPhone = blankToNull(row.get("parentphone"));

        PortalUserProvisioningService.ProvisionResult parentProvision = null;
        if (parentEmail != null || parentPhone != null || truthy(row.get("createparentportal"))) {
            String parentName = blankToNull(row.get("parentname"));
            if (parentName == null) {
                parentName = parentEmail != null ? parentEmail : (parentPhone != null ? parentPhone : "Parent");
            }
            parentProvision = portalUserProvisioningService.ensureParentUserForImport(tenantId, parentName, parentEmail, parentPhone);
            request.setParentId(parentProvision.userId());
            if (request.getParentName() == null) {
                request.setParentName(parentName);
            }
        } else {
            request.setParentId(parseLong(row.get("parentid")));
            request.setParentName(blankToNull(row.get("parentname")));
        }

        StudentDTOs.Response created = studentService.importStudentRow(request, policy);
        line.setEntityType("STUDENT");
        line.setEntityId(created.getId());

        if (truthy(row.get("notifycredentials")) && parentProvision != null) {
            String schoolCode = tenantConfigRepository.findByTenantId(tenantId).map(c -> c.getSchoolCode()).orElse("");
            String body = credentialMessage(schoolCode, parentEmail, parentPhone, parentProvision.plainPassword(), parentProvision.createdNew());
            notificationService.createNotification(tenantId, parentProvision.userId(), "Parent portal access",
                    body, Enums.NotificationType.INFO, "/app/parent/children");
            // Persists to transactional outbox (see NotificationOutboxService) for async delivery / retries.
            notificationDispatchPort.enqueue(tenantId, "PARENT_PORTAL_CREDENTIALS", "SMS",
                    parentProvision.userId(), parentPhone, "Parent portal access", body,
                    "import-job-" + job.getId() + "-line-" + line.getId(), "import-" + job.getId());
        }
    }

    private void handleTeacher(ImportJob job, ImportJobLine line, Map<String, String> row, boolean staffImport) {
        TeacherDTOs.CreateRequest request = new TeacherDTOs.CreateRequest();
        request.setFirstName(required(row, "firstname"));
        request.setLastName(required(row, "lastname"));
        request.setEmail(required(row, "email"));
        request.setPhone(blankToNull(row.get("phone")));
        request.setQualification(blankToNull(row.get("qualification")));
        request.setSpecialization(blankToNull(row.get("specialization")));
        request.setJoinDate(parseDate(row.get("joindate")));
        request.setSalary(parseDecimal(row.get("salary")));
        request.setSubjects(parseSubjects(row.get("subjects")));
        request.setBankAccountHolder(blankToNull(row.get("bankaccountholder")));
        request.setBankName(blankToNull(row.get("bankname")));
        request.setBankAccountNumber(blankToNull(row.get("bankaccountnumber")));
        request.setBankIfsc(blankToNull(row.get("bankifsc")));

        boolean createPortal;
        if (staffImport) {
            createPortal = row.get("createportal") == null || row.get("createportal").isBlank() || truthy(row.get("createportal"));
        } else {
            createPortal = truthy(row.get("createportal"));
        }
        Enums.Role portalRole = parsePortalRole(row.get("portalrole"), staffImport);
        Enums.LibraryStaffRole libRole = parseLibraryRole(row.get("libraryrole"));

        if (portalRole == Enums.Role.LIBRARY_STAFF && libRole == null) {
            libRole = Enums.LibraryStaffRole.LIBRARIAN;
        }
        if (portalRole == Enums.Role.TEACHER) {
            libRole = null;
        }

        BulkImportRowPolicy policy = BulkImportRowPolicy.fromCsv(row.get("importmode"));

        TeacherDTOs.Response created = teacherService.upsertTeacherForImport(request, createPortal, portalRole, libRole, policy);
        line.setEntityType("TEACHER");
        line.setEntityId(created.getId());

        if (createPortal && truthy(row.get("notifycredentials"))) {
            String tenantId = TenantContext.getTenantId();
            String schoolCode = tenantConfigRepository.findByTenantId(tenantId).map(c -> c.getSchoolCode()).orElse("");
            String body = "Your " + (portalRole == Enums.Role.LIBRARY_STAFF ? "library staff" : "teacher")
                    + " portal is ready. School code: " + schoolCode + ". Sign in with this email; use Forgot password or phone OTP if needed.";
            if (created.getUserId() != null) {
                notificationService.createNotification(tenantId, created.getUserId(), "Staff portal access",
                        body, Enums.NotificationType.INFO, "/app/dashboard");
                notificationDispatchPort.enqueue(tenantId, "STAFF_PORTAL_CREDENTIALS", "SMS", created.getUserId(),
                        request.getPhone(), "Staff portal access", body,
                        "import-job-" + job.getId() + "-line-" + line.getId(), "import-" + job.getId());
            }
        }
    }

    private void handleClass(ImportJobLine line, Map<String, String> row) {
        Long resolvedAcademicYearId = academicResolver.resolveAcademicYearId(row.get("academicyearid"));
        com.school.erp.modules.academic.dto.AcademicDTOs.CreateClassRequest req = com.school.erp.modules.academic.dto.AcademicDTOs.CreateClassRequest.builder()
                .name(required(row, "name"))
                .grade(Integer.parseInt(required(row, "grade")))
                .academicYearId(resolvedAcademicYearId)
                .sectionNames(parsePipeList(row.get("sections")))
                .sectionCapacity(parseInt(row.get("sectioncapacity")))
                .build();
        com.school.erp.modules.academic.entity.SchoolClass created = academicService.createClass(req);
        line.setEntityType("CLASS");
        line.setEntityId(created.getId());
    }

    private void handleTimetable(ImportJobLine line, Map<String, String> row) {
        String tenantId = TenantContext.getTenantId();
        BulkImportAcademicResolver.ResolvedPlacement placement = academicResolver.resolveClassAndSection(row);
        Long academicYearId = academicResolver.resolveAcademicYearId(row.get("academicyearid"));
        Teacher teacher = resolveTimetableTeacher(row, tenantId);
        Enums.DayOfWeek day = Enums.DayOfWeek.valueOf(required(row, "dayofweek").trim().toUpperCase(Locale.ROOT));
        Integer period = Integer.parseInt(required(row, "period"));
        LocalTime startTime = parseTimeRequired(row.get("starttime"), "starttime");
        LocalTime endTime = parseTimeRequired(row.get("endtime"), "endtime");
        if (!startTime.isBefore(endTime)) {
            throw new BusinessException("starttime must be earlier than endtime");
        }

        TimetableEntry upsert = TimetableEntry.builder()
                .classId(placement.classId())
                .sectionId(placement.sectionId())
                .day(day)
                .period(period)
                .startTime(startTime)
                .endTime(endTime)
                .subjectName(required(row, "subjectname"))
                .teacherId(teacher.getId())
                .teacherName((teacher.getFirstName() + " " + teacher.getLastName()).trim())
                .room(blankToNull(row.get("room")))
                .build();
        upsert.setAcademicYearId(academicYearId);

        TimetableEntry saved = timetableRepository
                .findFirstByTenantAndClassSectionDayPeriod(tenantId, placement.classId(), placement.sectionId(), day, period)
                .map(existing -> {
                    TimetableEntry patch = new TimetableEntry();
                    patch.setSubjectName(upsert.getSubjectName());
                    patch.setTeacherId(upsert.getTeacherId());
                    patch.setTeacherName(upsert.getTeacherName());
                    patch.setStartTime(upsert.getStartTime());
                    patch.setEndTime(upsert.getEndTime());
                    patch.setRoom(upsert.getRoom());
                    patch.setAcademicYearId(upsert.getAcademicYearId());
                    return timetableService.updateEntry(existing.getId(), patch, null);
                })
                .orElseGet(() -> timetableService.createEntry(upsert, null));

        line.setEntityType("TIMETABLE");
        line.setEntityId(saved.getId());
    }

    private Teacher resolveTimetableTeacher(Map<String, String> row, String tenantId) {
        String teacherEmail = blankToNull(row.get("teacheremail"));
        Long teacherId = parseLong(row.get("teacherid"));
        if (teacherId != null) {
            return teacherRepository.findByIdAndTenantIdAndIsDeletedFalse(teacherId, tenantId)
                    .orElseThrow(() -> new BusinessException("Teacher not found for teacherid: " + teacherId));
        }
        if (teacherEmail != null) {
            return teacherRepository.findByTenantIdAndEmailIgnoreCaseAndIsDeletedFalse(tenantId, teacherEmail)
                    .orElseThrow(() -> new BusinessException("Teacher not found for teacheremail: " + teacherEmail));
        }
        throw new BusinessException("teacheremail or teacherid is required");
    }

    private static String credentialMessage(String schoolCode, String email, String phone, String plainPassword, boolean createdNew) {
        if (createdNew && plainPassword != null) {
            String loginHint = email != null ? "Email: " + email : "Phone: " + phone;
            return "Welcome to the parent portal. School code: " + schoolCode + ". " + loginHint
                    + ". Temporary password: " + plainPassword + ". You can also sign in with OTP on your registered phone.";
        }
        return "Your parent portal account is linked to this student. School code: " + schoolCode
                + ". Sign in with your email or phone OTP.";
    }

    private static Enums.Role parsePortalRole(String raw, boolean staffImport) {
        String n = blankToNull(raw);
        if (n == null) {
            return staffImport ? Enums.Role.LIBRARY_STAFF : Enums.Role.TEACHER;
        }
        return switch (n.toUpperCase(Locale.ROOT)) {
            case "LIBRARY", "LIBRARY_STAFF", "LIB" -> Enums.Role.LIBRARY_STAFF;
            case "TEACHER", "TCH", "T" -> Enums.Role.TEACHER;
            default -> throw new BusinessException("Invalid portalrole: " + raw);
        };
    }

    private static Enums.LibraryStaffRole parseLibraryRole(String raw) {
        String n = blankToNull(raw);
        if (n == null) {
            return null;
        }
        return Enums.LibraryStaffRole.valueOf(n.trim().toUpperCase(Locale.ROOT));
    }

    private static boolean truthy(String v) {
        if (v == null) {
            return false;
        }
        String s = v.trim().toLowerCase(Locale.ROOT);
        return s.equals("y") || s.equals("yes") || s.equals("true") || s.equals("1");
    }

    private static List<String> parsePipeList(String value) {
        String normalized = blankToNull(value);
        if (normalized == null) {
            return new ArrayList<>();
        }
        return java.util.Arrays.stream(normalized.split("\\|"))
                .map(String::trim)
                .filter(part -> !part.isEmpty())
                .collect(Collectors.toList());
    }

    private static Integer parseInt(String value) {
        String n = blankToNull(value);
        return n != null ? Integer.parseInt(n) : null;
    }

    private static String required(Map<String, String> row, String key) {
        String value = blankToNull(row.get(key));
        if (value == null) {
            throw new BusinessException("Missing required column: " + key);
        }
        return value;
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        if (normalized.isEmpty()) {
            return null;
        }
        String upper = normalized.toUpperCase(Locale.ROOT);
        if (upper.equals("AUTO") || upper.equals("CURRENT") || upper.equals("N/A") || upper.equals("NA")
                || upper.equals("NULL") || upper.equals("-")) {
            return null;
        }
        return normalized;
    }

    private static Long parseLong(String value) {
        String normalized = blankToNull(value);
        return normalized != null ? Long.parseLong(normalized) : null;
    }

    private static LocalDate parseDate(String value) {
        String normalized = blankToNull(value);
        return normalized != null ? LocalDate.parse(normalized) : null;
    }

    private static Enums.Gender parseGender(String value) {
        String normalized = blankToNull(value);
        return normalized != null ? Enums.Gender.valueOf(normalized.toUpperCase(Locale.ROOT)) : null;
    }

    private static BigDecimal parseDecimal(String value) {
        String normalized = blankToNull(value);
        return normalized != null ? new BigDecimal(normalized) : null;
    }

    private static LocalTime parseTimeRequired(String value, String column) {
        String normalized = blankToNull(value);
        if (normalized == null) {
            throw new BusinessException("Missing required column: " + column);
        }
        try {
            return LocalTime.parse(normalized);
        } catch (Exception ex) {
            throw new BusinessException("Invalid time for " + column + " (use HH:mm): " + value);
        }
    }

    private static List<String> parseSubjects(String value) {
        String normalized = blankToNull(value);
        if (normalized == null) {
            return List.of();
        }
        return java.util.Arrays.stream(normalized.split("\\|"))
                .map(String::trim)
                .filter(part -> !part.isEmpty())
                .collect(Collectors.toList());
    }
}
