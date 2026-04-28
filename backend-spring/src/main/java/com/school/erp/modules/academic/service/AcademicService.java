package com.school.erp.modules.academic.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.academic.dto.AcademicDTOs;
import com.school.erp.modules.academic.dto.AcademicMutationRequests;
import com.school.erp.modules.academic.dto.AcademicWorkflowDTOs;
import com.school.erp.modules.academic.entity.*;
import com.school.erp.modules.exams.repository.MarkRecordRepository;
import com.school.erp.modules.academic.repository.*;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.modules.teacher.entity.Teacher;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.modules.reports.service.DashboardSnapshotInvalidationService;
import com.school.erp.cache.CacheService;
import com.school.erp.cache.CacheService.CacheRegion;
import com.school.erp.config.CacheConfig;
import com.school.erp.tenant.TenantContext;
import com.school.erp.tenant.TenantQueryPolicy;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.cache.annotation.Cacheable;
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
    private final TeacherRepository teacherRepository;
    private final CurrentAcademicYearResolver currentAcademicYearResolver;
    private final ObjectProvider<CacheService> cacheService;
    private final DashboardSnapshotInvalidationService dashboardSnapshotInvalidationService;

    // ========== SUBJECT CATALOG ==========
    @Cacheable(cacheNames = CacheConfig.ACADEMIC_CATALOG, keyGenerator = "tenantMethodNameKeyGenerator", unless = "#result == null")
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
    @Cacheable(cacheNames = CacheConfig.ACADEMIC_CATALOG, keyGenerator = "tenantMethodNameKeyGenerator", unless = "#result == null")
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
        currentAcademicYearResolver.evictTenant(TenantContext.getTenantId());
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
        AcademicYear saved = yearRepo.save(year);
        currentAcademicYearResolver.evictTenant(tenantForYears);
        return saved;
    }

    // ========== CLASSES ==========
    @Cacheable(cacheNames = CacheConfig.ACADEMIC_CATALOG, keyGenerator = "tenantMethodNameKeyGenerator", unless = "#result == null")
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
    @Cacheable(cacheNames = CacheConfig.ACADEMIC_CATALOG, keyGenerator = "tenantMethodFirstParamKeyGenerator", unless = "#result == null")
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
        java.util.Map<Long, Integer> sectionStudentCounts = resolveActiveSectionStudentCounts(t, cls.getId(), sections);
        int totalStudents = sections.isEmpty()
                ? (int) studentRepo.countByTenantIdAndClassIdAndIsDeletedFalseAndStatus(
                        t, cls.getId(), Enums.StudentStatus.ACTIVE)
                : sectionStudentCounts.values().stream().mapToInt(Integer::intValue).sum();
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
                                .studentCount(sectionStudentCounts.getOrDefault(s.getId(), 0))
                                .classTeacherId(s.getClassTeacherId())
                                .classTeacherName(s.getClassTeacherName())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }

    private java.util.Map<Long, Integer> resolveActiveSectionStudentCounts(String tenantId, Long classId, List<Section> sections) {
        java.util.Map<Long, Integer> counts = new java.util.HashMap<>();
        if (sections.isEmpty()) {
            return counts;
        }
        List<Long> sectionIds = sections.stream().map(Section::getId).collect(Collectors.toList());
        for (Object[] row : studentRepo.countActiveBySectionIds(tenantId, classId, sectionIds, Enums.StudentStatus.ACTIVE)) {
            if (row == null || row.length < 2 || row[0] == null) {
                continue;
            }
            Long sectionId = (Long) row[0];
            Number total = (Number) row[1];
            counts.put(sectionId, total != null ? total.intValue() : 0);
        }
        for (Section section : sections) {
            counts.putIfAbsent(section.getId(), 0);
        }
        return counts;
    }

    @Transactional
    public SchoolClass createClass(AcademicDTOs.CreateClassRequest req) {
        String t = TenantContext.getTenantId();
        String normalizedName = normalizeAndValidateClassName(req.getName());
        ensureClassNameUniqueForAcademicYear(t, req.getAcademicYearId(), normalizedName, null);
        Integer resolvedGrade = resolveGrade(req.getGrade(), req.getName());
        List<String> names = req.getSectionNames() != null
                ? req.getSectionNames().stream().map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toList())
                : List.of();
        ensureDistinctSectionNames(names);
        int normalizedCapacity = normalizeAndValidateSectionCapacity(req.getSectionCapacity());
        boolean hasSections = !names.isEmpty();
        boolean multiSection = names.size() > 1;
        Long initialClassTeacher = (!hasSections) ? req.getClassTeacherId() : null;
        String initialClassTeacherName = (!hasSections) ? req.getClassTeacherName() : null;

        SchoolClass cls = SchoolClass.builder()
                .name(normalizedName)
                .grade(resolvedGrade)
                .classTeacherId(initialClassTeacher)
                .classTeacherName(initialClassTeacherName)
                .academicYearId(req.getAcademicYearId())
                .build();
        cls.setTenantId(t);
        classRepo.save(cls);
        for (String secName : names) {
            Section sec = Section.builder()
                    .name(secName)
                    .classId(cls.getId())
                    .capacity(normalizedCapacity)
                    .studentCount(0)
                    .build();
            sec.setTenantId(t);
            sectionRepo.save(sec);
        }
        log.info("Class created: {} with {} sections", cls.getName(), names.size());

        if (!hasSections && req.getClassTeacherId() != null) {
            Teacher teach = teacherRepository.findByIdAndTenantIdAndIsDeletedFalse(req.getClassTeacherId(), t)
                    .orElseThrow(() -> new ResourceNotFoundException("Teacher", req.getClassTeacherId()));
            if (teach.getStatus() != null && teach.getStatus() != Enums.TeacherStatus.ACTIVE) {
                throw new BusinessException("Only active teachers can be assigned as class teacher.");
            }
            releaseHomeroomTeacherEverywhereExcept(req.getClassTeacherId(), cls.getId(), null, t);
            String resolved = req.getClassTeacherName() != null && !req.getClassTeacherName().isBlank()
                    ? req.getClassTeacherName().trim()
                    : (teach.getFirstName() + " " + teach.getLastName()).trim();
            cls.setClassTeacherName(resolved);
            classRepo.save(cls);
            teacherAssignmentService.recordClassTeacherAssignment(
                    cls.getId(), null, req.getClassTeacherId(), cls.getAcademicYearId(), LocalDate.now());
        } else if (hasSections && names.size() == 1 && req.getClassTeacherId() != null) {
            Teacher teach = teacherRepository.findByIdAndTenantIdAndIsDeletedFalse(req.getClassTeacherId(), t)
                    .orElseThrow(() -> new ResourceNotFoundException("Teacher", req.getClassTeacherId()));
            if (teach.getStatus() != null && teach.getStatus() != Enums.TeacherStatus.ACTIVE) {
                throw new BusinessException("Only active teachers can be assigned as class teacher.");
            }
            Section sec = sectionRepo.findByTenantIdAndClassIdAndIsDeletedFalse(t, cls.getId()).stream()
                    .findFirst()
                    .orElseThrow(() -> new BusinessException("Could not load section row after class create."));
            releaseHomeroomTeacherEverywhereExcept(req.getClassTeacherId(), cls.getId(), sec.getId(), t);
            String resolved = req.getClassTeacherName() != null && !req.getClassTeacherName().isBlank()
                    ? req.getClassTeacherName().trim()
                    : (teach.getFirstName() + " " + teach.getLastName()).trim();
            sec.setClassTeacherId(req.getClassTeacherId());
            sec.setClassTeacherName(resolved);
            sectionRepo.save(sec);
            cls.setClassTeacherId(null);
            cls.setClassTeacherName(null);
            classRepo.save(cls);
            teacherAssignmentService.recordClassTeacherAssignment(
                    cls.getId(), sec.getId(), req.getClassTeacherId(), cls.getAcademicYearId(), LocalDate.now());
        } else if (multiSection && req.getClassTeacherId() != null) {
            log.info("Ignoring optional class teacher on create for multi-section class id={}; assign per section in Academic UI.", cls.getId());
        }
        evictAcademicClassCaches(cls.getId(), true);
        return cls;
    }

    /**
     * Clears this teacher from every homeroom slot except the kept class/section (one homeroom per teacher).
     * Whole-class keep uses {@code keepSectionId == null}; section keep uses both ids.
     */
    private void releaseHomeroomTeacherEverywhereExcept(Long teacherId, Long keepClassId, Long keepSectionId, String tenantId) {
        LocalDate end = LocalDate.now().minusDays(1);
        for (SchoolClass other : classRepo.findByTenantIdAndClassTeacherIdAndIsDeletedFalse(tenantId, teacherId)) {
            boolean keep = keepSectionId == null && keepClassId != null && keepClassId.equals(other.getId());
            if (keep) {
                continue;
            }
            other.setClassTeacherId(null);
            other.setClassTeacherName(null);
            classRepo.save(other);
            teacherAssignmentService.closeActiveHomeroomSlotAssignments(tenantId, other.getId(), null, end);
            log.info("Cleared whole-class homeroom teacher from classId={}", other.getId());
            evictAcademicClassCaches(other.getId(), false);
        }
        for (Section sec : sectionRepo.findByTenantIdAndClassTeacherIdAndIsDeletedFalse(tenantId, teacherId)) {
            boolean keep = keepClassId != null
                    && keepClassId.equals(sec.getClassId())
                    && keepSectionId != null
                    && keepSectionId.equals(sec.getId());
            if (keep) {
                continue;
            }
            sec.setClassTeacherId(null);
            sec.setClassTeacherName(null);
            sectionRepo.save(sec);
            teacherAssignmentService.closeActiveHomeroomSlotAssignments(tenantId, sec.getClassId(), sec.getId(), end);
            log.info("Cleared section homeroom teacher from sectionId={} classId={}", sec.getId(), sec.getClassId());
            evictAcademicClassCaches(sec.getClassId(), false);
        }
    }

    @Transactional
    public Section addSection(Long classId, String sectionName, Integer capacity) {
        String t = TenantContext.getTenantId();
        String normalizedName = normalizeAndValidateSectionName(sectionName);
        int normalizedCapacity = normalizeAndValidateSectionCapacity(capacity);
        log.info("Adding section name={} to classId={}", normalizedName, classId);
        SchoolClass cls = classRepo.findByIdAndTenantIdAndIsDeletedFalse(classId, t).orElseThrow(() -> new ResourceNotFoundException("Class", classId));
        List<Section> existing = sectionRepo.findByTenantIdAndClassIdAndIsDeletedFalse(t, classId);
        ensureSectionNameUniqueWithinClass(existing, normalizedName, null);
        Section sec = Section.builder().name(normalizedName).classId(classId).capacity(normalizedCapacity).studentCount(0).build();
        sec.setTenantId(t);
        if (existing.isEmpty() && cls.getClassTeacherId() != null) {
            sec.setClassTeacherId(cls.getClassTeacherId());
            sec.setClassTeacherName(cls.getClassTeacherName());
            cls.setClassTeacherId(null);
            cls.setClassTeacherName(null);
            classRepo.save(cls);
            teacherAssignmentService.closeActiveHomeroomSlotAssignments(t, classId, null, LocalDate.now().minusDays(1));
            sectionRepo.save(sec);
            teacherAssignmentService.recordClassTeacherAssignment(
                    classId, sec.getId(), sec.getClassTeacherId(), cls.getAcademicYearId(), LocalDate.now());
            log.info("Moved whole-class homeroom to first section id={} classId={}", sec.getId(), classId);
        } else {
            sectionRepo.save(sec);
        }
        log.info("Section created id={} classId={}", sec.getId(), classId);
        evictAcademicClassCaches(classId, true);
        return sec;
    }

    @Transactional
    public AcademicDTOs.ClassWithSectionsResponse assignClassTeacher(Long classId, Long sectionId, Long teacherId, String teacherName) {
        String tenantId = TenantContext.getTenantId();
        log.info("Assigning homeroom classId={} sectionId={} teacherId={}", classId, sectionId, teacherId);
        SchoolClass cls = classRepo.findByIdAndTenantIdAndIsDeletedFalse(classId, tenantId).orElseThrow(() -> new ResourceNotFoundException("Class", classId));
        List<Section> sections = sectionRepo.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, classId);
        if (sections.isEmpty()) {
            if (sectionId != null) {
                throw new BusinessException("This class has no sections; do not send sectionId when assigning whole-class homeroom teacher.");
            }
        } else {
            if (sectionId == null) {
                throw new BusinessException("This class is divided into sections; choose a section for each homeroom teacher assignment.");
            }
            sectionRepo.findByIdAndTenantIdAndIsDeletedFalse(sectionId, tenantId)
                    .filter(s -> classId.equals(s.getClassId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Section", sectionId));
        }

        if (teacherId == null) {
            teacherAssignmentService.closeActiveHomeroomSlotAssignments(
                    tenantId, classId, sections.isEmpty() ? null : sectionId, LocalDate.now().minusDays(1));
            cls.setClassTeacherId(null);
            cls.setClassTeacherName(null);
            classRepo.save(cls);
            if (!sections.isEmpty()) {
                Section sec = sectionRepo.findByIdAndTenantIdAndIsDeletedFalse(sectionId, tenantId).orElseThrow();
                sec.setClassTeacherId(null);
                sec.setClassTeacherName(null);
                sectionRepo.save(sec);
            }
        } else {
            Teacher teach = teacherRepository.findByIdAndTenantIdAndIsDeletedFalse(teacherId, tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Teacher", teacherId));
            if (teach.getStatus() != null && teach.getStatus() != Enums.TeacherStatus.ACTIVE) {
                throw new BusinessException("Only active teachers can be assigned as class teacher.");
            }
            releaseHomeroomTeacherEverywhereExcept(teacherId, classId, sections.isEmpty() ? null : sectionId, tenantId);
            String resolved = teacherName != null && !teacherName.isBlank()
                    ? teacherName.trim()
                    : (teach.getFirstName() + " " + teach.getLastName()).trim();
            cls.setClassTeacherId(null);
            cls.setClassTeacherName(null);
            classRepo.save(cls);
            if (sections.isEmpty()) {
                cls.setClassTeacherId(teacherId);
                cls.setClassTeacherName(resolved);
                classRepo.save(cls);
            } else {
                Section sec = sectionRepo.findByIdAndTenantIdAndIsDeletedFalse(sectionId, tenantId).orElseThrow();
                sec.setClassTeacherId(teacherId);
                sec.setClassTeacherName(resolved);
                sectionRepo.save(sec);
            }
            teacherAssignmentService.recordClassTeacherAssignment(
                    classId, sections.isEmpty() ? null : sectionId, teacherId, cls.getAcademicYearId(), LocalDate.now());
        }
        log.info("Homeroom updated classId={}", classId);
        evictAcademicClassCaches(classId, true);
        evictTeacherDirectoryCacheAfterHomeroomChange();
        dashboardSnapshotInvalidationService.invalidateCurrentTenant("homeroom_assignment_changed");
        return getClassWithSectionsById(classId);
    }

    @Cacheable(cacheNames = CacheConfig.ACADEMIC_CATALOG, keyGenerator = "tenantMethodFirstParamKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public List<Section> getSectionsByClass(Long classId) {
        String t = TenantContext.getTenantId();
        log.debug("Listing sections for classId={}", classId);
        List<Section> list = sectionRepo.findByTenantIdAndClassIdAndIsDeletedFalse(t, classId);
        log.info("Found {} section(s) for classId={}", list.size(), classId);
        return list;
    }

    @Transactional
    public AcademicDTOs.ClassWithSectionsResponse updateClass(Long classId, AcademicMutationRequests.UpdateSchoolClassRequest req) {
        String t = TenantContext.getTenantId();
        SchoolClass cls = classRepo.findByIdAndTenantIdAndIsDeletedFalse(classId, t).orElseThrow(() -> new ResourceNotFoundException("Class", classId));
        String normalizedName = normalizeAndValidateClassName(req.getName());
        ensureClassNameUniqueForAcademicYear(t, cls.getAcademicYearId(), normalizedName, classId);
        cls.setName(normalizedName);
        cls.setGrade(resolveGrade(req.getGrade(), normalizedName));
        classRepo.save(cls);
        log.info("Class updated id={} name={}", classId, normalizedName);
        evictAcademicClassCaches(classId, true);
        return getClassWithSectionsById(classId);
    }

    private Integer resolveGrade(Integer suppliedGrade, String className) {
        if (suppliedGrade != null) {
            return suppliedGrade;
        }
        if (className == null) {
            throw new BusinessException("Class name is required.");
        }
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("(\\d{1,2})").matcher(className);
        if (!matcher.find()) {
            throw new BusinessException("Could not infer grade from class name. Include a numeric grade in class name (e.g., Class 6).");
        }
        int inferred = Integer.parseInt(matcher.group(1));
        if (inferred < 1 || inferred > 12) {
            throw new BusinessException("Inferred grade from class name must be between 1 and 12.");
        }
        return inferred;
    }

    @Transactional
    public Section updateSection(Long sectionId, AcademicMutationRequests.UpdateSectionRequest req) {
        String t = TenantContext.getTenantId();
        Section sec = sectionRepo.findByIdAndTenantIdAndIsDeletedFalse(sectionId, t).orElseThrow(() -> new ResourceNotFoundException("Section", sectionId));
        String normalizedName = normalizeAndValidateSectionName(req.getName());
        int normalizedCapacity = normalizeAndValidateSectionCapacity(req.getCapacity());
        List<Section> existing = sectionRepo.findByTenantIdAndClassIdAndIsDeletedFalse(t, sec.getClassId());
        ensureSectionNameUniqueWithinClass(existing, normalizedName, sectionId);
        sec.setName(normalizedName);
        sec.setCapacity(normalizedCapacity);
        Section saved = sectionRepo.save(sec);
        log.info("Section updated id={}", sectionId);
        evictAcademicClassCaches(saved.getClassId(), true);
        return saved;
    }

    private String normalizeAndValidateClassName(String className) {
        String normalized = className != null ? className.trim() : "";
        if (normalized.isEmpty()) {
            throw new BusinessException("Class name is required.");
        }
        return normalized;
    }

    private String normalizeAndValidateSectionName(String sectionName) {
        String normalized = sectionName != null ? sectionName.trim() : "";
        if (normalized.isEmpty()) {
            throw new BusinessException("Section name is required.");
        }
        return normalized;
    }

    private int normalizeAndValidateSectionCapacity(Integer capacity) {
        int normalized = capacity != null ? capacity : 40;
        if (normalized < 1 || normalized > 200) {
            throw new BusinessException("Section capacity must be between 1 and 200.");
        }
        return normalized;
    }

    private void ensureDistinctSectionNames(List<String> sectionNames) {
        Set<String> seen = new HashSet<>();
        for (String name : sectionNames) {
            String normalized = name.trim().toLowerCase();
            if (!seen.add(normalized)) {
                throw new BusinessException("Section names must be unique within a class.");
            }
        }
    }

    private void ensureClassNameUniqueForAcademicYear(String tenantId, Long academicYearId, String className, Long ignoreClassId) {
        String normalized = className.trim().toLowerCase();
        boolean duplicate = classRepo.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId).stream()
                .anyMatch(c -> c.getAcademicYearId() != null
                        && c.getAcademicYearId().equals(academicYearId)
                        && (ignoreClassId == null || !c.getId().equals(ignoreClassId))
                        && c.getName() != null
                        && c.getName().trim().toLowerCase().equals(normalized));
        if (duplicate) {
            throw new BusinessException("Class name must be unique within the selected academic year.");
        }
    }

    private void ensureSectionNameUniqueWithinClass(List<Section> existing, String sectionName, Long ignoreSectionId) {
        String normalized = sectionName.trim().toLowerCase();
        boolean duplicate = existing.stream().anyMatch(s -> (ignoreSectionId == null || !s.getId().equals(ignoreSectionId))
                && s.getName() != null
                && s.getName().trim().toLowerCase().equals(normalized));
        if (duplicate) {
            throw new BusinessException("Section name must be unique within this class.");
        }
    }

    @Transactional
    public void deleteSection(Long sectionId) {
        String t = TenantContext.getTenantId();
        Section sec = sectionRepo.findByIdAndTenantIdAndIsDeletedFalse(sectionId, t).orElseThrow(() -> new ResourceNotFoundException("Section", sectionId));
        int enrolled = (int) studentRepo.countByTenantIdAndClassIdAndSectionIdAndIsDeletedFalseAndStatus(
                t, sec.getClassId(), sec.getId(), Enums.StudentStatus.ACTIVE);
        if (enrolled > 0) {
            throw new BusinessException("Cannot delete a section that still has students. Reassign students first.");
        }
        Long classId = sec.getClassId();
        teacherAssignmentService.closeActiveHomeroomSlotAssignments(t, classId, sectionId, LocalDate.now().minusDays(1));
        sec.setIsDeleted(true);
        sectionRepo.save(sec);
        log.info("Section soft-deleted id={}", sectionId);
        evictAcademicClassCaches(classId, true);
    }

    @Transactional
    public void deleteClass(Long classId) {
        String tenantId = TenantContext.getTenantId();
        SchoolClass cls = classRepo.findByIdAndTenantIdAndIsDeletedFalse(classId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Class", classId));
        List<Section> activeSections = sectionRepo.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, classId);
        if (!activeSections.isEmpty()) {
            throw new BusinessException("Cannot delete class while active sections exist. Delete or inactivate all sections first.");
        }
        int enrolled = (int) studentRepo.countByTenantIdAndClassIdAndIsDeletedFalseAndStatus(
                tenantId, classId, Enums.StudentStatus.ACTIVE);
        if (enrolled > 0) {
            throw new BusinessException("Cannot delete class that still has active students. Move or inactivate students first.");
        }
        teacherAssignmentService.closeActiveHomeroomSlotAssignments(
                tenantId, classId, null, LocalDate.now().minusDays(1));
        cls.setClassTeacherId(null);
        cls.setClassTeacherName(null);
        cls.setIsDeleted(true);
        classRepo.save(cls);
        log.info("Class soft-deleted id={}", classId);
        evictAcademicClassCaches(classId, true);
        evictTeacherDirectoryCacheAfterHomeroomChange();
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
                .filter(student -> student.getStatus() == Enums.StudentStatus.ACTIVE)
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
        response.setTargetSections(targetSections.stream().map(sec -> {
            AcademicWorkflowDTOs.PromotionTargetSectionOption o = new AcademicWorkflowDTOs.PromotionTargetSectionOption();
            o.setId(sec.getId());
            o.setName(sec.getName());
            o.setCapacity(sec.getCapacity());
            return o;
        }).collect(Collectors.toList()));
        response.setStudents(students);
        long sourceSecCount = sectionRepo.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, fromClassId).size();
        if (targetSections.isEmpty()) {
            response.setSectionPlacementNote("Target class has no sections; students can be promoted with section unassigned until you add sections and redistribute.");
        } else if (targetSections.size() < sourceSecCount) {
            response.setSectionPlacementNote("Target has fewer sections than source; pick a target section per batch or open split preview for suggested counts.");
        }
        log.info("Promotion preview fromClassId={} targetClassId={} studentCount={}", fromClassId, targetClass.getId(), students.size());
        return response;
    }

    @Transactional(readOnly = true)
    public AcademicWorkflowDTOs.PromotionSplitPreviewResponse promotionSplitPreview(Long fromClassId, Long toClassId) {
        String tenantId = TenantContext.getTenantId();
        classRepo.findByIdAndTenantIdAndIsDeletedFalse(fromClassId, tenantId).orElseThrow(() -> new ResourceNotFoundException("Class", fromClassId));
        classRepo.findByIdAndTenantIdAndIsDeletedFalse(toClassId, tenantId).orElseThrow(() -> new ResourceNotFoundException("Class", toClassId));
        int elig = (int) studentRepo.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, fromClassId).stream()
                .filter(s -> s.getStatus() == Enums.StudentStatus.ACTIVE)
                .count();
        List<Section> targetSecs = sectionRepo.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, toClassId).stream()
                .sorted(Comparator.comparing(Section::getName))
                .collect(Collectors.toList());
        AcademicWorkflowDTOs.PromotionSplitPreviewResponse out = new AcademicWorkflowDTOs.PromotionSplitPreviewResponse();
        out.setFromClassId(fromClassId);
        out.setToClassId(toClassId);
        out.setEligibleStudentCount(elig);
        if (targetSecs.isEmpty()) {
            out.setHint("Create sections on the target class before using split suggestions.");
            return out;
        }
        List<Section> ordered = new ArrayList<>(targetSecs);
        ordered.sort(Comparator.comparingInt(s -> -(s.getCapacity() != null ? s.getCapacity() : 0)));
        int m = ordered.size();
        int[] counts = new int[m];
        for (int i = 0; i < elig; i++) {
            counts[i % m]++;
        }
        List<AcademicWorkflowDTOs.PromotionSplitSectionRow> rows = new ArrayList<>();
        for (int i = 0; i < m; i++) {
            Section s = ordered.get(i);
            AcademicWorkflowDTOs.PromotionSplitSectionRow row = new AcademicWorkflowDTOs.PromotionSplitSectionRow();
            row.setSectionId(s.getId());
            row.setSectionName(s.getName());
            row.setCapacity(s.getCapacity());
            row.setSuggestedAssignCount(counts[i]);
            rows.add(row);
        }
        out.setSections(rows);
        out.setHint("Suggested counts are heuristic (round-robin); execute promotions per section from the main promotion UI.");
        return out;
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
                .filter(student -> student.getStatus() == Enums.StudentStatus.ACTIVE)
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
        evictAcademicClassCaches(req.getSourceClassId(), true);
        evictAcademicClassCaches(targetClass.getId(), true);

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
                            int count = (int) studentRepo.countByTenantIdAndClassIdAndSectionIdAndIsDeletedFalseAndStatus(
                                    tenantId, cls.getId(), section.getId(), Enums.StudentStatus.ACTIVE);
                            section.setStudentCount(count);
                            sectionRepo.save(section);
                        }));
    }

    /**
     * Evicts class/section list caches (keys must match {@code tenantMethodNameKeyGenerator} /
     * {@code tenantMethodFirstParamKeyGenerator}).
     */
    private void evictAcademicClassCaches(Long classId, boolean evictFullClassList) {
        cacheService.ifAvailable(cs -> {
            String tid = TenantContext.getTenantId();
            if (tid == null || tid.isBlank()) {
                tid = "_no_tenant_";
            }
            if (evictFullClassList) {
                cs.evict(CacheRegion.ACADEMIC_CATALOG, tid + ":getClassesWithSections");
            }
            if (classId != null) {
                cs.evict(CacheRegion.ACADEMIC_CATALOG, tid + ":getClassWithSectionsById:" + classId);
                cs.evict(CacheRegion.ACADEMIC_CATALOG, tid + ":getSectionsByClass:" + classId);
            }
        });
    }

    /** Homeroom labels on teacher list/detail come from cached {@code TeacherService#getTeachers}; invalidate after CT changes. */
    private void evictTeacherDirectoryCacheAfterHomeroomChange() {
        cacheService.ifAvailable(cs -> cs.clearRegion(CacheRegion.TEACHER_DIRECTORY));
    }

    public AcademicService(
            final AcademicYearRepository yearRepo,
            final SchoolClassRepository classRepo,
            final SectionRepository sectionRepo,
            final StudentRepository studentRepo,
            final MarkRecordRepository markRepo,
            final TeacherAssignmentService teacherAssignmentService,
            final AcademicSubjectRepository academicSubjectRepo,
            final TeacherRepository teacherRepository,
            final CurrentAcademicYearResolver currentAcademicYearResolver,
            ObjectProvider<CacheService> cacheService,
            final DashboardSnapshotInvalidationService dashboardSnapshotInvalidationService) {
        this.yearRepo = yearRepo;
        this.classRepo = classRepo;
        this.sectionRepo = sectionRepo;
        this.studentRepo = studentRepo;
        this.markRepo = markRepo;
        this.teacherAssignmentService = teacherAssignmentService;
        this.academicSubjectRepo = academicSubjectRepo;
        this.teacherRepository = teacherRepository;
        this.currentAcademicYearResolver = currentAcademicYearResolver;
        this.cacheService = cacheService;
        this.dashboardSnapshotInvalidationService = dashboardSnapshotInvalidationService;
    }
}
