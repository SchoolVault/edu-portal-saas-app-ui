package com.school.erp.modules.fees.repository;

import com.school.erp.modules.fees.entity.FeeTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FeeTransactionRepository extends JpaRepository<FeeTransaction, Long> {
    List<FeeTransaction> findByTenantIdAndFeePaymentIdAndIsDeletedFalseOrderByCreatedAtAsc(String tenantId, Long feePaymentId);
    Optional<FeeTransaction> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
    Optional<FeeTransaction> findByTenantIdAndEventTypeAndProviderPaymentIdAndIsDeletedFalse(
            String tenantId, String eventType, String providerPaymentId);
    Optional<FeeTransaction> findByTenantIdAndEventTypeAndReferenceIdAndIsDeletedFalse(
            String tenantId, String eventType, String referenceId);
}
