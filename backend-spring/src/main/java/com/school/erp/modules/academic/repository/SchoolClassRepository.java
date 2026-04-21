package com.school.erp.modules.academic.repository;

import com.school.erp.modules.academic.entity.SchoolClass;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List; import java.util.Optional;

public interface SchoolClassRepository extends JpaRepository<SchoolClass, Long> {
    List<SchoolClass> findByTenantIdAndIsDeletedFalseOrderByGrade(String tenantId);
    Optional<SchoolClass> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
    List<SchoolClass> findByTenantIdAndClassTeacherIdAndIsDeletedFalse(String tenantId, Long classTeacherId);

    Optional<SchoolClass> findFirstByTenantIdAndAcademicYearIdAndNameIgnoreCaseAndIsDeletedFalse(
            String tenantId, Long academicYearId, String name);
}
