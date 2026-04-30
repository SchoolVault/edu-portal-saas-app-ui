package com.school.erp.modules.importexport.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.DuplicateResourceException;
import com.school.erp.common.importer.BulkImportRowPolicy;
import com.school.erp.common.importer.ImportLineOutcome;
import com.school.erp.common.importer.LineApplyResult;
import com.school.erp.common.util.InternationalPhone;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.auth.service.PortalUserProvisioningService;
import com.school.erp.modules.importexport.ImportJobType;
import com.school.erp.modules.importexport.entity.ImportJob;
import com.school.erp.modules.importexport.entity.ImportJobLine;
import com.school.erp.modules.notification.service.NotificationService;
import com.school.erp.modules.operations.entity.OperationalStaff;
import com.school.erp.modules.operations.repository.OperationalStaffRepository;
import com.school.erp.modules.rbac.service.RbacService;
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
import com.school.erp.modules.fees.dto.FeeDTOs;
import com.school.erp.modules.fees.service.FeeService;
import com.school.erp.modules.academic.dto.AcademicMutationRequests;
import com.school.erp.modules.academic.entity.SchoolClass;
import com.school.erp.modules.academic.entity.Section;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
import com.school.erp.platform.port.NotificationDispatchPort;
import com.school.erp.platform.port.NotificationDispatchAttributes;
import com.school.erp.tenant.AcademicYearContext;
import com.school.erp.tenant.TenantContext;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoField;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Executes one CSV / Excel row inside a dedicated transaction (see {@link ImportLineTransactionalRunner}).
 */
@Service
public class ImportRowExecutor {
    /** Accept both 08:00 and 8:00 from CSV/XLSX import packs. */
    private static final DateTimeFormatter CSV_TIME_FLEX = new DateTimeFormatterBuilder()
            .appendValue(ChronoField.HOUR_OF_DAY, 1, 2, java.time.format.SignStyle.NOT_NEGATIVE)
            .appendLiteral(':')
            .appendValue(ChronoField.MINUTE_OF_HOUR, 2)
            .toFormatter();

    /**
     * One parent credential notification per (jobId, parentUserId), even if many children in the same file
     * share the same primary guardian phone.
     */
    private static final Map<Long, Set<Long>> parentCredentialNotifiedByJob = new ConcurrentHashMap<>();
    /** Admin digest dedupe: one operational onboarding update per (jobId, role-kind). */
    private static final Map<Long, Set<String>> adminOnboardingDigestByJob = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;
    private final StudentService studentService;
    private final TeacherService teacherService;
    private final TeacherRepository teacherRepository;
    private final com.school.erp.modules.academic.service.AcademicService academicService;
    private final SchoolClassRepository schoolClassRepository;
    private final TimetableService timetableService;
    private final TimetableRepository timetableRepository;
    private final PortalUserProvisioningService portalUserProvisioningService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final NotificationDispatchPort notificationDispatchPort;
    private final TenantConfigRepository tenantConfigRepository;
    private final BulkImportAcademicResolver academicResolver;
    private final ImportBulkRowValidator bulkRowValidator;
    private final FeeService feeService;
    private final ImportLedgerWriteService importLedgerWriteService;
    private final RbacService rbacService;
    private final OperationalStaffRepository operationalStaffRepository;

    public ImportRowExecutor(ObjectMapper objectMapper,
                           StudentService studentService,
                           TeacherService teacherService,
                           TeacherRepository teacherRepository,
                           com.school.erp.modules.academic.service.AcademicService academicService,
                           SchoolClassRepository schoolClassRepository,
                           TimetableService timetableService,
                           TimetableRepository timetableRepository,
                           PortalUserProvisioningService portalUserProvisioningService,
                           UserRepository userRepository,
                           NotificationService notificationService,
                           NotificationDispatchPort notificationDispatchPort,
                           TenantConfigRepository tenantConfigRepository,
                           BulkImportAcademicResolver academicResolver,
                           ImportBulkRowValidator bulkRowValidator,
                           FeeService feeService,
                           ImportLedgerWriteService importLedgerWriteService,
                           RbacService rbacService,
                           OperationalStaffRepository operationalStaffRepository) {
        this.objectMapper = objectMapper;
        this.studentService = studentService;
        this.teacherService = teacherService;
        this.teacherRepository = teacherRepository;
        this.academicService = academicService;
        this.schoolClassRepository = schoolClassRepository;
        this.timetableService = timetableService;
        this.timetableRepository = timetableRepository;
        this.portalUserProvisioningService = portalUserProvisioningService;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.notificationDispatchPort = notificationDispatchPort;
        this.tenantConfigRepository = tenantConfigRepository;
        this.academicResolver = academicResolver;
        this.bulkRowValidator = bulkRowValidator;
        this.feeService = feeService;
        this.importLedgerWriteService = importLedgerWriteService;
        this.rbacService = rbacService;
        this.operationalStaffRepository = operationalStaffRepository;
    }

    public void execute(ImportJob job, ImportJobLine line) throws Exception {
        ImportJobType type = ImportJobType.valueOf(job.getJobType());
        Map<String, String> row = objectMapper.readValue(line.getPayloadJson(), new TypeReference<>() {
        });
        if (type == ImportJobType.STUDENTS) {
            StudentImportCanonicalRow.normalize(row);
        } else if (type == ImportJobType.CLASSES) {
            ClassImportCanonicalRow.normalize(row);
        } else if (type == ImportJobType.TIMETABLE) {
            TimetableImportCanonicalRow.normalize(row);
        }
        Long previousAcademicYearId = AcademicYearContext.getAcademicYearId();
        Long resolvedAcademicYearId = null;
        try {
            resolvedAcademicYearId = resolveRowAcademicYearId(type, row);
            if (resolvedAcademicYearId != null) {
                AcademicYearContext.setAcademicYearId(resolvedAcademicYearId);
            }
            bulkRowValidator.validateBeforePersist(type, row, false);
            switch (type) {
                case STUDENTS -> {
                    BulkImportAcademicResolver.ResolvedPlacement placement = academicResolver.resolveClassAndSection(row);
                    handleStudent(job, line, row, placement);
                }
                case TEACHERS -> handleTeacher(job, line, row, false);
                case STAFF -> handleTeacher(job, line, row, true);
                case CLASSES -> handleClass(job, line, row);
                case TIMETABLE -> handleTimetable(job, line, row);
                case FEE_STRUCTURES -> handleFeeStructure(job, line, row);
            }
        } finally {
            if (previousAcademicYearId == null) {
                AcademicYearContext.clear();
            } else {
                AcademicYearContext.setAcademicYearId(previousAcademicYearId);
            }
        }
    }

