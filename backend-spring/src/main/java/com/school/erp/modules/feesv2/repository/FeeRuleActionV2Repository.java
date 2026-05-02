package com.school.erp.modules.feesv2.repository;

import com.school.erp.modules.feesv2.entity.FeeRuleActionV2;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeeRuleActionV2Repository extends JpaRepository<FeeRuleActionV2, Long> {
    List<FeeRuleActionV2> findByTenantIdAndAcademicYearIdAndFeeRuleIdAndIsDeletedFalseOrderByActionOrderAsc(
            String tenantId, Long academicYearId, Long feeRuleId);
}
