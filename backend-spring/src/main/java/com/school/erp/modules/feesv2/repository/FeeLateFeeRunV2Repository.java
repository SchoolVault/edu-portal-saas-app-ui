package com.school.erp.modules.feesv2.repository;

import com.school.erp.modules.feesv2.entity.FeeLateFeeRunV2;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeeLateFeeRunV2Repository extends JpaRepository<FeeLateFeeRunV2, Long> {
    Optional<FeeLateFeeRunV2> findByTenantIdAndAcademicYearIdAndIdempotencyKeyAndIsDeletedFalse(
            String tenantId, Long academicYearId, String idempotencyKey);

    List<FeeLateFeeRunV2> findByTenantIdAndAcademicYearIdAndIsDeletedFalseOrderByStartedAtDesc(
            String tenantId, Long academicYearId);
}