    private Long resolveRowAcademicYearId(ImportJobType type, Map<String, String> row) {
        return switch (type) {
            case STUDENTS -> academicResolver.resolveAcademicYearId(value(row, "academic_year_id", "academicyearid"));
            case CLASSES -> academicResolver.resolveAcademicYearId(row.get("academicyearid"));
            case TIMETABLE -> academicResolver.resolveAcademicYearId(value(row, "academic_year_id", "academicyearid"));
            case FEE_STRUCTURES -> academicResolver.resolveAcademicYearId(value(row, "academic_year_id", "academicyearid"));
            case TEACHERS, STAFF -> academicResolver.resolveAcademicYearId(value(row, "classteacheracademicyearid", "academic_year_id", "academicyearid"));
        };
    }

    private void handleFeeStructure(ImportJob job, ImportJobLine line, Map<String, String> row) {
        if (value(row, "class_id", "classid") != null) {
            row.put("classid", value(row, "class_id", "classid"));
        }
        if (value(row, "class_name", "classname") != null) {
            row.put("classname", value(row, "class_name", "classname"));
        }
        if (value(row, "academic_year_id", "academicyearid") != null) {
            row.put("academicyearid", value(row, "academic_year_id", "academicyearid"));
        }
        SchoolClass cls = academicResolver.resolveClassOnly(row);
        Long academicYearId = academicResolver.resolveAcademicYearId(value(row, "academic_year_id", "academicyearid"));
        BulkImportRowPolicy policy = BulkImportRowPolicy.fromCsv(value(row, "import_mode", "importmode"));
        String componentSpec = value(row, "component_spec", "componentspec");
        if (componentSpec != null) {
            row.put("componentspec", componentSpec);
        }
        List<FeeDTOs.FeeComponentDTO> components = parseFeeComponents(required(row, "componentspec"));
        FeeDTOs.CreateFeeStructureRequest req = FeeDTOs.CreateFeeStructureRequest.builder()
                .name(required(row, "name"))
                .classId(cls.getId())
                .className(cls.getName())
                .academicYearId(academicYearId)
                .components(components)
                .build();
        LineApplyResult<FeeDTOs.FeeStructureResponse> applied = feeService.importStructureRow(req, policy);
        FeeDTOs.FeeStructureResponse saved = applied.value();
        line.setEntityType("FEE_STRUCTURE");
        line.setEntityId(saved.getId());
        importLedgerWriteService.recordLine(job, line, applied.outcome(), "FEE_STRUCTURE", saved.getId(), applied.naturalKey());
    }

    private void handleStudent(ImportJob job, ImportJobLine line, Map<String, String> row,
                             BulkImportAcademicResolver.ResolvedPlacement placement) {
        String tenantId = TenantContext.getTenantId();
        boolean notifyCredentials = truthy(value(row, "notify_credentials", "notifycredentials"));

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

        BulkImportRowPolicy policy = BulkImportRowPolicy.fromCsv(value(row, "import_mode", "importmode"));

        String parentEmail = blankToNull(value(row, "parentemail"));
        String parentPhone = blankToNull(value(row, "parentphone"));
        String parentCode = blankToNull(value(row, "parentcode", "parent_code", "primary_guardian_code"));

        PortalUserProvisioningService.ProvisionResult parentProvision = null;
        if (parentEmail != null || parentPhone != null || truthy(value(row, "create_parent_portal", "createparentportal"))) {
            String parentName = blankToNull(value(row, "parentname"));
            if (parentName == null) {
                parentName = parentEmail != null ? parentEmail : (parentPhone != null ? parentPhone : "Parent");
            }
            parentProvision = portalUserProvisioningService.ensureParentUserForImport(
                    tenantId, parentName, parentEmail, parentPhone, parentCode);
            request.setParentId(parentProvision.userId());
            if (request.getParentName() == null) {
                request.setParentName(parentName);
            }
        } else {
            request.setParentId(parseLong(value(row, "parentid")));
            request.setParentName(blankToNull(value(row, "parentname")));
        }

        LineApplyResult<StudentDTOs.Response> applied = studentService.importStudentRow(request, policy);
        StudentDTOs.Response created = applied.value();
        line.setEntityType("STUDENT");
        line.setEntityId(created.getId());
        importLedgerWriteService.recordLine(job, line, applied.outcome(), "STUDENT", created.getId(), applied.naturalKey());

        if (notifyCredentials && parentProvision != null) {
            if (!parentProvision.createdNew()) {
                return;
            }
            if (!markParentCredentialsNotified(job.getId(), parentProvision.userId())) {
                return;
            }
            SchoolIdentity school = loadSchoolIdentity(tenantId);
            String body = credentialMessage(school.name(), school.code(), parentEmail, parentPhone, parentProvision.plainPassword(), true);
            String parentCredentialTitle = parentCredentialNotificationTitle();
            notificationService.createNotification(tenantId, parentProvision.userId(), parentCredentialTitle,
                    body, Enums.NotificationType.INFO, "/app/parent/children");
            // Persists to transactional outbox (see NotificationOutboxService) for async delivery / retries.
            notificationDispatchPort.enqueue(tenantId, "PARENT_PORTAL_CREDENTIALS", "SMS",
                    parentProvision.userId(), parentPhone, parentCredentialTitle, body,
                    "import-job-" + job.getId() + "-parent-" + parentProvision.userId(), "import-" + job.getId(),
                    NotificationDispatchAttributes.inheritFromThread());
            notifyAdminsOnParentOnboarding(job, school);
        }
    }

    private static boolean markParentCredentialsNotified(Long jobId, Long parentUserId) {
        if (jobId == null || parentUserId == null) {
            return true;
        }
        Set<Long> notified = parentCredentialNotifiedByJob.computeIfAbsent(jobId, ignored -> ConcurrentHashMap.newKeySet());
        return notified.add(parentUserId);
    }

