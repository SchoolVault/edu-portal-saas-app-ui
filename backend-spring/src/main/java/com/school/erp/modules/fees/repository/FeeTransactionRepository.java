package com.school.erp.modules.fees.repository;

import com.school.erp.modules.fees.entity.FeeTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface FeeTransactionRepository extends JpaRepository<FeeTransaction, Long> {
    List<FeeTransaction> findByTenantIdAndFeePaymentIdAndIsDeletedFalseOrderByCreatedAtAsc(String tenantId, Long feePaymentId);
    Optional<FeeTransaction> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
    Optional<FeeTransaction> findByTenantIdAndEventTypeAndProviderPaymentIdAndIsDeletedFalse(
            String tenantId, String eventType, String providerPaymentId);
    Optional<FeeTransaction> findByTenantIdAndEventTypeAndReferenceIdAndIsDeletedFalse(
            String tenantId, String eventType, String referenceId);

    Optional<FeeTransaction> findFirstByEventTypeAndProviderPaymentIdAndIsDeletedFalseOrderByIdDesc(
            String eventType, String providerPaymentId);

    /** True when money was actually collected (gateway capture or school-recorded payment), not merely an obligation row. */
    boolean existsByTenantIdAndFeePaymentIdAndIsDeletedFalseAndEventTypeIn(
            String tenantId, Long feePaymentId, Collection<String> eventTypes);
}
