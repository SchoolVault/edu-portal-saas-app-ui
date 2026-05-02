package com.school.erp.modules.feesv2.repository;

import com.school.erp.modules.feesv2.entity.StudentFeeStructureMapV2;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentFeeStructureMapV2Repository extends JpaRepository<StudentFeeStructureMapV2, Long> {
    List<StudentFeeStructureMapV2> findByTenantIdAndAcademicYearIdAndStudentIdAndIsDeletedFalseOrderByAssignedAtDesc(
            String tenantId, Long academicYearId, Long studentId);

    List<StudentFeeStructureMapV2> findByTenantIdAndAcademicYearIdAndIsDeletedFalseOrderByStudentIdAscAssignedAtDesc(
            String tenantId, Long academicYearId);

    Optional<StudentFeeStructureMapV2> findFirstByTenantIdAndAcademicYearIdAndStudentIdAndIsDeletedFalseOrderByAssignedAtDesc(
            String tenantId, Long academicYearId, Long studentId);
}
