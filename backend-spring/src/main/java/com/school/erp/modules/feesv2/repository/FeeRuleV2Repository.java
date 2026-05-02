package com.school.erp.modules.feesv2.repository;

import com.school.erp.modules.feesv2.entity.FeeRuleV2;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeeRuleV2Repository extends JpaRepository<FeeRuleV2, Long> {
    List<FeeRuleV2> findByTenantIdAndAcademicYearIdAndIsDeletedFalseOrderByPriorityNoAscIdAsc(String tenantId, Long academicYearId);
    java.util.Optional<FeeRuleV2> findByIdAndTenantIdAndAcademicYearIdAndIsDeletedFalse(Long id, String tenantId, Long academicYearId);
}