    private void handleTeacher(ImportJob job, ImportJobLine line, Map<String, String> row, boolean staffImport) {
        String tenantId = TenantContext.getTenantId();
        String canonicalPhone = canonicalPhoneRequired(value(row, "phone"));
        String loginEmail = normalizeEmailOptional(value(row, "email"));
        String importPassword = blankToNull(value(row, "portal_password", "portalpassword"));
        boolean notifyCredentials = truthy(value(row, "notify_credentials", "notifycredentials"));
        User portalBefore = notifyCredentials ? findPortalUserBeforeTeacherImport(tenantId, loginEmail, canonicalPhone) : null;

        TeacherDTOs.CreateRequest request = new TeacherDTOs.CreateRequest();
        request.setEmployeeCode(blankToNull(value(row, "employee_code")));
        request.setFirstName(requiredAny(row, "first_name", "firstname"));
        request.setLastName(requiredAny(row, "last_name", "lastname"));
        request.setEmail(loginEmail);
        request.setPhone(canonicalPhone);
        request.setQualification(blankToNull(value(row, "qualification")));
        request.setSpecialization(blankToNull(value(row, "specialization", "department")));
        request.setJoinDate(parseDate(value(row, "join_date", "joindate")));
        request.setSalary(parseDecimal(value(row, "salary")));
        request.setSubjects(parseSubjects(value(row, "subjects")));
        request.setBankAccountHolder(blankToNull(value(row, "bank_account_holder", "bankaccountholder")));
        request.setBankName(blankToNull(value(row, "bank_name", "bankname")));
        request.setBankAccountNumber(blankToNull(value(row, "bank_account_number", "bankaccountnumber")));
        request.setBankIfsc(blankToNull(value(row, "bank_ifsc", "bankifsc")));

        boolean createPortal;
        if (staffImport) {
            String createPortalRaw = value(row, "create_portal", "createportal");
            createPortal = createPortalRaw == null || createPortalRaw.isBlank() || truthy(createPortalRaw);
        } else {
            // Teachers should be login-ready by default after onboarding.
            String createPortalRaw = value(row, "create_portal", "createportal");
            createPortal = createPortalRaw == null || createPortalRaw.isBlank() || truthy(createPortalRaw);
        }
        Enums.Role portalRole = parsePortalRole(value(row, "portal_role", "portalrole"), staffImport);
        Enums.LibraryStaffRole libRole = parseLibraryRole(value(row, "library_role", "libraryrole"));

        if (portalRole == Enums.Role.LIBRARY_STAFF && libRole == null) {
            libRole = Enums.LibraryStaffRole.LIBRARIAN;
        }
        if (portalRole == Enums.Role.TEACHER) {
            libRole = null;
        }

        BulkImportRowPolicy policy = BulkImportRowPolicy.fromCsv(value(row, "import_mode", "importmode"));

        LineApplyResult<TeacherDTOs.Response> applied = teacherService.upsertTeacherForImport(
                request,
                createPortal,
                portalRole,
                libRole,
                policy,
                loginEmail,
                canonicalPhone,
                importPassword);
        TeacherDTOs.Response created = applied.value();
        Enums.TeacherStatus teacherStatus = parseTeacherStatus(value(row, "status"));
        teacherRepository.findByIdAndTenantIdAndIsDeletedFalse(created.getId(), tenantId).ifPresent(teacher -> {
            if (teacherStatus != null) {
                if (teacher.getStatus() != teacherStatus) {
                    teacher.setStatus(teacherStatus);
                }
                teacher.setIsActive(teacherStatus == Enums.TeacherStatus.ACTIVE);
                teacherRepository.save(teacher);
            } else if (policy == BulkImportRowPolicy.UPSERT && !Boolean.TRUE.equals(teacher.getIsActive())) {
                // UPSERT without explicit status revives inactive teacher rows.
                teacher.setStatus(Enums.TeacherStatus.ACTIVE);
                teacher.setIsActive(true);
                teacherRepository.save(teacher);
            }
        });
        String teacherLedgerType = staffImport ? "STAFF" : "TEACHER";
        line.setEntityType(teacherLedgerType);
        line.setEntityId(created.getId());
        importLedgerWriteService.recordLine(job, line, applied.outcome(), teacherLedgerType, created.getId(), applied.naturalKey());
        assignOptionalClassTeacherSlot(row, created.getId(), portalRole, staffImport);
        if (staffImport) {
            upsertOperationalStaffMirror(row, created, portalRole, canonicalPhone, loginEmail);
        }

        if (createPortal && notifyCredentials && created.getUserId() != null) {
            User portalAfter = userRepository.findByIdAndTenantIdAndIsDeletedFalse(created.getUserId(), tenantId).orElse(null);
            PortalContactChange portalChange = detectPortalContactChange(portalBefore, portalAfter);
            if (!portalChange.newlyProvisioned() && !portalChange.emailChanged() && !portalChange.phoneChanged()) {
                applySchoolRoleCodesFromRow(row, created.getUserId());
                return;
            }
            SchoolIdentity school = loadSchoolIdentity(tenantId);
            String body = portalChange.newlyProvisioned()
                    ? teacherCredentialMessage(school.name(), school.code(), loginEmail, canonicalPhone, importPassword, portalRole)
                    : teacherCredentialsUpdatedMessage(
                    school.name(),
                    school.code(),
                    portalAfter != null ? portalAfter.getEmail() : loginEmail,
                    portalAfter != null ? portalAfter.getPhone() : canonicalPhone,
                    portalRole,
                    portalChange.emailChanged(),
                    portalChange.phoneChanged());
            String credentialTitle = credentialNotificationTitleForRole(portalRole);
            notificationService.createNotification(tenantId, created.getUserId(), credentialTitle,
                    body, Enums.NotificationType.INFO, "/app/dashboard");
            notificationDispatchPort.enqueue(tenantId, "STAFF_PORTAL_CREDENTIALS", "SMS", created.getUserId(),
                    canonicalPhone, credentialTitle, body,
                    "import-job-" + job.getId() + "-line-" + line.getId(), "import-" + job.getId(),
                    NotificationDispatchAttributes.inheritFromThread());
            if (portalChange.newlyProvisioned()) {
                notifyAdminsOnRoleOnboarding(job, portalRole, school);
            }
        }
        applySchoolRoleCodesFromRow(row, created.getUserId());
    }

