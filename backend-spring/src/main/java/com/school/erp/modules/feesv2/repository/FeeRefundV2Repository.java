package com.school.erp.modules.feesv2.repository;

import com.school.erp.modules.feesv2.entity.FeeRefundV2;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeeRefundV2Repository extends JpaRepository<FeeRefundV2, Long> {
    Optional<FeeRefundV2> findByTenantIdAndAcademicYearIdAndIdempotencyKeyAndIsDeletedFalse(
            String tenantId, Long academicYearId, String idempotencyKey);
}
