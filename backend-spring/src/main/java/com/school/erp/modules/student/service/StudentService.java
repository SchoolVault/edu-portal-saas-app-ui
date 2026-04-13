package com.school.erp.modules.student.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.DuplicateResourceException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.exception.UnauthorizedException;
import com.school.erp.common.importer.ZipCsvImportUtil;
import com.school.erp.modules.academic.entity.Section;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
import com.school.erp.modules.academic.repository.SectionRepository;
import com.school.erp.events.domain.StudentAdmittedEvent;
import com.school.erp.events.domain.StudentEnrollmentChangedEvent;
import com.school.erp.modules.student.dto.StudentDTOs;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.mapper.StudentResponseMapper;
import com.school.erp.modules.student.port.StudentPersistencePort;
import com.school.erp.platform.port.DomainEventPublisher;
import com.school.erp.tenant.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
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

    @Transactional(readOnly = true)
    public PageResponse<StudentDTOs.Response> getStudents(int page, int size, Long classId, Enums.StudentStatus status, String search, String sortBy, String direction) {
        String tenantId = TenantContext.getTenantId();
        log.debug("Listing students page={} classId={} status={} searchPresent={}", page, classId, status, search != null && !search.isBlank());
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
            result = studentPersistence.findByFiltersClassScope(tenantId, classIds, classId, status, search, PageRequest.of(page, size, sort));
        } else {
            result = studentPersistence.findByFilters(tenantId, classId, status, search, PageRequest.of(page, size, sort));
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
            throw new UnauthorizedException("You are not allowed to view this student");
        }
        log.info("Student loaded id={} admissionNumber={}", id, student.getAdmissionNumber());
        return toResponse(student);
    }

    @Transactional(readOnly = true)
    public List<StudentDTOs.Response> getStudentsByClass(Long classId) {
        log.debug("Listing students by classId={}", classId);
        if (!teacherRosterScopeService.teacherMayAccessStudentClass(classId)) {
            throw new UnauthorizedException("You are not allowed to view this class roster");
        }
        List<StudentDTOs.Response> list = studentPersistence.findByTenantIdAndClassIdAndIsDeletedFalse(TenantContext.getTenantId(), classId).stream()
                .filter(s -> s.getStatus() == Enums.StudentStatus.ACTIVE)
                .map(this::toResponse)
                .collect(Collectors.toList());
        log.info("Students in class classId={} count={}", classId, list.size());
        return list;
    }

    @Transactional(readOnly = true)
    public List<StudentDTOs.Response> getStudentsByClassAndSection(Long classId, Long sectionId) {
        log.debug("Listing students classId={} sectionId={}", classId, sectionId);
        if (!teacherRosterScopeService.teacherMayAccessStudentClass(classId)) {
            throw new UnauthorizedException("You are not allowed to view this class roster");
        }
        List<StudentDTOs.Response> list = studentPersistence.findByTenantIdAndClassIdAndSectionIdAndIsDeletedFalse(TenantContext.getTenantId(), classId, sectionId).stream()
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
        schoolClassRepository.findByIdAndTenantIdAndIsDeletedFalse(request.getClassId(), tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Class", request.getClassId()));
        if (request.getSectionId() != null) {
            Section sec = sectionRepository.findByIdAndTenantIdAndIsDeletedFalse(request.getSectionId(), tenantId)
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
        Student student = Student.builder().firstName(request.getFirstName()).lastName(request.getLastName()).email(email).phone(request.getPhone()).dateOfBirth(request.getDateOfBirth()).gender(request.getGender()).classId(request.getClassId()).sectionId(request.getSectionId()).rollNumber(request.getRollNumber()).admissionNumber(admNo).admissionDate(request.getAdmissionDate() != null ? request.getAdmissionDate() : LocalDate.now()).parentId(request.getParentId()).parentName(request.getParentName()).address(request.getAddress()).bloodGroup(request.getBloodGroup()).status(Enums.StudentStatus.ACTIVE).build();
        student.setTenantId(tenantId);
        student.setCreatedBy(TenantContext.getUserId() != null ? TenantContext.getUserId().toString() : null);
        studentPersistence.save(student);
        log.info("Student created: {} {} [{}]", student.getFirstName(), student.getLastName(), student.getAdmissionNumber());
        domainEventPublisher.publish(new StudentAdmittedEvent(
                tenantId,
                student.getId(),
                student.getClassId(),
                student.getSectionId(),
                student.getAdmissionNumber(),
                Instant.now()));
        return toResponse(student);
    }

    @Transactional
    public StudentDTOs.Response updateStudent(Long id, StudentDTOs.UpdateRequest request) {
        log.info("Updating student id={}", id);
        Student student = studentPersistence.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId()).orElseThrow(() -> new ResourceNotFoundException("Student", id));
        Long priorClassId = student.getClassId();
        Long priorSectionId = student.getSectionId();
        if (request.getFirstName() != null) student.setFirstName(request.getFirstName());
        if (request.getLastName() != null) student.setLastName(request.getLastName());
        if (request.getEmail() != null) student.setEmail(request.getEmail());
        if (request.getPhone() != null) student.setPhone(request.getPhone());
        if (request.getDateOfBirth() != null) student.setDateOfBirth(request.getDateOfBirth());
        if (request.getGender() != null) student.setGender(request.getGender());
        if (request.getClassId() != null) student.setClassId(request.getClassId());
        if (request.getSectionId() != null) student.setSectionId(request.getSectionId());
        if (request.getRollNumber() != null) student.setRollNumber(request.getRollNumber());
        if (request.getParentId() != null) student.setParentId(request.getParentId());
        if (request.getParentName() != null) student.setParentName(request.getParentName());
        if (request.getAddress() != null) student.setAddress(request.getAddress());
        if (request.getBloodGroup() != null) student.setBloodGroup(request.getBloodGroup());
        if (request.getStatus() != null) student.setStatus(request.getStatus());
        student.setUpdatedBy(TenantContext.getUserId() != null ? TenantContext.getUserId().toString() : null);
        studentPersistence.save(student);
        boolean classChanged = request.getClassId() != null && !java.util.Objects.equals(priorClassId, student.getClassId());
        boolean sectionChanged = request.getSectionId() != null && !java.util.Objects.equals(priorSectionId, student.getSectionId());
        if (classChanged || sectionChanged) {
            domainEventPublisher.publish(new StudentEnrollmentChangedEvent(
                    TenantContext.getTenantId(),
                    student.getId(),
                    priorClassId,
                    student.getClassId(),
                    priorSectionId,
                    student.getSectionId(),
                    Instant.now()));
        }
        log.info("Student updated id={}", id);
        return toResponse(student);
    }

    @Transactional
    public void deleteStudent(Long id) {
        log.warn("Soft-deleting student id={}", id);
        Student student = studentPersistence.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId()).orElseThrow(() -> new ResourceNotFoundException("Student", id));
        student.markSoftDeleted();
        studentPersistence.save(student);
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
     * CSV aligned with bulk import template ({@code students.csv} inside ZIP).
     */
    @Transactional(readOnly = true)
    public String exportStudentsAsCsv() {
        String tenantId = TenantContext.getTenantId();
        StringBuilder sb = new StringBuilder();
        sb.append("firstname,lastname,email,phone,dateofbirth,gender,classid,sectionid,rollnumber,admissionnumber,admissiondate,parentid,parentname,parentemail,parentphone,notifycredentials,address,bloodgroup\n");
        for (Student s : studentPersistence.findByTenantIdAndIsDeletedFalse(tenantId)) {
            sb.append(csv(s.getFirstName())).append(',');
            sb.append(csv(s.getLastName())).append(',');
            sb.append(csv(s.getEmail())).append(',');
            sb.append(csv(s.getPhone())).append(',');
            sb.append(s.getDateOfBirth() != null ? s.getDateOfBirth() : "").append(',');
            sb.append(s.getGender() != null ? s.getGender().name().toLowerCase() : "").append(',');
            sb.append(s.getClassId() != null ? s.getClassId() : "").append(',');
            sb.append(s.getSectionId() != null ? s.getSectionId() : "").append(',');
            sb.append(csv(s.getRollNumber())).append(',');
            sb.append(csv(s.getAdmissionNumber())).append(',');
            sb.append(s.getAdmissionDate() != null ? s.getAdmissionDate() : "").append(',');
            sb.append(s.getParentId() != null ? s.getParentId() : "").append(',');
            sb.append(csv(s.getParentName())).append(",,,");
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
                          final DomainEventPublisher domainEventPublisher) {
        this.studentPersistence = studentPersistence;
        this.schoolClassRepository = schoolClassRepository;
        this.sectionRepository = sectionRepository;
        this.teacherRosterScopeService = teacherRosterScopeService;
        this.domainEventPublisher = domainEventPublisher;
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
