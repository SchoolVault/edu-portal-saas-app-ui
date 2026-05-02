package com.school.erp.modules.feesv2.repository;

import com.school.erp.modules.feesv2.entity.FeeReceiptCounterV2;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FeeReceiptCounterV2Repository extends JpaRepository<FeeReceiptCounterV2, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(
            """
            select c from FeeReceiptCounterV2 c
            where c.tenantId = :tenantId and c.academicYearId = :academicYearId and c.isDeleted = false
            """)
    Optional<FeeReceiptCounterV2> findForUpdate(@Param("tenantId") String tenantId, @Param("academicYearId") Long academicYearId);
}