    /**
     * Keeps operations staff master table aligned with STAFF import rows (idempotent upsert).
     * Matching priority: userId -> employeeCode -> email -> phone.
     */
    private void upsertOperationalStaffMirror(
            Map<String, String> row,
            TeacherDTOs.Response created,
            Enums.Role portalRole,
            String canonicalPhone,
            String loginEmail) {
        String tenantId = TenantContext.getTenantId();
        Long userId = created.getUserId();
        String employeeCode = normalizeEmployeeCode(blankToNull(value(row, "employee_code")));
        String first = blankToNull(created.getFirstName());
        String last = blankToNull(created.getLastName());
        String fullName = ((first != null ? first : "") + " " + (last != null ? last : "")).trim();
        if (fullName.isBlank()) {
            fullName = "Staff";
        }
        String staffRole = deriveOperationalStaffRole(row, portalRole);
        Optional<OperationalStaff> existing = Optional.empty();
        if (userId != null) {
            existing = operationalStaffRepository.findByTenantIdAndUserIdAndIsDeletedFalse(tenantId, userId);
        }
        if (existing.isEmpty() && employeeCode != null) {
            existing = operationalStaffRepository.findByTenantIdAndEmployeeCodeAndIsDeletedFalse(tenantId, employeeCode);
        }
        if (existing.isEmpty() && loginEmail != null) {
            existing = operationalStaffRepository.findByTenantIdAndEmailIgnoreCaseAndIsDeletedFalse(tenantId, loginEmail);
        }
        if (existing.isEmpty() && canonicalPhone != null) {
            existing = operationalStaffRepository.findByTenantIdAndPhoneAndIsDeletedFalse(tenantId, canonicalPhone);
        }
        OperationalStaff staff = existing.orElseGet(OperationalStaff::new);
        if (staff.getId() == null) {
            staff.setTenantId(tenantId);
            staff.setIsDeleted(false);
            staff.setCreatedBy(TenantContext.getUserId() != null ? TenantContext.getUserId().toString() : null);
        }
        staff.setIsActive(true);
        staff.setStaffRole(staffRole);
        staff.setFullName(fullName);
        staff.setPhone(canonicalPhone);
        staff.setEmail(loginEmail);
        staff.setEmployeeCode(employeeCode);
        staff.setUserId(userId);
        if (staff.getNotes() == null || staff.getNotes().isBlank()) {
            staff.setNotes("Managed by STAFF import pipeline.");
        }
        staff.setUpdatedBy(TenantContext.getUserId() != null ? TenantContext.getUserId().toString() : null);
        operationalStaffRepository.save(staff);
    }

    private static String deriveOperationalStaffRole(Map<String, String> row, Enums.Role portalRole) {
        String explicit = blankToNull(value(row, "staff_role", "staffrole", "department", "specialization"));
        if (explicit != null) {
            return explicit.trim().toUpperCase(Locale.ROOT).replace(' ', '_');
        }
        if (portalRole == Enums.Role.LIBRARY_STAFF) {
            return "LIBRARY";
        }
        return "OPERATIONS";
    }

    private void notifyAdminsOnRoleOnboarding(ImportJob job, Enums.Role role, SchoolIdentity school) {
        if (job == null || job.getId() == null || role == null) {
            return;
        }
        String roleKey = role.name();
        Set<String> digests = adminOnboardingDigestByJob.computeIfAbsent(job.getId(), ignored -> ConcurrentHashMap.newKeySet());
        if (!digests.add(roleKey)) {
            return;
        }
        String tenantId = TenantContext.getTenantId();
        String title = onboardingTitleForRole(role);
        String body = onboardingBodyForRole(role, school.name(), school.code());
        LinkedHashSet<User> admins = new LinkedHashSet<>();
        admins.addAll(userRepository.findByTenantIdAndRoleAndIsDeletedFalse(tenantId, Enums.Role.ADMIN));
        admins.addAll(userRepository.findByTenantIdAndRoleAndIsDeletedFalse(tenantId, Enums.Role.SUPER_ADMIN));
        for (User admin : admins) {
            if (admin == null || admin.getId() == null) {
                continue;
            }
            notificationService.createNotification(
                    tenantId,
                    admin.getId(),
                    title,
                    body,
                    Enums.NotificationType.INFO,
                    "/app/inbox");
            String phone = blankToNull(admin.getPhone());
            if (phone != null) {
                notificationDispatchPort.enqueue(
                        tenantId,
                        "ADMIN_ONBOARDING_SUMMARY",
                        "SMS",
                        admin.getId(),
                        phone,
                        title,
                        body,
                        "import-job-" + job.getId() + "-admin-digest-" + roleKey,
                        "import-" + job.getId(),
                        NotificationDispatchAttributes.inheritFromThread());
            }
        }
    }

    private void notifyAdminsOnParentOnboarding(ImportJob job, SchoolIdentity school) {
        if (job == null || job.getId() == null) {
            return;
        }
        String digestKey = "PARENT";
        Set<String> digests = adminOnboardingDigestByJob.computeIfAbsent(job.getId(), ignored -> ConcurrentHashMap.newKeySet());
        if (!digests.add(digestKey)) {
            return;
        }
        String tenantId = TenantContext.getTenantId();
        String title = parentOnboardingAnnouncementTitle();
        String body = parentOnboardingBody(school.name(), school.code());
        LinkedHashSet<User> admins = new LinkedHashSet<>();
        admins.addAll(userRepository.findByTenantIdAndRoleAndIsDeletedFalse(tenantId, Enums.Role.ADMIN));
        admins.addAll(userRepository.findByTenantIdAndRoleAndIsDeletedFalse(tenantId, Enums.Role.SUPER_ADMIN));
        for (User admin : admins) {
            if (admin == null || admin.getId() == null) {
                continue;
            }
            notificationService.createNotification(tenantId, admin.getId(), title, body, Enums.NotificationType.INFO, "/app/inbox");
            String phone = blankToNull(admin.getPhone());
            if (phone != null) {
                notificationDispatchPort.enqueue(
                        tenantId,
                        "ADMIN_ONBOARDING_SUMMARY",
                        "SMS",
                        admin.getId(),
                        phone,
                        title,
                        body,
                        "import-job-" + job.getId() + "-admin-digest-" + digestKey,
                        "import-" + job.getId(),
                        NotificationDispatchAttributes.inheritFromThread());
            }
        }
    }

    private static String onboardingTitleForRole(Enums.Role role) {
        if (role == Enums.Role.TEACHER) {
            return "Teacher Portal Onboarding Notice";
        }
        if (role == Enums.Role.LIBRARY_STAFF) {
            return "Library Staff Portal Onboarding Notice";
        }
        return "School Staff Portal Onboarding Notice";
    }

    private static String credentialNotificationTitleForRole(Enums.Role role) {
        if (role == Enums.Role.TEACHER) {
            return "Teacher Portal Access Credentials";
        }
        if (role == Enums.Role.LIBRARY_STAFF) {
            return "Library Staff Portal Access Credentials";
        }
        return "School Staff Portal Access Credentials";
    }

    private static String parentCredentialNotificationTitle() {
        return "Parent Portal Access Credentials";
    }

