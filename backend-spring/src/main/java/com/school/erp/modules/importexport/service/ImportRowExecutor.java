package com.school.erp.modules.importexport.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.modules.academic.dto.AcademicDTOs;
import com.school.erp.modules.academic.entity.SchoolClass;
import com.school.erp.modules.academic.service.AcademicService;
import com.school.erp.modules.auth.service.PortalUserProvisioningService;
import com.school.erp.modules.importexport.ImportJobType;
import com.school.erp.modules.importexport.entity.ImportJob;
import com.school.erp.modules.importexport.entity.ImportJobLine;
import com.school.erp.modules.notification.service.NotificationOutboxService;
import com.school.erp.modules.notification.service.NotificationService;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.modules.student.dto.StudentDTOs;
import com.school.erp.modules.student.service.StudentService;
import com.school.erp.modules.teacher.dto.TeacherDTOs;
import com.school.erp.modules.teacher.service.TeacherService;
import com.school.erp.tenant.TenantContext;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Executes one CSV row inside a dedicated transaction (see {@link ImportLineTransactionalRunner}).
 */
@Service
public class ImportRowExecutor {
    private final ObjectMapper objectMapper;
    private final StudentService studentService;
    private final TeacherService teacherService;
    private final AcademicService academicService;
    private final PortalUserProvisioningService portalUserProvisioningService;
    private final NotificationService notificationService;
    private final NotificationOutboxService notificationOutboxService;
    private final TenantConfigRepository tenantConfigRepository;

    public ImportRowExecutor(ObjectMapper objectMapper,
                           StudentService studentService,
                           TeacherService teacherService,
                           AcademicService academicService,
                           PortalUserProvisioningService portalUserProvisioningService,
                           NotificationService notificationService,
                           NotificationOutboxService notificationOutboxService,
                           TenantConfigRepository tenantConfigRepository) {
        this.objectMapper = objectMapper;
        this.studentService = studentService;
        this.teacherService = teacherService;
        this.academicService = academicService;
        this.portalUserProvisioningService = portalUserProvisioningService;
        this.notificationService = notificationService;
        this.notificationOutboxService = notificationOutboxService;
        this.tenantConfigRepository = tenantConfigRepository;
    }

    public void execute(ImportJob job, ImportJobLine line) throws Exception {
        ImportJobType type = ImportJobType.valueOf(job.getJobType());
        Map<String, String> row = objectMapper.readValue(line.getPayloadJson(), new TypeReference<>() {
        });
        switch (type) {
            case STUDENTS -> handleStudent(job, line, row);
            case TEACHERS -> handleTeacher(job, line, row, false);
            case STAFF -> handleTeacher(job, line, row, true);
            case CLASSES -> handleClass(line, row);
        }
    }

