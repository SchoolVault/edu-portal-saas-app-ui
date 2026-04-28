package com.school.erp.modules.student.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.DuplicateResourceException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.exception.ForbiddenException;
import com.school.erp.common.importer.BulkImportRowPolicy;
import com.school.erp.common.importer.ImportLineOutcome;
import com.school.erp.common.importer.LineApplyResult;
import com.school.erp.common.importer.ZipCsvImportUtil;
import com.school.erp.modules.academic.entity.Section;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
import com.school.erp.modules.academic.repository.SectionRepository;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.events.domain.StudentAdmittedEvent;
import com.school.erp.events.domain.StudentEnrollmentChangedEvent;
import com.school.erp.modules.student.dto.StudentDTOs;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.guardian.service.GuardianLinkSyncService;
import com.school.erp.modules.importexport.service.StudentImportCanonicalRow;
import com.school.erp.modules.notification.service.NotificationService;
import com.school.erp.modules.reports.service.DashboardSnapshotInvalidationService;
import com.school.erp.modules.student.mapper.StudentResponseMapper;
import com.school.erp.modules.student.port.StudentPersistencePort;
import com.school.erp.modules.auth.service.PortalUserProvisioningService;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.cache.CacheService;
import com.school.erp.cache.CacheService.CacheRegion;
import com.school.erp.config.CacheConfig;
import com.school.erp.platform.port.DomainEventPublisher;
import com.school.erp.platform.port.NotificationDispatchPort;
import com.school.erp.tenant.TenantContext;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class StudentService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(StudentService.class);
    private final StudentPersistencePort studentPersistence;
    private final SchoolClassRepository schoolClassRepository;
    private final SectionRepository sectionRepository;
    private final TeacherRosterScopeService teacherRosterScopeService;
    private final DomainEventPublisher domainEventPublisher;
    private final GuardianLinkSyncService guardianLinkSyncService;
    private final PortalUserProvisioningService portalUserProvisioningService;
    private final NotificationService notificationService;
    private final NotificationDispatchPort notificationDispatchPort;
    private final TenantConfigRepository tenantConfigRepository;
    private final UserRepository userRepository;
    private final ObjectProvider<CacheService> cacheService;
    private final DashboardSnapshotInvalidationService dashboardSnapshotInvalidationService;

    @Cacheable(cacheNames = CacheConfig.STUDENT_DIRECTORY, keyGenerator = "tenantMethodParamsKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public PageResponse<StudentDTOs.Response> getStudents(int page, int size, Long classId, Long sectionId, Enums.StudentStatus status, String search, String sortBy, String direction) {
        String tenantId = TenantContext.getTenantId();
        log.debug("Listing students page={} classId={} sectionId={} status={} searchPresent={}", page, classId, sectionId, status, search != null && !search.isBlank());
        Sort sort = Sort.by(Sort.Direction.fromString(direction != null ? direction : "asc"), sortBy != null ? sortBy : "firstName");
        Optional<Set<Long>> teacherScope = teacherRosterScopeService.allowedClassIdsForCurrentUser();
        Page<Student> result;
        if (teacherScope.isPresent()) {
            Set<Long> classIds = teacherScope.get();
            if (classIds.isEmpty()) {
                return PageResponse.of(List.of(), page, size, 0);
            }
            if (classId != null && !classIds.contains(classId)) {
                return PageResponse.of(List.of(), page, size, 0);
            }
            result = studentPersistence.findByFiltersClassScope(tenantId, classIds, classId, sectionId, status, search, PageRequest.of(page, size, sort));
        } else {
            result = studentPersistence.findByFilters(tenantId, classId, sectionId, status, search, PageRequest.of(page, size, sort));
        }
        Map<Long, String> classNames = new HashMap<>();
        Map<Long, String> sectionNames = new HashMap<>();
        List<StudentDTOs.Response> content = result.getContent().stream()
                .map(s -> toResponse(s, classNames, sectionNames))
                .collect(Collectors.toList());
        log.info("Students page loaded page={} returned={} total={}", page, content.size(), result.getTotalElements());
        return PageResponse.of(content, page, size, result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public StudentDTOs.Response getStudentById(Long id) {
        log.debug("Fetching student id={}", id);
        Student student = studentPersistence.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId()).orElseThrow(() -> new ResourceNotFoundException("Student", id));
        if (!teacherRosterScopeService.teacherMayAccessStudentClass(student.getClassId())) {
            throw new ForbiddenException("You are not allowed to view this student");
        }
        log.info("Student loaded id={} admissionNumber={}", id, student.getAdmissionNumber());
        return toResponse(student);
    }

    @Cacheable(cacheNames = CacheConfig.STUDENT_DIRECTORY, keyGenerator = "tenantMethodParamsKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public List<StudentDTOs.Response> getStudentsByClass(Long classId) {
        log.debug("Listing students by classId={}", classId);
        if (!teacherRosterScopeService.teacherMayAccessStudentClass(classId)) {
            throw new ForbiddenException("You are not allowed to view this class roster");
        }
        List<StudentDTOs.Response> list = studentPersistence.findByTenantIdAndClassIdAndIsDeletedFalse(TenantContext.getTenantId(), classId).stream()
                .filter(s -> s.getStatus() == Enums.StudentStatus.ACTIVE)
                .map(this::toResponse)
                .collect(Collectors.toList());
        log.info("Students in class classId={} count={}", classId, list.size());
        return list;
    }

    @Cacheable(cacheNames = CacheConfig.STUDENT_DIRECTORY, keyGenerator = "tenantMethodParamsKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public List<StudentDTOs.Response> getStudentsByClassAndSection(Long classId, Long sectionId) {
        log.debug("Listing students classId={} sectionId={}", classId, sectionId);
        if (!teacherRosterScopeService.teacherMayAccessStudentClass(classId)) {
            throw new ForbiddenException("You are not allowed to view this class roster");
        }
        String tenantId = TenantContext.getTenantId();
        List<Student> rows;
        if (sectionId == null || sectionId == 0L) {
            List<Student> inClass = studentPersistence.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, classId);
            rows = inClass.stream()
                    .filter(s -> s.getSectionId() == null || s.getSectionId() == 0L)
                    .collect(Collectors.toList());
            if (rows.isEmpty()) {
                rows = inClass;
            }
        } else {
            rows = studentPersistence.findByTenantIdAndClassIdAndSectionIdAndIsDeletedFalse(tenantId, classId, sectionId);
        }
        List<StudentDTOs.Response> list = rows.stream()
                .filter(s -> s.getStatus() == Enums.StudentStatus.ACTIVE)
                .map(this::toResponse)
                .collect(Collectors.toList());
        log.info("Students in class/section classId={} sectionId={} count={}", classId, sectionId, list.size());
        return list;
    }

    @Transactional
    public StudentDTOs.Response createStudent(StudentDTOs.CreateRequest request) {
        String tenantId = TenantContext.getTenantId();
        if (request.getClassId() == null) {
            throw new BusinessException("classId is required");
        }
        Long normalizedSectionId = normalizeSectionId(request.getSectionId());
        schoolClassRepository.findByIdAndTenantIdAndIsDeletedFalse(request.getClassId(), tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Class", request.getClassId()));
        List<Section> classSections = sectionRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, request.getClassId());
        if (!classSections.isEmpty() && normalizedSectionId == null) {
            throw new BusinessException("sectionId is required for classes that have sections");
        }
        if (normalizedSectionId != null) {
            Section sec = sectionRepository.findByIdAndTenantIdAndIsDeletedFalse(normalizedSectionId, tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Section", request.getSectionId()));
            if (!request.getClassId().equals(sec.getClassId())) {
                throw new BusinessException("sectionId does not belong to the given classId");
            }
        }
        String admNo = request.getAdmissionNumber();
        if (admNo == null || admNo.isBlank()) {
            admNo = "ADM" + System.currentTimeMillis();
        }
        if (studentPersistence.existsByTenantIdAndAdmissionNumber(tenantId, admNo)) {
            log.warn("Student create rejected: duplicate admissionNumber={}", admNo);
            throw new DuplicateResourceException("Admission number already exists: " + admNo);
        }
        String email = request.getEmail();
        if (email != null && email.isBlank()) {
            email = null;
        }
        Student student = Student.builder().firstName(request.getFirstName()).lastName(request.getLastName()).email(email).phone(request.getPhone()).dateOfBirth(request.getDateOfBirth()).gender(request.getGender()).classId(request.getClassId()).sectionId(normalizedSectionId).rollNumber(request.getRollNumber()).admissionNumber(admNo).admissionDate(request.getAdmissionDate() != null ? request.getAdmissionDate() : LocalDate.now()).parentId(request.getParentId()).parentName(request.getParentName()).address(request.getAddress()).bloodGroup(request.getBloodGroup()).status(Enums.StudentStatus.ACTIVE).build();
        PortalUserProvisioningService.ProvisionResult parentProvision = applyParentPortalAutoLink(
                tenantId, request.getParentId(), request.getParentName(),
                request.getParentPhone(), request.getParentEmail(), request.getCreateParentPortal(), student);
        student.setTenantId(tenantId);
        student.setCreatedBy(TenantContext.getUserId() != null ? TenantContext.getUserId().toString() : null);
        studentPersistence.save(student);
        log.info("Student created: {} {} [{}]", student.getFirstName(), student.getLastName(), student.getAdmissionNumber());
        sendParentOnboardingForManualCreate(tenantId, request.getParentEmail(), request.getParentPhone(), parentProvision);
        guardianLinkSyncService.syncForStudent(student);
        domainEventPublisher.publish(new StudentAdmittedEvent(
                tenantId,
                student.getId(),
                student.getClassId(),
                student.getSectionId(),
                student.getAdmissionNumber(),
                Instant.now()));
        evictStudentAndAcademicCaches();
        return toResponse(student);
    }

    /**
     * Bulk import path: supports {@link BulkImportRowPolicy} for admission-number collisions.
     */
    @Transactional
    public LineApplyResult<StudentDTOs.Response> importStudentRow(StudentDTOs.CreateRequest request, BulkImportRowPolicy policy) {
        String tenantId = TenantContext.getTenantId();
        String natural = studentImportNaturalKey(request);
        String adm = request.getAdmissionNumber();
        if (adm == null || adm.isBlank()) {
            return new LineApplyResult<>(createStudent(request), ImportLineOutcome.CREATED, natural);
        }
        adm = adm.trim();
        Optional<Student> existing = studentPersistence.findByTenantIdAndAdmissionNumberAndIsDeletedFalse(tenantId, adm);
        if (existing.isPresent()) {
            if (policy == BulkImportRowPolicy.SKIP_IF_EXISTS) {
                return new LineApplyResult<>(toResponse(existing.get()), ImportLineOutcome.SKIPPED, "ADM:" + adm);
            }
            if (policy == BulkImportRowPolicy.UPSERT) {
                StudentDTOs.UpdateRequest u = new StudentDTOs.UpdateRequest();
                u.setFirstName(request.getFirstName());
                u.setLastName(request.getLastName());
                u.setEmail(request.getEmail());
                u.setPhone(request.getPhone());
                u.setDateOfBirth(request.getDateOfBirth());
                u.setGender(request.getGender());
                u.setClassId(request.getClassId());
                u.setSectionId(request.getSectionId());
                u.setRollNumber(request.getRollNumber());
                u.setParentId(request.getParentId());
                u.setParentName(request.getParentName());
                u.setAddress(request.getAddress());
                u.setBloodGroup(request.getBloodGroup());
                return new LineApplyResult<>(updateStudent(existing.get().getId(), u), ImportLineOutcome.UPDATED, "ADM:" + adm);
            }
            throw new DuplicateResourceException("Admission number already exists: " + adm);
        }
        return new LineApplyResult<>(createStudent(request), ImportLineOutcome.CREATED, "ADM:" + adm);
    }

    private static String studentImportNaturalKey(StudentDTOs.CreateRequest request) {
        if (request.getAdmissionNumber() != null && !request.getAdmissionNumber().isBlank()) {
            return "ADM:" + request.getAdmissionNumber().trim();
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            return "PHONE:" + request.getPhone().trim();
        }
        if (request.getRollNumber() != null && !request.getRollNumber().isBlank()) {
            return "ROLL:" + request.getRollNumber().trim();
        }
        return "NEW";
    }

    @Transactional
    public StudentDTOs.Response updateStudent(Long id, StudentDTOs.UpdateRequest request) {
        log.info("Updating student id={}", id);
        String tenantId = TenantContext.getTenantId();
        Student student = studentPersistence.findByIdAndTenantIdAndIsDeletedFalse(id, tenantId).orElseThrow(() -> new ResourceNotFoundException("Student", id));
        Long priorClassId = student.getClassId();
        Long priorSectionId = student.getSectionId();
        Long targetClassId = request.getClassId() != null ? request.getClassId() : student.getClassId();
        schoolClassRepository.findByIdAndTenantIdAndIsDeletedFalse(targetClassId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Class", targetClassId));
        List<Section> targetClassSections = sectionRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, targetClassId);
        boolean classChangedByRequest = request.getClassId() != null && !java.util.Objects.equals(priorClassId, targetClassId);
        Long normalizedSectionId = normalizeSectionId(request.getSectionId());
        if (request.getFirstName() != null) student.setFirstName(request.getFirstName());
        if (request.getLastName() != null) student.setLastName(request.getLastName());
        if (request.getEmail() != null) student.setEmail(request.getEmail());
        if (request.getPhone() != null) student.setPhone(request.getPhone());
        if (request.getDateOfBirth() != null) student.setDateOfBirth(request.getDateOfBirth());
        if (request.getGender() != null) student.setGender(request.getGender());
        if (request.getClassId() != null) student.setClassId(request.getClassId());
        if (normalizedSectionId != null) {
            Section sec = sectionRepository.findByIdAndTenantIdAndIsDeletedFalse(normalizedSectionId, tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Section", normalizedSectionId));
            if (!targetClassId.equals(sec.getClassId())) {
                throw new BusinessException("sectionId does not belong to the given classId");
            }
            student.setSectionId(normalizedSectionId);
        } else if (request.getSectionId() != null) {
            student.setSectionId(null);
        } else if (classChangedByRequest) {
            if (!targetClassSections.isEmpty()) {
                throw new BusinessException("sectionId is required when moving a student into a class that has sections");
            }
            student.setSectionId(null);
        }
        if (!targetClassSections.isEmpty() && normalizeSectionId(student.getSectionId()) == null) {
            Section fallbackSection = targetClassSections.stream()
                    .sorted(Comparator.comparing(Section::getName))
                    .findFirst()
                    .orElseThrow(() -> new BusinessException("Target class has sections configured but none are available for enrollment."));
            student.setSectionId(fallbackSection.getId());
            log.warn("Auto-assigned student id={} to fallback section id={} for class id={} to keep class-section counts consistent",
                    student.getId(), fallbackSection.getId(), targetClassId);
        }
        if (request.getRollNumber() != null) student.setRollNumber(request.getRollNumber());
        if (request.getParentId() != null) student.setParentId(request.getParentId());
        if (request.getParentName() != null) student.setParentName(request.getParentName());
        applyParentPortalAutoLink(tenantId, request.getParentId(), request.getParentName(),
                request.getParentPhone(), request.getParentEmail(), request.getCreateParentPortal(), student);
        if (request.getAddress() != null) student.setAddress(request.getAddress());
        if (request.getBloodGroup() != null) student.setBloodGroup(request.getBloodGroup());
        if (request.getStatus() != null) student.setStatus(request.getStatus());
        student.setUpdatedBy(TenantContext.getUserId() != null ? TenantContext.getUserId().toString() : null);
        studentPersistence.save(student);
        guardianLinkSyncService.syncForStudent(student);
        boolean classChanged = !java.util.Objects.equals(priorClassId, student.getClassId());
        boolean sectionChanged = !java.util.Objects.equals(priorSectionId, student.getSectionId());
        if (classChanged || sectionChanged) {
            domainEventPublisher.publish(new StudentEnrollmentChangedEvent(
                    tenantId,
                    student.getId(),
                    priorClassId,
                    student.getClassId(),
                    priorSectionId,
                    student.getSectionId(),
                    Instant.now()));
        }
        evictStudentAndAcademicCaches();
        log.info("Student updated id={}", id);
        return toResponse(student);
    }

    @Transactional
    public void deleteStudent(Long id) {
        log.warn("Soft-deleting student id={}", id);
        String tenantId = TenantContext.getTenantId();
        Student student = studentPersistence.findByIdAndTenantIdAndIsDeletedFalse(id, tenantId).orElseThrow(() -> new ResourceNotFoundException("Student", id));
        Long priorClassId = student.getClassId();
        Long priorSectionId = student.getSectionId();
        student.markSoftDeleted();
        studentPersistence.save(student);
        domainEventPublisher.publish(new StudentEnrollmentChangedEvent(
                tenantId,
                student.getId(),
                priorClassId,
                null,
                priorSectionId,
                null,
                Instant.now()));
        evictStudentAndAcademicCaches();
        log.info("Student soft-deleted: {}", id);
    }

    @Transactional
    public List<StudentDTOs.Response> bulkCreate(StudentDTOs.BulkUploadRequest request) {
        int n = request.getStudents() != null ? request.getStudents().size() : 0;
        log.info("Bulk creating {} student(s)", n);
        return request.getStudents().stream().map(this::createStudent).collect(Collectors.toList());
    }

    @Transactional
    public StudentDTOs.BulkUploadReport bulkCreateWithReport(StudentDTOs.BulkUploadRequest request) {
        StudentDTOs.BulkUploadReport report = new StudentDTOs.BulkUploadReport();
        java.util.List<StudentDTOs.CreateRequest> students = request.getStudents();
        if (students == null) {
            log.warn("Bulk student upload: empty payload");
            return report;
        }
        log.info("Bulk student upload with report: {} row(s)", students.size());
        for (int i = 0; i < students.size(); i++) {
            StudentDTOs.CreateRequest cr = students.get(i);
            try {
                report.getSuccesses().add(createStudent(cr));
            } catch (Exception ex) {
                log.warn("Bulk student row {} failed: {}", i, ex.getMessage());
                StudentDTOs.BulkRowError err = new StudentDTOs.BulkRowError();
                err.setRowIndex(i);
                err.setAdmissionNumber(cr != null ? cr.getAdmissionNumber() : null);
                err.setMessage(ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName());
                report.getErrors().add(err);
            }
        }
        log.info("Bulk student upload done successes={} errors={}", report.getSuccesses().size(), report.getErrors().size());
        return report;
    }

    @Transactional
    public List<StudentDTOs.Response> importFromZip(MultipartFile file) {
        log.info("Importing students from zip students.csv");
        List<Map<String, String>> rows = ZipCsvImportUtil.readRows(file, "students.csv");
        List<StudentDTOs.Response> created = new ArrayList<>();
        for (Map<String, String> row : rows) {
            StudentImportCanonicalRow.normalize(row);
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
            request.setParentId(parseLong(row.get("parentid")));
            request.setParentName(blankToNull(row.get("parentname")));
            request.setAddress(blankToNull(row.get("address")));
            request.setBloodGroup(blankToNull(row.get("bloodgroup")));
            created.add(createStudent(request));
        }
        log.info("Student zip import finished count={}", created.size());
        return created;
    }

    @Transactional
    public int promoteStudents(StudentDTOs.PromotionRequest request) {
        String tenantId = TenantContext.getTenantId();
        log.info("Promote students fromClass={} toClass={} explicitIds={}",
                request.getFromClassId(), request.getToClassId(), request.getStudentIds() != null ? request.getStudentIds().size() : 0);
        List<Student> students;
        if (request.getStudentIds() != null && !request.getStudentIds().isEmpty()) {
            students = studentPersistence.findAllById(request.getStudentIds()).stream().filter(s -> s.getTenantId().equals(tenantId) && !s.getIsDeleted()).collect(Collectors.toList());
        } else {
            students = studentPersistence.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, request.getFromClassId());
        }
        students.forEach(s -> {
            s.setClassId(request.getToClassId());
            s.setSectionId(null); // Reset section - to be reassigned
        });
        studentPersistence.saveAll(students);
        log.info("Promoted {} students from class {} to class {}", students.size(), request.getFromClassId(), request.getToClassId());
        return students.size();
    }

    public long countStudents() {
        long n = studentPersistence.countByTenantIdAndIsDeletedFalse(TenantContext.getTenantId());
        log.debug("Student count tenant={} n={}", TenantContext.getTenantId(), n);
        return n;
    }

    /**
     * CSV aligned with bulk-import canonical ({@code students.csv}: snake_case + ERP naming; same contract as onboarding packs).
     */
    @Transactional(readOnly = true)
    public String exportStudentsAsCsv() {
        String tenantId = TenantContext.getTenantId();
        StringBuilder sb = new StringBuilder();
        sb.append(
                "academic_year_id,import_mode,first_name,last_name,gender,date_of_birth,student_email,class_id,section_id,classname,"
                        + "sectionname,roll_number,admission_number,admission_date,primary_guardian_relation,primary_guardian_name,primary_guardian_email,"
                        + "primary_guardian_phone,parent_id,create_parent_portal,notify_credentials,address,blood_group\n");
        for (Student s : studentPersistence.findByTenantIdAndIsDeletedFalse(tenantId)) {
            sb.append(','); // academic_year_id — omit; fill on fresh imports
            sb.append("UPSERT").append(',');
            sb.append(csv(s.getFirstName())).append(',');
            sb.append(csv(s.getLastName())).append(',');
            sb.append(s.getGender() != null ? s.getGender().name().toLowerCase() : "").append(',');
            sb.append(s.getDateOfBirth() != null ? s.getDateOfBirth() : "").append(',');
            sb.append(csv(s.getEmail())).append(',');
            sb.append(s.getClassId() != null ? s.getClassId() : "").append(',');
            sb.append(s.getSectionId() != null ? s.getSectionId() : "").append(',');
            sb.append(','); // classname — derive at import/export enrichment if needed
            sb.append(','); // sectionname
            sb.append(csv(s.getRollNumber())).append(',');
            sb.append(csv(s.getAdmissionNumber())).append(',');
            sb.append(s.getAdmissionDate() != null ? s.getAdmissionDate() : "").append(',');
            sb.append(','); // primary_guardian_relation
            sb.append(csv(s.getParentName())).append(',');
            sb.append(','); // primary_guardian_email — not denormalized on Student
            sb.append(','); // primary_guardian_phone — load from guardian user when added
            sb.append(s.getParentId() != null ? s.getParentId() : "").append(',');
            sb.append(','); // create_parent_portal
            sb.append(','); // notify_credentials
            sb.append(csv(s.getAddress())).append(',');
            sb.append(csv(s.getBloodGroup())).append('\n');
        }
        return sb.toString();
    }

    private static String csv(String v) {
        if (v == null) {
            return "";
        }
        String x = v.replace("\"", "\"\"");
        if (x.contains(",") || x.contains("\n") || x.contains("\"")) {
            return "\"" + x + "\"";
        }
        return x;
    }

    private StudentDTOs.Response toResponse(Student s) {
        return StudentResponseMapper.toResponse(s, TenantContext.getTenantId(), schoolClassRepository, sectionRepository);
    }

    private StudentDTOs.Response toResponse(Student s, Map<Long, String> classNameCache, Map<Long, String> sectionNameCache) {
        return StudentResponseMapper.toResponse(s, TenantContext.getTenantId(), schoolClassRepository, sectionRepository, classNameCache, sectionNameCache);
    }

    public StudentService(final StudentPersistencePort studentPersistence,
                          final SchoolClassRepository schoolClassRepository,
                          final SectionRepository sectionRepository,
                          final TeacherRosterScopeService teacherRosterScopeService,
                          final DomainEventPublisher domainEventPublisher,
                          final GuardianLinkSyncService guardianLinkSyncService,
                          final PortalUserProvisioningService portalUserProvisioningService,
                          final NotificationService notificationService,
                          final NotificationDispatchPort notificationDispatchPort,
                          final TenantConfigRepository tenantConfigRepository,
                          final UserRepository userRepository,
                          final ObjectProvider<CacheService> cacheService,
                          final DashboardSnapshotInvalidationService dashboardSnapshotInvalidationService) {
        this.studentPersistence = studentPersistence;
        this.schoolClassRepository = schoolClassRepository;
        this.sectionRepository = sectionRepository;
        this.teacherRosterScopeService = teacherRosterScopeService;
        this.domainEventPublisher = domainEventPublisher;
        this.guardianLinkSyncService = guardianLinkSyncService;
        this.portalUserProvisioningService = portalUserProvisioningService;
        this.notificationService = notificationService;
        this.notificationDispatchPort = notificationDispatchPort;
        this.tenantConfigRepository = tenantConfigRepository;
        this.userRepository = userRepository;
        this.cacheService = cacheService;
        this.dashboardSnapshotInvalidationService = dashboardSnapshotInvalidationService;
    }

    private PortalUserProvisioningService.ProvisionResult applyParentPortalAutoLink(
            String tenantId,
            Long explicitParentId,
            String parentName,
            String parentPhone,
            String parentEmail,
            Boolean createParentPortal,
            Student student) {
        if (explicitParentId != null) {
            return null;
        }
        boolean shouldAutoLink = Boolean.TRUE.equals(createParentPortal)
                || (parentPhone != null && !parentPhone.isBlank())
                || (parentEmail != null && !parentEmail.isBlank());
        if (!shouldAutoLink) {
            return null;
        }
        PortalUserProvisioningService.ProvisionResult parentProvision =
                portalUserProvisioningService.ensureParentUserForImport(
                        tenantId,
                        parentName,
                        parentEmail,
                        parentPhone);
        student.setParentId(parentProvision.userId());
        if ((student.getParentName() == null || student.getParentName().isBlank()) && parentName != null && !parentName.isBlank()) {
            student.setParentName(parentName.trim());
        }
        return parentProvision;
    }

    private void sendParentOnboardingForManualCreate(
            String tenantId,
            String parentEmail,
            String parentPhone,
            PortalUserProvisioningService.ProvisionResult parentProvision) {
        if (parentProvision == null || parentProvision.userId() == null || !parentProvision.createdNew()) {
            return;
        }
        SchoolIdentity school = loadSchoolIdentity(tenantId);
        String title = "Parent Portal Access Credentials";
        String body = parentCredentialMessage(
                school.name(),
                school.code(),
                parentEmail,
                parentPhone,
                parentProvision.plainPassword(),
                true);
        notificationService.createNotification(
                tenantId,
                parentProvision.userId(),
                title,
                body,
                Enums.NotificationType.INFO,
                "/app/parent/children");
        notificationDispatchPort.enqueue(
                tenantId,
                "PARENT_PORTAL_CREDENTIALS",
                "SMS",
                parentProvision.userId(),
                parentPhone,
                title,
                body,
                "manual-student-parent-" + parentProvision.userId(),
                "manual-student-parent-onboarding");
        notifyAdminsOnParentOnboarding(tenantId, school);
    }

    private void notifyAdminsOnParentOnboarding(String tenantId, SchoolIdentity school) {
        String title = "Parent Portal Onboarding Notice";
        String body = parentOnboardingBody(school.name(), school.code());
        java.util.LinkedHashSet<User> admins = new java.util.LinkedHashSet<>();
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
                        "manual-student-parent-admin-" + admin.getId(),
                        "manual-student-parent-onboarding");
            }
        }
    }

    private SchoolIdentity loadSchoolIdentity(String tenantId) {
        return tenantConfigRepository.findByTenantId(tenantId)
                .map(c -> new SchoolIdentity(blankToNull(c.getSchoolName()), blankToNull(c.getSchoolCode())))
                .orElseGet(() -> new SchoolIdentity(null, null));
    }

    private static String parentCredentialMessage(
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

    private static String parentOnboardingBody(String schoolName, String schoolCode) {
        return schoolIdentityLine(schoolName, schoolCode)
                + " New parent portal accounts are now active. Parents can sign in with mobile OTP on their registered number. "
                + "If email login is enabled, complete email verification from Profile > Security before using password login.";
    }

    private static String schoolIdentityLine(String schoolName, String schoolCode) {
        if (schoolName != null && schoolCode != null) {
            return "School: " + schoolName + " (" + schoolCode + ").";
        }
        if (schoolName != null) {
            return "School: " + schoolName + ".";
        }
        if (schoolCode != null) {
            return "School code: " + schoolCode + ".";
        }
        return "School portal access update.";
    }

    private record SchoolIdentity(String name, String code) {
    }

    private void evictStudentAndAcademicCaches() {
        cacheService.ifAvailable(cs -> {
            cs.clearRegion(CacheRegion.STUDENT_DIRECTORY);
            cs.clearRegion(CacheRegion.ACADEMIC_CATALOG);
        });
        dashboardSnapshotInvalidationService.invalidateCurrentTenant("student_directory_changed");
    }

    private Long normalizeSectionId(Long sectionId) {
        if (sectionId == null || sectionId <= 0L) {
            return null;
        }
        return sectionId;
    }

    private String required(Map<String, String> row, String key) {
        String value = blankToNull(row.get(key));
        if (value == null) {
            throw new com.school.erp.common.exception.BusinessException("Missing required column value: " + key);
        }
        return value;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private Long parseLong(String value) {
        String normalized = blankToNull(value);
        return normalized != null ? Long.parseLong(normalized) : null;
    }

    private Long parseLongRequired(Map<String, String> row, String key) {
        String value = required(row, key);
        return Long.parseLong(value);
    }

    private LocalDate parseDate(String value) {
        String normalized = blankToNull(value);
        return normalized != null ? LocalDate.parse(normalized) : null;
    }

    private Enums.Gender parseGender(String value) {
        String normalized = blankToNull(value);
        return normalized != null ? Enums.Gender.valueOf(normalized.toUpperCase()) : null;
    }
}
