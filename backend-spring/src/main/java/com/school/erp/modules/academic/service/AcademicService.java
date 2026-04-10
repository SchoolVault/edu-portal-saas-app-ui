package com.school.erp.modules.academic.service;

import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.academic.dto.AcademicDTOs;
import com.school.erp.modules.academic.dto.AcademicWorkflowDTOs;
import com.school.erp.modules.academic.entity.*;
import com.school.erp.modules.exams.repository.MarkRecordRepository;
import com.school.erp.modules.academic.repository.*;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.tenant.TenantContext;
import com.school.erp.tenant.TenantQueryPolicy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AcademicService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AcademicService.class);

    /** Used when a tenant has no {@code academic_subjects} rows yet (new school). */
    private static final List<AcademicDTOs.SubjectCatalogItem> DEFAULT_SUBJECT_CATALOG = List.of(
            new AcademicDTOs.SubjectCatalogItem(null, "MATH", "Mathematics", "STEM"),
            new AcademicDTOs.SubjectCatalogItem(null, "PHY", "Physics", "STEM"),
            new AcademicDTOs.SubjectCatalogItem(null, "CHEM", "Chemistry", "STEM"),
            new AcademicDTOs.SubjectCatalogItem(null, "BIO", "Biology", "STEM"),
            new AcademicDTOs.SubjectCatalogItem(null, "CS", "Computer Science", "STEM"),
            new AcademicDTOs.SubjectCatalogItem(null, "ENG", "English", "Languages"),
            new AcademicDTOs.SubjectCatalogItem(null, "HIST", "History", "Social"),
            new AcademicDTOs.SubjectCatalogItem(null, "GEO", "Geography", "Social"),
            new AcademicDTOs.SubjectCatalogItem(null, "PE", "Physical Education", "Arts"));

    private final AcademicYearRepository yearRepo;
    private final SchoolClassRepository classRepo;
    private final SectionRepository sectionRepo;
    private final StudentRepository studentRepo;
    private final MarkRecordRepository markRepo;
    private final TeacherAssignmentService teacherAssignmentService;
    private final AcademicSubjectRepository academicSubjectRepo;

    // ========== SUBJECT CATALOG ==========
    @Transactional(readOnly = true)
    public List<AcademicDTOs.SubjectCatalogItem> getSubjectCatalog() {
        String tenantId = TenantContext.getTenantId();
        log.debug("Fetching subject catalog tenantId={}", tenantId);
        List<AcademicSubject> rows = academicSubjectRepo.findByTenantIdAndIsDeletedFalseOrderBySortOrderAscNameAsc(tenantId);
        if (rows.isEmpty()) {
            log.info("Subject catalog empty for tenant={}; returning {} default platform subjects", tenantId, DEFAULT_SUBJECT_CATALOG.size());
            return DEFAULT_SUBJECT_CATALOG.stream()
                    .map(d -> new AcademicDTOs.SubjectCatalogItem(d.getId(), d.getCode(), d.getName(), d.getCategory()))
                    .collect(Collectors.toList());
        }
        log.info("Subject catalog loaded tenant={} rowCount={}", tenantId, rows.size());
        return rows.stream()
                .map(s -> new AcademicDTOs.SubjectCatalogItem(s.getId(), s.getCode(), s.getName(), s.getCategory()))
                .collect(Collectors.toList());
    }

    // ========== ACADEMIC YEARS ==========
    @Transactional(readOnly = true)
    public List<AcademicYear> getYears() {
        String t = TenantContext.getTenantId();
        log.debug("Listing academic years tenantId={}", t);
        List<AcademicYear> list = yearRepo.findByTenantIdAndIsDeletedFalse(t);
        log.info("Found {} academic year(s) tenantId={}", list.size(), t);
        return list;
    }

    @Transactional
    public AcademicYear createYear(AcademicYear year) {
        log.info("Creating academic year name={} isCurrent={}", year.getName(), year.getIsCurrent());
        year.setTenantId(TenantContext.getTenantId());
        if (year.getIsCurrent() != null && year.getIsCurrent()) {
            // Set all other years as not current
            getYears().forEach(y -> {
                y.setIsCurrent(false);
                yearRepo.save(y);
            });
        }
        AcademicYear saved = yearRepo.save(year);
        log.info("Academic year created id={}", saved.getId());
        return saved;
    }

    @Transactional
    public AcademicYear setCurrentYear(Long yearId) {
        log.info("Setting current academic year id={}", yearId);
        String ctx = TenantContext.getTenantId();
        AcademicYear year;
        String tenantForYears;
        if (TenantQueryPolicy.isPlatformSuperAdmin()) {
            year = yearRepo.findById(yearId).filter(y -> !Boolean.TRUE.equals(y.getIsDeleted())).orElseThrow(() -> new ResourceNotFoundException("AcademicYear", yearId));
            tenantForYears = year.getTenantId();
        } else {
            year = yearRepo.findByIdAndTenantIdAndIsDeletedFalse(yearId, ctx).orElseThrow(() -> new ResourceNotFoundException("AcademicYear", yearId));
            tenantForYears = ctx;
        }
        yearRepo.findByTenantIdAndIsDeletedFalse(tenantForYears).forEach(y -> {
            y.setIsCurrent(false);
            yearRepo.save(y);
        });
        year.setIsCurrent(true);
        return yearRepo.save(year);
    }

    // ========== CLASSES ==========
    @Transactional(readOnly = true)
    public List<AcademicDTOs.ClassWithSectionsResponse> getClassesWithSections() {
        String t = TenantContext.getTenantId();
        log.debug("Listing classes with sections tenantId={}", t);
        List<AcademicDTOs.ClassWithSectionsResponse> list = classRepo.findByTenantIdAndIsDeletedFalseOrderByGrade(t).stream()
                .map(this::toClassWithSectionsResponse)
                .collect(Collectors.toList());
        log.info("Loaded {} class(es) with sections tenantId={}", list.size(), t);
        return list;
    }

    /**
     * Single-class view for UI ({@code GET /academic/classes/{id}}) — same DTO shape as list entries.
     */
    @Transactional(readOnly = true)
    public AcademicDTOs.ClassWithSectionsResponse getClassWithSectionsById(Long classId) {
        String t = TenantContext.getTenantId();
        log.debug("Fetching class by id={} tenantId={}", classId, t);
        SchoolClass cls = classRepo.findByIdAndTenantIdAndIsDeletedFalse(classId, t)
                .orElseThrow(() -> new ResourceNotFoundException("Class", classId));
        log.info("Loaded class id={} name={}", classId, cls.getName());
        return toClassWithSectionsResponse(cls);
    }

    private AcademicDTOs.ClassWithSectionsResponse toClassWithSectionsResponse(SchoolClass cls) {
        String t = TenantContext.getTenantId();
        List<Section> sections = sectionRepo.findByTenantIdAndClassIdAndIsDeletedFalse(t, cls.getId());
        int totalStudents = sections.stream().mapToInt(s -> s.getStudentCount() != null ? s.getStudentCount() : 0).sum();
        return AcademicDTOs.ClassWithSectionsResponse.builder()
                .id(cls.getId())
                .name(cls.getName())
                .grade(cls.getGrade())
                .classTeacherId(cls.getClassTeacherId())
                .classTeacherName(cls.getClassTeacherName())
                .academicYearId(cls.getAcademicYearId())
                .totalStudents(totalStudents)
                .sections(sections.stream()
                        .map(s -> AcademicDTOs.SectionDTO.builder()
                                .id(s.getId())
                                .name(s.getName())
                                .classId(s.getClassId())
                                .capacity(s.getCapacity())
                                .studentCount(s.getStudentCount())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }

    @Transactional
    public SchoolClass createClass(AcademicDTOs.CreateClassRequest req) {
        String t = TenantContext.getTenantId();
        SchoolClass cls = SchoolClass.builder().name(req.getName()).grade(req.getGrade()).classTeacherId(req.getClassTeacherId()).classTeacherName(req.getClassTeacherName()).academicYearId(req.getAcademicYearId()).build();
        cls.setTenantId(t);
        classRepo.save(cls);
        // Create sections
        if (req.getSectionNames() != null) {
            req.getSectionNames().forEach(secName -> {
                Section sec = Section.builder().name(secName).classId(cls.getId()).capacity(req.getSectionCapacity() != null ? req.getSectionCapacity() : 40).studentCount(0).build();
                sec.setTenantId(t);
                sectionRepo.save(sec);
            });
        }
        log.info("Class created: {} with {} sections", cls.getName(), req.getSectionNames() != null ? req.getSectionNames().size() : 0);
        return cls;
    }

    @Transactional
    public Section addSection(Long classId, String sectionName, Integer capacity) {
        String t = TenantContext.getTenantId();
        log.info("Adding section name={} to classId={}", sectionName, classId);
        classRepo.findByIdAndTenantIdAndIsDeletedFalse(classId, t).orElseThrow(() -> new ResourceNotFoundException("Class", classId));
        Section sec = Section.builder().name(sectionName).classId(classId).capacity(capacity != null ? capacity : 40).studentCount(0).build();
        sec.setTenantId(t);
        Section saved = sectionRepo.save(sec);
        log.info("Section created id={} classId={}", saved.getId(), classId);
        return saved;
    }

    @Transactional
    public SchoolClass assignClassTeacher(Long classId, Long teacherId, String teacherName) {
        log.info("Assigning class teacher classId={} teacherId={}", classId, teacherId);
        SchoolClass cls = classRepo.findByIdAndTenantIdAndIsDeletedFalse(classId, TenantContext.getTenantId()).orElseThrow(() -> new ResourceNotFoundException("Class", classId));
        cls.setClassTeacherId(teacherId);
        cls.setClassTeacherName(teacherName);
        SchoolClass saved = classRepo.save(cls);
        if (teacherId != null) {
            teacherAssignmentService.recordClassTeacherAssignment(
                    classId, null, teacherId, cls.getAcademicYearId(), LocalDate.now());
        }
        log.info("Class teacher assigned classId={}", classId);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Section> getSectionsByClass(Long classId) {
        String t = TenantContext.getTenantId();
        log.debug("Listing sections for classId={}", classId);
        List<Section> list = sectionRepo.findByTenantIdAndClassIdAndIsDeletedFalse(t, classId);
        log.info("Found {} section(s) for classId={}", list.size(), classId);
        return list;
    }

    @Transactional(readOnly = true)
    public AcademicWorkflowDTOs.PromotionPreviewResponse previewPromotion(Long fromClassId) {
        String tenantId = TenantContext.getTenantId();
        log.debug("Preview promotion fromClassId={} tenantId={}", fromClassId, tenantId);
        SchoolClass sourceClass = classRepo.findByIdAndTenantIdAndIsDeletedFalse(fromClassId, tenantId).orElseThrow(() -> new ResourceNotFoundException("Class", fromClassId));
        SchoolClass targetClass = classRepo.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId).stream()
                .filter(cls -> cls.getGrade() != null && sourceClass.getGrade() != null && cls.getGrade().equals(sourceClass.getGrade() + 1))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Promotion target class", sourceClass.getGrade() + 1L));
        List<Section> targetSections = sectionRepo.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, targetClass.getId()).stream()
                .sorted(Comparator.comparing(Section::getName))
                .collect(Collectors.toList());
        Section defaultSection = targetSections.isEmpty() ? null : targetSections.get(0);

        List<AcademicWorkflowDTOs.PromotionStudentPreview> students = studentRepo.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, fromClassId).stream()
                .map(student -> {
                    AcademicWorkflowDTOs.PromotionStudentPreview preview = new AcademicWorkflowDTOs.PromotionStudentPreview();
                    double average = markRepo.findByTenantIdAndStudentId(tenantId, student.getId()).stream()
                            .mapToDouble(mark -> mark.getMaxMarks() != null && mark.getMaxMarks() > 0 ? (mark.getMarksObtained() / mark.getMaxMarks()) * 100 : 0)
                            .average()
                            .orElse(0);
                    preview.setStudentId(student.getId());
                    preview.setFirstName(student.getFirstName());
                    preview.setLastName(student.getLastName());
                    preview.setRollNumber(student.getRollNumber());
                    preview.setCurrentClassName(sourceClass.getName());
                    preview.setAverageScore(Math.round(average * 10) / 10.0);
                    preview.setEligible(average == 0 || average >= 40);
                    return preview;
                })
                .collect(Collectors.toList());

        AcademicWorkflowDTOs.PromotionPreviewResponse response = new AcademicWorkflowDTOs.PromotionPreviewResponse();
        response.setSourceClassId(sourceClass.getId());
        response.setSourceClassName(sourceClass.getName());
        response.setTargetClassId(targetClass.getId());
        response.setTargetClassName(targetClass.getName());
        response.setDefaultSectionId(defaultSection != null ? defaultSection.getId() : null);
        response.setDefaultSectionName(defaultSection != null ? defaultSection.getName() : null);
        response.setStudents(students);
        log.info("Promotion preview fromClassId={} targetClassId={} studentCount={}", fromClassId, targetClass.getId(), students.size());
        return response;
    }

    @Transactional
    public AcademicWorkflowDTOs.PromotionResultResponse promoteStudents(AcademicWorkflowDTOs.PromoteStudentsRequest req) {
        String tenantId = TenantContext.getTenantId();
        log.info("Executing promotion sourceClassId={} targetClassId={} studentIdsCount={}",
                req.getSourceClassId(), req.getTargetClassId(), req.getStudentIds() != null ? req.getStudentIds().size() : 0);
        classRepo.findByIdAndTenantIdAndIsDeletedFalse(req.getSourceClassId(), tenantId).orElseThrow(() -> new ResourceNotFoundException("Class", req.getSourceClassId()));
        SchoolClass targetClass = classRepo.findByIdAndTenantIdAndIsDeletedFalse(req.getTargetClassId(), tenantId).orElseThrow(() -> new ResourceNotFoundException("Class", req.getTargetClassId()));
        Section targetSection = null;
        if (req.getTargetSectionId() != null) {
            targetSection = sectionRepo.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, req.getTargetClassId()).stream()
                    .filter(section -> section.getId().equals(req.getTargetSectionId()))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Section", req.getTargetSectionId()));
        } else {
            targetSection = sectionRepo.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, req.getTargetClassId()).stream()
                    .sorted(Comparator.comparing(Section::getName))
                    .findFirst()
                    .orElse(null);
        }

        List<Student> students = studentRepo.findByTenantIdAndIdInAndIsDeletedFalse(tenantId, req.getStudentIds()).stream()
                .filter(student -> req.getSourceClassId().equals(student.getClassId()))
                .collect(Collectors.toList());
        Set<Long> affectedSectionIds = new HashSet<>();
        List<AcademicWorkflowDTOs.PromotedStudentRow> promotedRows = new ArrayList<>();
        for (Student student : students) {
            if (student.getSectionId() != null) {
                affectedSectionIds.add(student.getSectionId());
            }
            student.setClassId(targetClass.getId());
            student.setSectionId(targetSection != null ? targetSection.getId() : null);
            studentRepo.save(student);
            AcademicWorkflowDTOs.PromotedStudentRow row = new AcademicWorkflowDTOs.PromotedStudentRow();
            row.setStudentId(student.getId());
            row.setFullName((student.getFirstName() + " " + student.getLastName()).trim());
            row.setRollNumber(student.getRollNumber());
            promotedRows.add(row);
        }
        if (targetSection != null) {
            affectedSectionIds.add(targetSection.getId());
        }
        refreshSectionCounts(tenantId, affectedSectionIds);

        AcademicWorkflowDTOs.PromotionResultResponse response = new AcademicWorkflowDTOs.PromotionResultResponse();
        response.setPromotedCount(students.size());
        response.setTargetClassName(targetClass.getName());
        response.setTargetSectionName(targetSection != null ? targetSection.getName() : "");
        response.setPromotedStudents(promotedRows);
        log.info("Promotion completed promotedCount={} targetClassId={}", students.size(), targetClass.getId());
        return response;
    }

    private void refreshSectionCounts(String tenantId, Set<Long> sectionIds) {
        if (sectionIds.isEmpty()) {
            return;
        }
        classRepo.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId).forEach(cls ->
                sectionRepo.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, cls.getId()).stream()
                        .filter(section -> sectionIds.contains(section.getId()))
                        .forEach(section -> {
                            int count = studentRepo.findByTenantIdAndClassIdAndSectionIdAndIsDeletedFalse(tenantId, cls.getId(), section.getId()).size();
                            section.setStudentCount(count);
                            sectionRepo.save(section);
                        }));
    }

    public AcademicService(
            final AcademicYearRepository yearRepo,
            final SchoolClassRepository classRepo,
            final SectionRepository sectionRepo,
            final StudentRepository studentRepo,
            final MarkRecordRepository markRepo,
            final TeacherAssignmentService teacherAssignmentService,
            final AcademicSubjectRepository academicSubjectRepo) {
        this.yearRepo = yearRepo;
        this.classRepo = classRepo;
        this.sectionRepo = sectionRepo;
        this.studentRepo = studentRepo;
        this.markRepo = markRepo;
        this.teacherAssignmentService = teacherAssignmentService;
        this.academicSubjectRepo = academicSubjectRepo;
    }
}