    private void handleStudent(ImportJob job, ImportJobLine line, Map<String, String> row) {
        String tenantId = TenantContext.getTenantId();
        StudentDTOs.CreateRequest request = new StudentDTOs.CreateRequest();
        request.setFirstName(required(row, "firstname"));
        request.setLastName(required(row, "lastname"));
        request.setEmail(blankToNull(row.get("email")));
        request.setPhone(blankToNull(row.get("phone")));
        request.setDateOfBirth(parseDate(row.get("dateofbirth")));
        request.setGender(parseGender(row.get("gender")));
        request.setClassId(parseLongRequired(row, "classid"));
        request.setSectionId(parseLong(row.get("sectionid")));
        request.setRollNumber(blankToNull(row.get("rollnumber")));
        request.setAdmissionNumber(blankToNull(row.get("admissionnumber")));
        request.setAdmissionDate(parseDate(row.get("admissiondate")));
        request.setAddress(blankToNull(row.get("address")));
        request.setBloodGroup(blankToNull(row.get("bloodgroup")));

        String parentEmail = blankToNull(row.get("parentemail"));
        PortalUserProvisioningService.ProvisionResult parentProvision = null;
        if (parentEmail != null) {
            String parentName = blankToNull(row.get("parentname"));
            if (parentName == null) {
                parentName = parentEmail;
            }
            String parentPhone = blankToNull(row.get("parentphone"));
            parentProvision = portalUserProvisioningService.ensureParentUser(tenantId, parentEmail, parentName, parentPhone);
            request.setParentId(parentProvision.userId());
            if (request.getParentName() == null) {
                request.setParentName(parentName);
            }
        } else {
            request.setParentId(parseLong(row.get("parentid")));
            request.setParentName(blankToNull(row.get("parentname")));
        }

        StudentDTOs.Response created = studentService.createStudent(request);
        line.setEntityType("STUDENT");
        line.setEntityId(created.getId());

        if (truthy(row.get("notifycredentials")) && parentProvision != null) {
            String schoolCode = tenantConfigRepository.findByTenantId(tenantId).map(c -> c.getSchoolCode()).orElse("");
            String body = credentialMessage(schoolCode, parentEmail, parentProvision.plainPassword(), parentProvision.createdNew());
            notificationService.createNotification(tenantId, parentProvision.userId(), "Parent portal access",
                    body, Enums.NotificationType.INFO, "/app/parent/children");
            String phone = blankToNull(row.get("parentphone"));
            notificationOutboxService.enqueue(tenantId, "PARENT_PORTAL_CREDENTIALS", "SMS",
                    parentProvision.userId(), phone, "Parent portal access", body,
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

        TeacherDTOs.Response created = teacherService.createForBulkImport(request, createPortal, portalRole, libRole);
        line.setEntityType("TEACHER");
        line.setEntityId(created.getId());

        if (createPortal && truthy(row.get("notifycredentials"))) {
            String tenantId = TenantContext.getTenantId();
            String schoolCode = tenantConfigRepository.findByTenantId(tenantId).map(c -> c.getSchoolCode()).orElse("");
            // Re-fetch plain password only when user was just created — not available here; send generic notice
            String body = "Your " + (portalRole == Enums.Role.LIBRARY_STAFF ? "library staff" : "teacher")
                    + " portal is ready. School code: " + schoolCode + ". Sign in with this email; use Forgot password if needed.";
            if (created.getUserId() != null) {
                notificationService.createNotification(tenantId, created.getUserId(), "Staff portal access",
                        body, Enums.NotificationType.INFO, "/app/dashboard");
                notificationOutboxService.enqueue(tenantId, "STAFF_PORTAL_CREDENTIALS", "SMS", created.getUserId(),
                        request.getPhone(), "Staff portal access", body,
                        "import-job-" + job.getId() + "-line-" + line.getId(), "import-" + job.getId());
            }
        }
    }

    private void handleClass(ImportJobLine line, Map<String, String> row) {
        AcademicDTOs.CreateClassRequest req = AcademicDTOs.CreateClassRequest.builder()
                .name(required(row, "name"))
                .grade(Integer.parseInt(required(row, "grade")))
                .academicYearId(parseLongRequired(row, "academicyearid"))
                .sectionNames(parsePipeList(row.get("sections")))
                .sectionCapacity(parseInt(row.get("sectioncapacity")))
                .build();
        SchoolClass created = academicService.createClass(req);
        line.setEntityType("CLASS");
        line.setEntityId(created.getId());
    }

    private static String credentialMessage(String schoolCode, String email, String plainPassword, boolean createdNew) {
        if (createdNew && plainPassword != null) {
            return "Welcome to the parent portal. School code: " + schoolCode + ". Email: " + email
                    + ". Temporary password: " + plainPassword + ". Please change it after first login.";
        }
        return "Your parent portal account is linked to this student. School code: " + schoolCode
                + ". Sign in with " + email + ". Use Forgot password if you do not remember your password.";
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
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static Long parseLong(String value) {
        String normalized = blankToNull(value);
        return normalized != null ? Long.parseLong(normalized) : null;
    }

    private static Long parseLongRequired(Map<String, String> row, String key) {
        return Long.parseLong(required(row, key));
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
