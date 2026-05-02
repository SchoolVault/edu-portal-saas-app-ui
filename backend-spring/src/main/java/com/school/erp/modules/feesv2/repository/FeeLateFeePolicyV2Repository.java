package com.school.erp.modules.feesv2.repository;

import com.school.erp.modules.feesv2.entity.FeeLateFeePolicyV2;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeeLateFeePolicyV2Repository extends JpaRepository<FeeLateFeePolicyV2, Long> {
    List<FeeLateFeePolicyV2> findByTenantIdAndAcademicYearIdAndIsDeletedFalseOrderByPolicyCodeAsc(
            String tenantId, Long academicYearId);

    Optional<FeeLateFeePolicyV2> findByIdAndTenantIdAndAcademicYearIdAndIsDeletedFalse(
            Long id, String tenantId, Long academicYearId);

    Optional<FeeLateFeePolicyV2> findByTenantIdAndAcademicYearIdAndPolicyCodeAndIsDeletedFalse(
            String tenantId, Long academicYearId, String policyCode);
}