    private static String parentOnboardingAnnouncementTitle() {
        return "Parent Portal Onboarding Notice";
    }

    private static String onboardingBodyForRole(Enums.Role role, String schoolName, String schoolCode) {
        String schoolLine = schoolIdentityLine(schoolName, schoolCode);
        if (role == Enums.Role.TEACHER) {
            return schoolLine + " New teacher portal accounts are now active. Sign in using mobile OTP. If email login is enabled, verify your email in Profile > Security before using password login.";
        }
        if (role == Enums.Role.LIBRARY_STAFF) {
            return schoolLine + " New library staff portal accounts are now active. Staff should sign in using mobile OTP and complete profile verification after first login.";
        }
        return schoolLine + " New school staff portal accounts are now active. Staff should sign in using mobile OTP and complete profile verification after first login.";
    }

    /**
     * When {@code schoolrolecodes} is set, replace this user's tenant school RBAC roles (stable codes, comma-separated).
     * Requires a portal {@code userId} on the teacher row (enable portal + email/phone as applicable).
     */
    private void applySchoolRoleCodesFromRow(Map<String, String> row, Long userId) {
        String raw = blankToNull(value(row, "school_role_codes", "schoolrolecodes"));
        if (raw == null) {
            return;
        }
        LinkedHashSet<String> codes = new LinkedHashSet<>();
        for (String token : raw.split(",")) {
            String c = blankToNull(token);
            if (c != null) {
                codes.add(c.toUpperCase(Locale.ROOT));
            }
        }
        if (codes.isEmpty()) {
            return;
        }
        if (userId == null) {
            throw new BusinessException(
                    "schoolrolecodes requires a portal user on this row. Use createportal true with email (for email login) "
                            + "and phone, or omit schoolrolecodes until a portal account exists.");
        }
        rbacService.replaceUserSchoolRolesFromImportCodes(userId, new ArrayList<>(codes));
    }

    private void assignOptionalClassTeacherSlot(Map<String, String> row, Long teacherId, Enums.Role portalRole, boolean staffImport) {
        if (staffImport) {
            return;
        }
        promoteCanonicalClassTeacherSlotFields(row);
        BulkImportAcademicResolver.ResolvedPlacement placement = academicResolver
                .resolveOptionalClassTeacherPlacement(row)
                .orElse(null);
        if (placement == null) {
            return;
        }
        if (portalRole == Enums.Role.LIBRARY_STAFF || portalRole == Enums.Role.SCHOOL_STAFF) {
            throw new BusinessException("classteacherfor cannot be used for non-teacher portal rows");
        }
        academicService.assignClassTeacher(placement.classId(), placement.sectionId(), teacherId, null);
    }

    private void handleClass(ImportJob job, ImportJobLine line, Map<String, String> row) {
        String tenantId = TenantContext.getTenantId();
        BulkImportRowPolicy policy = BulkImportRowPolicy.fromCsv(value(row, "import_mode", "importmode"));
        Long resolvedAcademicYearId = academicResolver.resolveAcademicYearId(row.get("academicyearid"));
        String classCode = blankToNull(row.get("classcode"));
        String className = blankToNull(row.get("classname"));
        if (className == null && classCode != null) {
            className = "Class " + classCode.toUpperCase(Locale.ROOT);
        }
        if (className == null) {
            throw new BusinessException("Either classname or classcode is required");
        }
        Integer grade = Integer.parseInt(required(row, "grade"));
        String sectionCode = blankToNull(row.get("sectioncode"));
        String sectionName = blankToNull(row.get("sectionname"));
        boolean sectionedRow = sectionCode != null || sectionName != null;
        String effectiveSectionName = sectionName != null ? sectionName : sectionCode;
        Integer classCapacity = parseInt(row.get("classcapacity"));
        Integer sectionCapacity = parseInt(row.get("sectioncapacity"));
        int effectiveNoSectionCapacity = classCapacity != null ? classCapacity : 40;
        Long previousAcademicYearId = AcademicYearContext.getAcademicYearId();
        AcademicYearContext.setAcademicYearId(resolvedAcademicYearId);
        try {

            SchoolClass existing = schoolClassRepository
                    .findFirstByTenantIdAndAcademicYearIdAndNameIgnoreCaseAndIsDeletedFalse(
                            tenantId, resolvedAcademicYearId, className)
                    .orElse(null);

            if (existing != null) {
                if (policy == BulkImportRowPolicy.CREATE_ONLY) {
                    throw new DuplicateResourceException("Class already exists for academic year: " + className);
                }
                boolean changed = false;
                if (policy == BulkImportRowPolicy.UPSERT && !Boolean.TRUE.equals(existing.getIsActive())) {
                    academicService.setClassActiveState(existing.getId(), true);
                    changed = true;
                }
                if (!className.equals(existing.getName()) || !grade.equals(existing.getGrade())) {
                    AcademicMutationRequests.UpdateSchoolClassRequest updateReq = new AcademicMutationRequests.UpdateSchoolClassRequest();
                    updateReq.setName(className);
                    updateReq.setGrade(grade);
                    academicService.updateClass(existing.getId(), updateReq);
                    changed = true;
                }
                List<Section> currentSections = academicService.getSectionsByClass(existing.getId(), "all");
                if (sectionedRow) {
                    Section current = findSectionByCodeOrName(currentSections, sectionCode, effectiveSectionName);
                    if (current == null) {
                        academicService.addSection(existing.getId(), effectiveSectionName, sectionCapacity);
                        changed = true;
                    } else if (sectionCapacity != null && !sectionCapacity.equals(current.getCapacity())) {
                        AcademicMutationRequests.UpdateSectionRequest sectionUpdateReq = new AcademicMutationRequests.UpdateSectionRequest();
                        sectionUpdateReq.setName(current.getName());
                        sectionUpdateReq.setCapacity(sectionCapacity);
                        academicService.updateSection(current.getId(), sectionUpdateReq);
                        changed = true;
                    }
                    if (policy == BulkImportRowPolicy.UPSERT && current != null && !Boolean.TRUE.equals(current.getIsActive())) {
                        academicService.setSectionActiveState(current.getId(), true);
                        changed = true;
                    }
                } else if (!currentSections.isEmpty()) {
                    throw new BusinessException(
                            "Mixed-mode class import is not allowed: class already has sections, so provide sectioncode/sectionname and sectioncapacity.");
                }

                line.setEntityType("CLASS");
                line.setEntityId(existing.getId());
                String nk = classNaturalKey(classCode, className, resolvedAcademicYearId)
                        + (sectionedRow ? "|SEC:" + effectiveSectionName.toUpperCase(Locale.ROOT) : "");
                importLedgerWriteService.recordLine(
                        job,
                        line,
                        changed ? ImportLineOutcome.UPDATED : ImportLineOutcome.SKIPPED,
                        "CLASS",
                        existing.getId(),
                        nk);
                return;
            }

            com.school.erp.modules.academic.dto.AcademicDTOs.CreateClassRequest req = com.school.erp.modules.academic.dto.AcademicDTOs.CreateClassRequest.builder()
                    .name(className)
                    .grade(grade)
                    .academicYearId(resolvedAcademicYearId)
                    .sectionNames(sectionedRow ? List.of(effectiveSectionName) : List.of())
                    .sectionCapacity(sectionedRow ? sectionCapacity : effectiveNoSectionCapacity)
                    .build();
            com.school.erp.modules.academic.entity.SchoolClass created = academicService.createClass(req);
            line.setEntityType("CLASS");
            line.setEntityId(created.getId());
            String nk = classNaturalKey(classCode, created.getName(), resolvedAcademicYearId)
                    + (sectionedRow ? "|SEC:" + effectiveSectionName.toUpperCase(Locale.ROOT) : "");
            importLedgerWriteService.recordLine(job, line, ImportLineOutcome.CREATED, "CLASS", created.getId(), nk);
        } finally {
            if (previousAcademicYearId == null) {
                AcademicYearContext.clear();
            } else {
                AcademicYearContext.setAcademicYearId(previousAcademicYearId);
            }
        }
    }

