package com.school.erp.modules.importexport.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.importer.BulkImportRowPolicy;
import com.school.erp.common.importer.ImportLineOutcome;
import com.school.erp.common.importer.LineApplyResult;
import com.school.erp.common.util.InternationalPhone;
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
import com.school.erp.modules.fees.dto.FeeDTOs;
import com.school.erp.modules.fees.service.FeeService;
import com.school.erp.modules.academic.dto.AcademicMutationRequests;
import com.school.erp.modules.academic.entity.SchoolClass;
import com.school.erp.modules.academic.entity.Section;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
import com.school.erp.platform.port.NotificationDispatchPort;
import com.school.erp.tenant.TenantContext;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
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
    private final SchoolClassRepository schoolClassRepository;
    private final TimetableService timetableService;
    private final TimetableRepository timetableRepository;
    private final PortalUserProvisioningService portalUserProvisioningService;
    private final NotificationService notificationService;
    private final NotificationDispatchPort notificationDispatchPort;
    private final TenantConfigRepository tenantConfigRepository;
    private final BulkImportAcademicResolver academicResolver;
    private final ImportBulkRowValidator bulkRowValidator;
    private final FeeService feeService;
    private final ImportLedgerWriteService importLedgerWriteService;

    public ImportRowExecutor(ObjectMapper objectMapper,
                           StudentService studentService,
                           TeacherService teacherService,
                           TeacherRepository teacherRepository,
                           com.school.erp.modules.academic.service.AcademicService academicService,
                           SchoolClassRepository schoolClassRepository,
                           TimetableService timetableService,
                           TimetableRepository timetableRepository,
                           PortalUserProvisioningService portalUserProvisioningService,
                           NotificationService notificationService,
                           NotificationDispatchPort notificationDispatchPort,
                           TenantConfigRepository tenantConfigRepository,
                           BulkImportAcademicResolver academicResolver,
                           ImportBulkRowValidator bulkRowValidator,
                           FeeService feeService,
                           ImportLedgerWriteService importLedgerWriteService) {
        this.objectMapper = objectMapper;
        this.studentService = studentService;
        this.teacherService = teacherService;
        this.teacherRepository = teacherRepository;
        this.academicService = academicService;
        this.schoolClassRepository = schoolClassRepository;
        this.timetableService = timetableService;
        this.timetableRepository = timetableRepository;
        this.portalUserProvisioningService = portalUserProvisioningService;
        this.notificationService = notificationService;
        this.notificationDispatchPort = notificationDispatchPort;
        this.tenantConfigRepository = tenantConfigRepository;
        this.academicResolver = academicResolver;
        this.bulkRowValidator = bulkRowValidator;
        this.feeService = feeService;
        this.importLedgerWriteService = importLedgerWriteService;
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
            case CLASSES -> handleClass(job, line, row);
            case TIMETABLE -> handleTimetable(job, line, row);
            case FEE_STRUCTURES -> handleFeeStructure(job, line, row);
        }
    }

    private void handleFeeStructure(ImportJob job, ImportJobLine line, Map<String, String> row) {
        SchoolClass cls = academicResolver.resolveClassOnly(row);
        Long academicYearId = academicResolver.resolveAcademicYearId(row.get("academicyearid"));
        BulkImportRowPolicy policy = BulkImportRowPolicy.fromCsv(row.get("importmode"));
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

        LineApplyResult<StudentDTOs.Response> applied = studentService.importStudentRow(request, policy);
        StudentDTOs.Response created = applied.value();
        line.setEntityType("STUDENT");
        line.setEntityId(created.getId());
        importLedgerWriteService.recordLine(job, line, applied.outcome(), "STUDENT", created.getId(), applied.naturalKey());

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
        String tenantId = TenantContext.getTenantId();
        String canonicalPhone = canonicalPhoneRequired(row.get("phone"));
        String loginEmail = normalizeEmailOptional(row.get("email"));
        String importPassword = blankToNull(row.get("portalpassword"));

        TeacherDTOs.CreateRequest request = new TeacherDTOs.CreateRequest();
        request.setFirstName(required(row, "firstname"));
        request.setLastName(required(row, "lastname"));
        request.setEmail(loginEmail);
        request.setPhone(canonicalPhone);
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
            // Teachers should be login-ready by default after onboarding.
            createPortal = row.get("createportal") == null || row.get("createportal").isBlank() || truthy(row.get("createportal"));
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
        String teacherLedgerType = staffImport ? "STAFF" : "TEACHER";
        line.setEntityType(teacherLedgerType);
        line.setEntityId(created.getId());
        importLedgerWriteService.recordLine(job, line, applied.outcome(), teacherLedgerType, created.getId(), applied.naturalKey());
        assignOptionalClassTeacherSlot(row, created.getId(), portalRole);

        if (createPortal && created.getUserId() != null) {
            String schoolCode = tenantConfigRepository.findByTenantId(tenantId).map(c -> c.getSchoolCode()).orElse("");
            String body = teacherCredentialMessage(schoolCode, loginEmail, canonicalPhone, importPassword, portalRole);
            notificationService.createNotification(tenantId, created.getUserId(), "Staff portal access",
                    body, Enums.NotificationType.INFO, "/app/dashboard");
            notificationDispatchPort.enqueue(tenantId, "STAFF_PORTAL_CREDENTIALS", "SMS", created.getUserId(),
                    canonicalPhone, "Staff portal access", body,
                    "import-job-" + job.getId() + "-line-" + line.getId(), "import-" + job.getId());
        }
    }

    private void assignOptionalClassTeacherSlot(Map<String, String> row, Long teacherId, Enums.Role portalRole) {
        BulkImportAcademicResolver.ResolvedPlacement placement = academicResolver
                .resolveOptionalClassTeacherPlacement(row)
                .orElse(null);
        if (placement == null) {
            return;
        }
        if (portalRole == Enums.Role.LIBRARY_STAFF) {
            throw new BusinessException("classteacherfor cannot be used for library staff rows");
        }
        academicService.assignClassTeacher(placement.classId(), placement.sectionId(), teacherId, null);
    }

    private void handleClass(ImportJob job, ImportJobLine line, Map<String, String> row) {
        String tenantId = TenantContext.getTenantId();
        Long resolvedAcademicYearId = academicResolver.resolveAcademicYearId(row.get("academicyearid"));
        String className = required(row, "name");
        Integer grade = Integer.parseInt(required(row, "grade"));
        List<String> desiredSections = parsePipeList(row.get("sections"));
        Integer sectionCapacity = parseInt(row.get("sectioncapacity"));

        SchoolClass existing = schoolClassRepository
                .findFirstByTenantIdAndAcademicYearIdAndNameIgnoreCaseAndIsDeletedFalse(
                        tenantId, resolvedAcademicYearId, className)
                .orElse(null);

        if (existing != null) {
            boolean changed = false;
            if (!className.equals(existing.getName()) || !grade.equals(existing.getGrade())) {
                AcademicMutationRequests.UpdateSchoolClassRequest updateReq = new AcademicMutationRequests.UpdateSchoolClassRequest();
                updateReq.setName(className);
                updateReq.setGrade(grade);
                academicService.updateClass(existing.getId(), updateReq);
                changed = true;
            }

            List<Section> currentSections = academicService.getSectionsByClass(existing.getId());
            Map<String, Section> currentByName = new HashMap<>();
            for (Section section : currentSections) {
                currentByName.put(section.getName().trim().toLowerCase(Locale.ROOT), section);
            }
            for (String sectionName : desiredSections) {
                String normalizedKey = sectionName.trim().toLowerCase(Locale.ROOT);
                Section current = currentByName.get(normalizedKey);
                if (current == null) {
                    academicService.addSection(existing.getId(), sectionName, sectionCapacity);
                    changed = true;
                    continue;
                }
                if (sectionCapacity != null && !sectionCapacity.equals(current.getCapacity())) {
                    AcademicMutationRequests.UpdateSectionRequest sectionUpdateReq = new AcademicMutationRequests.UpdateSectionRequest();
                    sectionUpdateReq.setName(current.getName());
                    sectionUpdateReq.setCapacity(sectionCapacity);
                    academicService.updateSection(current.getId(), sectionUpdateReq);
                    changed = true;
                }
            }

            line.setEntityType("CLASS");
            line.setEntityId(existing.getId());
            String nk = "NAME:" + existing.getName() + "|G:" + existing.getGrade() + "|AY:" + resolvedAcademicYearId;
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
                .sectionNames(desiredSections)
                .sectionCapacity(sectionCapacity)
                .build();
        com.school.erp.modules.academic.entity.SchoolClass created = academicService.createClass(req);
        line.setEntityType("CLASS");
        line.setEntityId(created.getId());
        String nk = "NAME:" + created.getName() + "|G:" + created.getGrade() + "|AY:" + resolvedAcademicYearId;
        importLedgerWriteService.recordLine(job, line, ImportLineOutcome.CREATED, "CLASS", created.getId(), nk);
    }

    private void handleTimetable(ImportJob job, ImportJobLine line, Map<String, String> row) {
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

        final boolean[] wasUpdate = {false};
        TimetableEntry saved = timetableRepository
                .findFirstByTenantAndClassSectionDayPeriod(tenantId, placement.classId(), placement.sectionId(), day, period)
                .map(existing -> {
                    wasUpdate[0] = true;
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
        ImportLineOutcome toOutcome = wasUpdate[0] ? ImportLineOutcome.UPDATED : ImportLineOutcome.CREATED;
        String nk = "C:" + placement.classId() + "|S:" + placement.sectionId() + "|" + day + "|P" + period + "|AY:" + academicYearId;
        importLedgerWriteService.recordLine(job, line, toOutcome, "TIMETABLE", saved.getId(), nk);
    }

    private Teacher resolveTimetableTeacher(Map<String, String> row, String tenantId) {
        String teacherEmail = blankToNull(row.get("teacheremail"));
        String teacherPhone = blankToNull(row.get("teacherphone"));
        Long teacherId = parseLong(row.get("teacherid"));
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
        throw new BusinessException("teacherid, teacherphone, or teacheremail is required");
    }

    private static String credentialMessage(String schoolCode, String email, String phone, String plainPassword, boolean createdNew) {
        if (createdNew && email != null && !email.isBlank() && plainPassword != null) {
            return "Welcome to the parent portal. School code: " + schoolCode + ". Email: " + email
                    + ". Temporary password: " + plainPassword
                    + ". Verify email from Profile > Security, then set your own password. You can also sign in with OTP on your registered phone.";
        }
        if (createdNew) {
            return "Welcome to the parent portal. School code: " + schoolCode
                    + ". Sign in with OTP using your registered mobile " + (phone != null ? phone : "") + ".";
        }
        return "Your parent portal account is linked to this student. School code: " + schoolCode
                + ". Sign in with your email or phone OTP.";
    }

    private static String teacherCredentialMessage(
            String schoolCode,
            String loginEmail,
            String phone,
            String providedPassword,
            Enums.Role portalRole) {
        String persona = portalRole == Enums.Role.LIBRARY_STAFF ? "library staff" : "teacher";
        StringBuilder sb = new StringBuilder("Your ").append(persona)
                .append(" profile has been onboarded successfully. School code: ")
                .append(schoolCode).append(". ");
        if (loginEmail != null && !loginEmail.isBlank()) {
            sb.append("Email login: ").append(loginEmail).append(". ");
            if (providedPassword != null && !providedPassword.isBlank()) {
                sb.append("Password: ").append(providedPassword).append(". ");
            } else {
                sb.append("Set password from your profile or use Forgot password after you verify email. ");
            }
        } else {
            sb.append("No email on file; sign in with mobile OTP only until email is added and verified. ");
        }
        sb.append("Mobile OTP login is enabled on ").append(phone).append(".");
        return sb.toString();
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
