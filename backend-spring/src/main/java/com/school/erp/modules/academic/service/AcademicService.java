package com.school.erp.modules.academic.service;

import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.academic.dto.AcademicDTOs;
import com.school.erp.modules.academic.entity.*;
import com.school.erp.modules.academic.repository.*;
import com.school.erp.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AcademicService {

    private final AcademicYearRepository yearRepo;
    private final SchoolClassRepository classRepo;
    private final SectionRepository sectionRepo;

    // ========== ACADEMIC YEARS ==========
    @Transactional(readOnly = true)
    public List<AcademicYear> getYears() {
        return yearRepo.findByTenantIdAndIsDeletedFalse(TenantContext.getTenantId());
    }

    @Transactional
    public AcademicYear createYear(AcademicYear year) {
        year.setTenantId(TenantContext.getTenantId());
        if (year.getIsCurrent() != null && year.getIsCurrent()) {
            // Set all other years as not current
            getYears().forEach(y -> { y.setIsCurrent(false); yearRepo.save(y); });
        }
        return yearRepo.save(year);
    }

    @Transactional
    public AcademicYear setCurrentYear(Long yearId) {
        String t = TenantContext.getTenantId();
        getYears().forEach(y -> { y.setIsCurrent(false); yearRepo.save(y); });
        AcademicYear year = yearRepo.findById(yearId).orElseThrow(() -> new ResourceNotFoundException("AcademicYear", yearId));
        year.setIsCurrent(true);
        return yearRepo.save(year);
    }

    // ========== CLASSES ==========
    @Transactional(readOnly = true)
    public List<AcademicDTOs.ClassWithSectionsResponse> getClassesWithSections() {
        String t = TenantContext.getTenantId();
        return classRepo.findByTenantIdAndIsDeletedFalseOrderByGrade(t).stream().map(cls -> {
            List<Section> sections = sectionRepo.findByTenantIdAndClassIdAndIsDeletedFalse(t, cls.getId());
            int totalStudents = sections.stream().mapToInt(s -> s.getStudentCount() != null ? s.getStudentCount() : 0).sum();
            return AcademicDTOs.ClassWithSectionsResponse.builder()
                    .id(cls.getId()).name(cls.getName()).grade(cls.getGrade())
                    .classTeacherId(cls.getClassTeacherId()).classTeacherName(cls.getClassTeacherName())
                    .academicYearId(cls.getAcademicYearId()).totalStudents(totalStudents)
                    .sections(sections.stream().map(s -> AcademicDTOs.SectionDTO.builder()
                            .id(s.getId()).name(s.getName()).classId(s.getClassId())
                            .capacity(s.getCapacity()).studentCount(s.getStudentCount()).build()
                    ).collect(Collectors.toList()))
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public SchoolClass createClass(AcademicDTOs.CreateClassRequest req) {
        String t = TenantContext.getTenantId();
        SchoolClass cls = SchoolClass.builder()
                .name(req.getName()).grade(req.getGrade())
                .classTeacherId(req.getClassTeacherId()).classTeacherName(req.getClassTeacherName())
                .academicYearId(req.getAcademicYearId()).build();
        cls.setTenantId(t);
        classRepo.save(cls);

        // Create sections
        if (req.getSectionNames() != null) {
            req.getSectionNames().forEach(secName -> {
                Section sec = Section.builder()
                        .name(secName).classId(cls.getId())
                        .capacity(req.getSectionCapacity() != null ? req.getSectionCapacity() : 40)
                        .studentCount(0).build();
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
        classRepo.findByIdAndTenantIdAndIsDeletedFalse(classId, t)
                .orElseThrow(() -> new ResourceNotFoundException("Class", classId));
        Section sec = Section.builder().name(sectionName).classId(classId)
                .capacity(capacity != null ? capacity : 40).studentCount(0).build();
        sec.setTenantId(t);
        return sectionRepo.save(sec);
    }

    @Transactional
    public SchoolClass assignClassTeacher(Long classId, Long teacherId, String teacherName) {
        SchoolClass cls = classRepo.findByIdAndTenantIdAndIsDeletedFalse(classId, TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Class", classId));
        cls.setClassTeacherId(teacherId);
        cls.setClassTeacherName(teacherName);
        return classRepo.save(cls);
    }

    @Transactional(readOnly = true)
    public List<Section> getSectionsByClass(Long classId) {
        return sectionRepo.findByTenantIdAndClassIdAndIsDeletedFalse(TenantContext.getTenantId(), classId);
    }
}