    private static Section findSectionByCodeOrName(List<Section> sections, String sectionCode, String sectionName) {
        if (sections == null || sections.isEmpty()) {
            return null;
        }
        String targetCode = sectionCode != null ? sectionCode.trim().toUpperCase(Locale.ROOT) : null;
        String targetName = sectionName != null ? sectionName.trim().toLowerCase(Locale.ROOT) : null;
        for (Section sec : sections) {
            String existingName = sec.getName() != null ? sec.getName().trim() : "";
            if (targetCode != null && existingName.equalsIgnoreCase(targetCode)) {
                return sec;
            }
            if (targetName != null && existingName.toLowerCase(Locale.ROOT).equals(targetName)) {
                return sec;
            }
        }
        return null;
    }

    private static String classNaturalKey(String classCode, String className, Long academicYearId) {
        String cls = classCode != null && !classCode.isBlank()
                ? classCode.toUpperCase(Locale.ROOT)
                : className.toUpperCase(Locale.ROOT);
        return "CLASS:" + cls + "|AY:" + academicYearId;
    }

    private void handleTimetable(ImportJob job, ImportJobLine line, Map<String, String> row) {
        TimetableImportCanonicalRow.normalize(row);
        String tenantId = TenantContext.getTenantId();
        BulkImportAcademicResolver.ResolvedPlacement placement = academicResolver.resolveClassAndSection(row);
        Long academicYearId = academicResolver.resolveAcademicYearId(value(row, "academic_year_id", "academicyearid"));
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
        BulkImportRowPolicy policy = BulkImportRowPolicy.fromCsv(value(row, "import_mode", "importmode"));

        final boolean[] wasUpdate = {false};
        var existingOpt = timetableRepository
                .findFirstByTenantAndClassSectionDayPeriod(tenantId, placement.classId(), placement.sectionId(), day, period);
        TimetableEntry saved;
        if (existingOpt.isPresent()) {
            TimetableEntry existing = existingOpt.get();
            String tuple = "classId=" + placement.classId() + ", sectionId=" + placement.sectionId() + ", day=" + day + ", period=" + period + ", ay=" + academicYearId;
            if (policy == BulkImportRowPolicy.CREATE_ONLY) {
                throw new BusinessException("Timetable slot already exists for [" + tuple + "] under CREATE_ONLY policy.");
            }
            if (policy == BulkImportRowPolicy.SKIP_IF_EXISTS) {
                saved = existing;
            } else {
                wasUpdate[0] = true;
                TimetableEntry patch = new TimetableEntry();
                patch.setSubjectName(upsert.getSubjectName());
                patch.setTeacherId(upsert.getTeacherId());
                patch.setTeacherName(upsert.getTeacherName());
                patch.setStartTime(upsert.getStartTime());
                patch.setEndTime(upsert.getEndTime());
                patch.setRoom(upsert.getRoom());
                patch.setAcademicYearId(upsert.getAcademicYearId());
                saved = timetableService.updateEntry(existing.getId(), patch, null);
            }
        } else {
            saved = timetableService.createEntry(upsert, null);
        }

        line.setEntityType("TIMETABLE");
        line.setEntityId(saved.getId());
        ImportLineOutcome toOutcome = wasUpdate[0]
                ? ImportLineOutcome.UPDATED
                : (existingOpt.isPresent() ? ImportLineOutcome.SKIPPED : ImportLineOutcome.CREATED);
        String nk = "C:" + placement.classId() + "|S:" + placement.sectionId() + "|" + day + "|P" + period + "|AY:" + academicYearId;
        importLedgerWriteService.recordLine(job, line, toOutcome, "TIMETABLE", saved.getId(), nk);
    }

    private Teacher resolveTimetableTeacher(Map<String, String> row, String tenantId) {
        String teacherEmployeeCode = blankToNull(value(row, "teacheremployeecode", "teacher_employee_code"));
        String teacherEmail = blankToNull(value(row, "teacheremail"));
        String teacherPhone = blankToNull(value(row, "teacherphone"));
        Long teacherId = parseLong(value(row, "teacherid"));
        if (teacherEmployeeCode != null) {
            String normalizedCode = teacherEmployeeCode.trim().toUpperCase(Locale.ROOT);
            Optional<Teacher> byCode = teacherRepository.findByTenantIdAndEmployeeCodeAndIsDeletedFalse(tenantId, normalizedCode);
            if (byCode.isPresent()) {
                return byCode.get();
            }
            // Fallback for legacy sheets: if code lookup misses, try phone/email when present.
            if (teacherPhone == null && teacherEmail == null) {
                throw new BusinessException("Teacher not found for employee_code: " + normalizedCode);
            }
        }
        if (teacherId != null) {
            return teacherRepository.findByIdAndTenantIdAndIsDeletedFalse(teacherId, tenantId)
                    .orElseThrow(() -> new BusinessException("Teacher not found for teacherid: " + teacherId));
        }
        if (teacherPhone != null) {
            String canonical = InternationalPhone.canonical(teacherPhone);
            if (canonical == null) {
                throw new BusinessException(InternationalPhone.invalidMessage());
            }
            return teacherRepository.findByTenantIdAndPhoneAndIsDeletedFalse(tenantId, canonical)
                    .orElseThrow(() -> new BusinessException("Teacher not found for teacherphone: " + canonical));
        }
        if (teacherEmail != null) {
            return teacherRepository.findByTenantIdAndEmailIgnoreCaseAndIsDeletedFalse(tenantId, teacherEmail)
                    .orElseThrow(() -> new BusinessException("Teacher not found for teacheremail: " + teacherEmail));
        }
        throw new BusinessException("teacher_employee_code (preferred), teacherid, teacherphone, or teacheremail is required");
    }

