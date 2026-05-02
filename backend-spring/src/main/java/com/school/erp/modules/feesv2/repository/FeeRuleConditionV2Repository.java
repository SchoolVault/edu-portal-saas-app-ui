package com.school.erp.modules.feesv2.repository;

import com.school.erp.modules.feesv2.entity.FeeRuleConditionV2;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeeRuleConditionV2Repository extends JpaRepository<FeeRuleConditionV2, Long> {
    List<FeeRuleConditionV2> findByTenantIdAndAcademicYearIdAndFeeRuleIdAndIsDeletedFalseOrderByConditionOrderAsc(
            String tenantId, Long academicYearId, Long feeRuleId);
}
