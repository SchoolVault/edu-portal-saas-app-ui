package com.school.erp.modules.feesv2.repository;

import com.school.erp.modules.feesv2.entity.FeeStructureComponentV2;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeeStructureComponentV2Repository extends JpaRepository<FeeStructureComponentV2, Long> {
    List<FeeStructureComponentV2> findByTenantIdAndAcademicYearIdAndFeeStructureIdAndIsDeletedFalse(
            String tenantId, Long academicYearId, Long feeStructureId);
}