    private static String credentialMessage(
            String schoolName,
            String schoolCode,
            String email,
            String phone,
            String plainPassword,
            boolean createdNew) {
        String schoolLine = schoolIdentityLine(schoolName, schoolCode);
        String maskedPhone = phone != null && !phone.isBlank() ? phone : "your registered mobile";
        if (createdNew && email != null && !email.isBlank() && plainPassword != null) {
            return "Welcome to the Parent Portal. " + schoolLine
                    + " Login details: Mobile OTP on " + maskedPhone + "; Email login " + email
                    + "; Temporary password " + plainPassword + ". "
                    + "Please sign in, verify your email in Profile > Security, and change your password immediately.";
        }
        if (createdNew) {
            return "Welcome to the Parent Portal. " + schoolLine
                    + " Login details: Mobile OTP on " + maskedPhone + ". "
                    + "After login, please review your profile and notification preferences.";
        }
        return "Parent portal access updated. " + schoolLine
                + " This student is now linked to your existing parent account. "
                + "Sign in using your registered mobile OTP" + (email != null && !email.isBlank() ? " or email login " + email : "") + ".";
    }

    private static String teacherCredentialMessage(
            String schoolName,
            String schoolCode,
            String loginEmail,
            String phone,
            String providedPassword,
            Enums.Role portalRole) {
        String persona =
                portalRole == Enums.Role.LIBRARY_STAFF
                        ? "library staff"
                        : portalRole == Enums.Role.SCHOOL_STAFF ? "school staff" : "teacher";
        StringBuilder sb = new StringBuilder("Portal onboarding completed for your ").append(persona)
                .append(" account. ")
                .append(schoolIdentityLine(schoolName, schoolCode))
                .append(". ");
        if (phone != null && !phone.isBlank()) {
            sb.append("Mobile OTP login: ").append(phone).append(". ");
        } else {
            sb.append("Mobile OTP login: registered mobile number. ");
        }
        if (loginEmail != null && !loginEmail.isBlank()) {
            sb.append("Email login: ").append(loginEmail).append(". ");
            if (providedPassword != null && !providedPassword.isBlank()) {
                sb.append("Temporary password: ").append(providedPassword).append(". ");
            } else {
                sb.append("Set your password from Profile > Security after email verification, or use Forgot password. ");
            }
        } else {
            sb.append("No email login on file; sign in with mobile OTP until email is added and verified. ");
        }
        sb.append("For security, change temporary credentials after first login.");
        return sb.toString();
    }

    private User findPortalUserBeforeTeacherImport(String tenantId, String loginEmail, String canonicalPhone) {
        if (loginEmail != null) {
            User byEmail = userRepository.findByEmailAndTenantIdAndIsDeletedFalse(loginEmail, tenantId).orElse(null);
            if (byEmail != null) {
                return byEmail;
            }
        }
        return userRepository.findByPhoneAndTenantIdAndIsDeletedFalse(canonicalPhone, tenantId).orElse(null);
    }

    private static PortalContactChange detectPortalContactChange(User before, User after) {
        if (after == null) {
            return new PortalContactChange(false, false, false);
        }
        if (before == null) {
            return new PortalContactChange(true, false, false);
        }
        String beforeEmail = normalizeEmailOptional(before.getEmail());
        String afterEmail = normalizeEmailOptional(after.getEmail());
        String beforePhone = blankToNull(before.getPhone());
        String afterPhone = blankToNull(after.getPhone());
        boolean emailChanged = !java.util.Objects.equals(beforeEmail, afterEmail);
        boolean phoneChanged = !java.util.Objects.equals(beforePhone, afterPhone);
        return new PortalContactChange(false, emailChanged, phoneChanged);
    }

    private static String teacherCredentialsUpdatedMessage(
            String schoolName,
            String schoolCode,
            String loginEmail,
            String phone,
            Enums.Role portalRole,
            boolean emailChanged,
            boolean phoneChanged) {
        String persona =
                portalRole == Enums.Role.LIBRARY_STAFF
                        ? "library staff"
                        : portalRole == Enums.Role.SCHOOL_STAFF ? "school staff" : "teacher";
        StringBuilder sb = new StringBuilder("Your ").append(persona)
                .append(" portal login details were updated. ")
                .append(schoolIdentityLine(schoolName, schoolCode)).append(". ");
        if (emailChanged) {
            if (loginEmail != null && !loginEmail.isBlank()) {
                sb.append("New email login: ").append(loginEmail).append(". ");
            } else {
                sb.append("Email login was removed. ");
            }
        }
        if (phoneChanged && phone != null && !phone.isBlank()) {
            sb.append("New mobile OTP login: ").append(phone).append(". ");
        }
        sb.append("Please use the updated login details for next sign-in. If email changed, verify the new email after OTP login before using email/password.");
        return sb.toString();
    }

    private SchoolIdentity loadSchoolIdentity(String tenantId) {
        return tenantConfigRepository.findByTenantId(tenantId)
                .map(c -> new SchoolIdentity(blankToNull(c.getSchoolName()), blankToNull(c.getSchoolCode())))
                .orElseGet(() -> new SchoolIdentity(null, null));
    }

    private static String parentOnboardingBody(String schoolName, String schoolCode) {
        return schoolIdentityLine(schoolName, schoolCode)
                + " New parent portal accounts are now active. Parents can sign in with mobile OTP on their registered number. "
                + "If email login is enabled, complete email verification from Profile > Security before using password login.";
    }

    private static String schoolIdentityLine(String schoolName, String schoolCode) {
        String name = blankToNull(schoolName);
        String code = blankToNull(schoolCode);
        if (name != null && code != null) {
            return "School: " + name + " (" + code + ").";
        }
        if (name != null) {
            return "School: " + name + ".";
        }
        if (code != null) {
            return "School code: " + code + ".";
        }
        return "School portal access update.";
    }

