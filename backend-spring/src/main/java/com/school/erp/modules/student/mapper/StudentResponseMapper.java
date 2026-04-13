package com.school.erp.modules.student.mapper;

import com.school.erp.modules.academic.entity.SchoolClass;
import com.school.erp.modules.academic.entity.Section;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
import com.school.erp.modules.academic.repository.SectionRepository;
import com.school.erp.modules.student.dto.StudentDTOs;
import com.school.erp.modules.student.entity.Student;

import java.util.HashMap;
import java.util.Map;

/**
 * Entity → API response mapping (keeps {@link com.school.erp.modules.student.service.StudentService} thin).
 */
public final class StudentResponseMapper {

    private StudentResponseMapper() {
    }

    public static StudentDTOs.Response toResponse(
            Student s,
            String tenantId,
            SchoolClassRepository schoolClassRepository,
            SectionRepository sectionRepository) {
        return toResponse(s, tenantId, schoolClassRepository, sectionRepository, new HashMap<>(), new HashMap<>());
    }

    public static StudentDTOs.Response toResponse(
            Student s,
            String tenantId,
            SchoolClassRepository schoolClassRepository,
            SectionRepository sectionRepository,
            Map<Long, String> classNameCache,
            Map<Long, String> sectionNameCache) {
        String className = null;
        String sectionName = null;
        if (s.getClassId() != null) {
            className = classNameCache.computeIfAbsent(s.getClassId(), id -> schoolClassRepository
                    .findByIdAndTenantIdAndIsDeletedFalse(id, tenantId)
                    .map(SchoolClass::getName)
                    .orElse(null));
        }
        if (s.getSectionId() != null) {
            sectionName = sectionNameCache.computeIfAbsent(s.getSectionId(), id -> sectionRepository
                    .findByIdAndTenantIdAndIsDeletedFalse(id, tenantId)
                    .map(Section::getName)
                    .orElse(null));
        }
        return StudentDTOs.Response.builder()
                .id(s.getId())
                .firstName(s.getFirstName())
                .lastName(s.getLastName())
                .email(s.getEmail())
                .phone(s.getPhone())
                .dateOfBirth(s.getDateOfBirth())
                .gender(s.getGender() != null ? s.getGender().name().toLowerCase() : null)
                .classId(s.getClassId())
                .className(className)
                .sectionId(s.getSectionId())
                .sectionName(sectionName)
                .rollNumber(s.getRollNumber())
                .admissionNumber(s.getAdmissionNumber())
                .admissionDate(s.getAdmissionDate())
                .parentId(s.getParentId())
                .parentName(s.getParentName())
                .address(s.getAddress())
                .bloodGroup(s.getBloodGroup())
                .avatar(s.getAvatar())
                .status(s.getStatus() != null ? s.getStatus().name().toLowerCase() : "active")
                .tenantId(s.getTenantId())
                .build();
    }
}
