package com.school.erp.modules.student.service;

import com.school.erp.modules.academic.entity.SchoolClass;
import com.school.erp.modules.academic.entity.Section;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
import com.school.erp.modules.academic.repository.SectionRepository;
import com.school.erp.modules.student.entity.Student;
import org.springframework.stereotype.Service;

/**
 * Single place to resolve {@link Student} transient class/section display labels from master data.
 * Used by parent and other read paths so admin/parent UIs stay aligned on the same names.
 */
@Service
public class StudentEnrolmentDisplayService {

    private final SchoolClassRepository schoolClassRepository;
    private final SectionRepository sectionRepository;

    public StudentEnrolmentDisplayService(
            SchoolClassRepository schoolClassRepository,
            SectionRepository sectionRepository) {
        this.schoolClassRepository = schoolClassRepository;
        this.sectionRepository = sectionRepository;
    }

    public void enrichClassSectionDisplay(String tenantId, Iterable<Student> students) {
        if (students == null) {
            return;
        }
        for (Student s : students) {
            if (s == null || s.getClassId() == null) {
                continue;
            }
            if (blank(s.getClassName())) {
                schoolClassRepository.findByIdAndTenantIdAndIsDeletedFalse(s.getClassId(), tenantId)
                        .map(SchoolClass::getName)
                        .ifPresent(s::setClassName);
            }
            Long secId = s.getSectionId();
            if (secId != null && secId > 0 && blank(s.getSectionName())) {
                sectionRepository.findByIdAndTenantIdAndIsDeletedFalse(secId, tenantId)
                        .map(Section::getName)
                        .ifPresent(s::setSectionName);
            }
        }
    }

    private static boolean blank(String v) {
        return v == null || v.isBlank();
    }
}
