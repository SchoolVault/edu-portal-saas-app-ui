package com.school.erp.modules.feesv2.repository;

import com.school.erp.modules.feesv2.entity.StudentDiscountV2;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentDiscountV2Repository extends JpaRepository<StudentDiscountV2, Long> {
    List<StudentDiscountV2> findByTenantIdAndAcademicYearIdAndStudentIdAndIsDeletedFalseOrderByValidFromDesc(
            String tenantId, Long academicYearId, Long studentId);

    Optional<StudentDiscountV2> findByIdAndTenantIdAndAcademicYearIdAndIsDeletedFalse(
            Long id, String tenantId, Long academicYearId);
}
