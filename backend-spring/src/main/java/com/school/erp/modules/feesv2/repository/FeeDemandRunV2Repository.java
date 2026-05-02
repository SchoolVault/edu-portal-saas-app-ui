package com.school.erp.modules.feesv2.repository;

import com.school.erp.modules.feesv2.entity.FeeDemandRunV2;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeeDemandRunV2Repository extends JpaRepository<FeeDemandRunV2, Long> {
    Optional<FeeDemandRunV2> findByTenantIdAndAcademicYearIdAndIdempotencyKeyAndIsDeletedFalse(
            String tenantId, Long academicYearId, String idempotencyKey);
    List<FeeDemandRunV2> findByTenantIdAndAcademicYearIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId, Long academicYearId);
}