    private record PortalContactChange(boolean newlyProvisioned, boolean emailChanged, boolean phoneChanged) {
    }

    private record SchoolIdentity(String name, String code) {
    }

    private static Enums.Role parsePortalRole(String raw, boolean staffImport) {
        String n = blankToNull(raw);
        if (n == null) {
            return staffImport ? Enums.Role.SCHOOL_STAFF : Enums.Role.TEACHER;
        }
        return switch (n.toUpperCase(Locale.ROOT)) {
            case "LIBRARY", "LIBRARY_STAFF", "LIB" -> Enums.Role.LIBRARY_STAFF;
            case "STAFF", "SCHOOL_STAFF", "BASE_STAFF" -> Enums.Role.SCHOOL_STAFF;
            case "TEACHER", "TCH", "T" -> Enums.Role.TEACHER;
            default -> throw new BusinessException("Invalid portalrole: " + raw);
        };
    }

    private static Enums.LibraryStaffRole parseLibraryRole(String raw) {
        String n = blankToNull(raw);
        if (n == null) {
            return null;
        }
        String normalized = n.trim().toUpperCase(Locale.ROOT);
        if (normalized.equals("AUTO")) {
            return null;
        }
        return Enums.LibraryStaffRole.valueOf(normalized);
    }

    private static boolean truthy(String v) {
        if (v == null) {
            return false;
        }
        String s = v.trim().toLowerCase(Locale.ROOT);
        return s.equals("y") || s.equals("yes") || s.equals("true") || s.equals("1");
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

    private static String normalizeEmployeeCode(String value) {
        String normalized = blankToNull(value);
        return normalized != null ? normalized.toUpperCase(Locale.ROOT) : null;
    }

    private static String normalizeEmailOptional(String value) {
        String normalized = blankToNull(value);
        return normalized != null ? normalized.toLowerCase(Locale.ROOT) : null;
    }

    private static String canonicalPhoneRequired(String value) {
        String raw = blankToNull(value);
        if (raw == null) {
            throw new BusinessException("phone is required");
        }
        String canonical = InternationalPhone.canonical(raw);
        if (canonical == null) {
            throw new BusinessException(InternationalPhone.invalidMessage());
        }
        return canonical;
    }

    private static Long parseLong(String value) {
        String normalized = blankToNull(value);
        return normalized != null ? Long.parseLong(normalized) : null;
    }

    private static final DateTimeFormatter CSV_DMY_DASH = DateTimeFormatter.ofPattern("dd-MM-uuuu");
    private static final DateTimeFormatter CSV_DMY_SLASH = DateTimeFormatter.ofPattern("dd/MM/uuuu");

    private static LocalDate parseDate(String value) {
        String normalized = blankToNull(value);
        if (normalized == null) {
            return null;
        }
        try {
            return LocalDate.parse(normalized);
        } catch (DateTimeParseException ignored) {
            // Accept common spreadsheet date formats used in school onboarding packs.
        }
        try {
            return LocalDate.parse(normalized, CSV_DMY_DASH);
        } catch (DateTimeParseException ignored) {
        }
        try {
            return LocalDate.parse(normalized, CSV_DMY_SLASH);
        } catch (DateTimeParseException ignored) {
        }
        throw new BusinessException("Invalid date format: " + value + " (use yyyy-MM-dd or dd-MM-yyyy)");
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
            return LocalTime.parse(normalized, CSV_TIME_FLEX);
        } catch (Exception ex) {
            throw new BusinessException("Invalid time for " + column + " (use HH:mm or H:mm): " + value);
        }
    }

    private static List<String> parseSubjects(String value) {
        String normalized = blankToNull(value);
        if (normalized == null) {
            return new ArrayList<>();
        }
        String delimiter = normalized.contains("|") ? "\\|" : ",";
        return java.util.Arrays.stream(normalized.split(delimiter))
                .map(String::trim)
                .filter(part -> !part.isEmpty())
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private static Enums.TeacherStatus parseTeacherStatus(String raw) {
        String normalized = blankToNull(raw);
        if (normalized == null) {
            return null;
        }
        return Enums.TeacherStatus.valueOf(normalized.trim().toUpperCase(Locale.ROOT));
    }

    private static String value(Map<String, String> row, String... keys) {
        for (String key : keys) {
            if (row.containsKey(key)) {
                String v = row.get(key);
                if (v != null) {
                    return v;
                }
            }
        }
        return null;
    }

    private static String requiredAny(Map<String, String> row, String... keys) {
        for (String key : keys) {
            String value = blankToNull(row.get(key));
            if (value != null) {
                return value;
            }
        }
        throw new BusinessException("Missing required column: " + keys[0]);
    }

    private static void promoteCanonicalClassTeacherSlotFields(Map<String, String> row) {
        if (blankToNull(row.get("classteacherfor")) == null) {
            String slot = blankToNull(value(row, "class_teacher_slot"));
            if (slot != null) {
                row.put("classteacherfor", slot);
            }
        }
        if (blankToNull(row.get("classteacheracademicyearid")) == null) {
            String ay = blankToNull(value(row, "academic_year_id", "academicyearid"));
            if (ay != null) {
                row.put("classteacheracademicyearid", ay);
            }
        }
    }

    private static List<FeeDTOs.FeeComponentDTO> parseFeeComponents(String componentSpec) {
        List<FeeDTOs.FeeComponentDTO> out = new ArrayList<>();
        for (String raw : componentSpec.split("\\|")) {
            String token = raw == null ? "" : raw.trim();
            if (token.isEmpty()) {
                continue;
            }
            String[] parts = token.split(":");
            if (parts.length < 2) {
                throw new BusinessException("Invalid componentspec token '" + token + "'. Use name:amount[:type].");
            }
            String name = parts[0].trim();
            BigDecimal amount;
            try {
                amount = new BigDecimal(parts[1].trim());
            } catch (NumberFormatException ex) {
                throw new BusinessException("Invalid amount in componentspec for component '" + name + "'.");
            }
            String type = parts.length >= 3 ? blankToNull(parts[2]) : null;
            out.add(FeeDTOs.FeeComponentDTO.builder()
                    .name(name)
                    .amount(amount)
                    .type(type)
                    .build());
        }
        if (out.isEmpty()) {
            throw new BusinessException("componentspec must include at least one component.");
        }
        return out;
    }

}
