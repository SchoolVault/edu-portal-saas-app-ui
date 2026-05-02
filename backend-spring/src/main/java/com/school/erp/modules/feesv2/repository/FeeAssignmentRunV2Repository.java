package com.school.erp.modules.feesv2.repository;

import com.school.erp.modules.feesv2.entity.FeeAssignmentRunV2;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeeAssignmentRunV2Repository extends JpaRepository<FeeAssignmentRunV2, Long> {
    Optional<FeeAssignmentRunV2> findByTenantIdAndAcademicYearIdAndIdempotencyKeyAndIsDeletedFalse(
            String tenantId, Long academicYearId, String idempotencyKey);
}
