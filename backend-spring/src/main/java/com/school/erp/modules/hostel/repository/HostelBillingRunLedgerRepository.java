package com.school.erp.modules.hostel.repository;

import com.school.erp.modules.hostel.entity.HostelBillingRunLedger;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface HostelBillingRunLedgerRepository extends JpaRepository<HostelBillingRunLedger, Long> {
    Optional<HostelBillingRunLedger> findByTenantIdAndIdempotencyKeyAndIsDeletedFalse(String tenantId, String idempotencyKey);

    Optional<HostelBillingRunLedger> findFirstByTenantIdAndDueDateAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId, LocalDate dueDate);
}
