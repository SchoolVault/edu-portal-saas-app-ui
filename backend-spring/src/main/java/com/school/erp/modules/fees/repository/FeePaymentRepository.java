package com.school.erp.modules.fees.repository;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.fees.entity.FeePayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface FeePaymentRepository extends JpaRepository<FeePayment, Long> {
    List<FeePayment> findByTenantIdAndIsDeletedFalse(String tenantId);

    List<FeePayment> findByTenantIdAndStatusAndIsDeletedFalse(String tenantId, Enums.FeeStatus status);

    List<FeePayment> findByTenantIdAndStudentIdAndIsDeletedFalse(String tenantId, Long studentId);

    Optional<FeePayment> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    Optional<FeePayment> findByReceiptNumberAndTenantIdAndIsDeletedFalse(String receiptNumber, String tenantId);

    @Query("select distinct f.tenantId from FeePayment f where f.isDeleted = false")
    List<String> findDistinctTenantIds();

    @Query("""
            select f from FeePayment f
            where f.tenantId = :tenantId and f.isDeleted = false
              and f.dueAmount is not null and f.dueAmount > 0
              and f.status in :statuses
              and (
                (f.dueDate is not null and f.dueDate between :fromInclusive and :toInclusive)
                or f.status = :overdueStatus
              )
            """)
    List<FeePayment> findDueForReminders(
            @Param("tenantId") String tenantId,
            @Param("fromInclusive") LocalDate fromInclusive,
            @Param("toInclusive") LocalDate toInclusive,
            @Param("statuses") List<Enums.FeeStatus> statuses,
            @Param("overdueStatus") Enums.FeeStatus overdueStatus);
}
