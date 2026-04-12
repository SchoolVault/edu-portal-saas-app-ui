package com.school.erp.modules.fees.repository;

import com.school.erp.modules.fees.entity.FeePaymentAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FeePaymentAttemptRepository extends JpaRepository<FeePaymentAttempt, Long> {
    Optional<FeePaymentAttempt> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
    Optional<FeePaymentAttempt> findByCheckoutTokenAndTenantIdAndIsDeletedFalse(String checkoutToken, String tenantId);
    List<FeePaymentAttempt> findByTenantIdAndFeePaymentIdAndIsDeletedFalse(String tenantId, Long feePaymentId);
    List<FeePaymentAttempt> findByTenantIdAndFeePaymentIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId, Long feePaymentId);

    List<FeePaymentAttempt> findByProviderAndProviderOrderIdAndIsDeletedFalse(String provider, String providerOrderId);

    List<FeePaymentAttempt> findByProviderAndProviderPaymentIdAndIsDeletedFalse(String provider, String providerPaymentId);

    Optional<FeePaymentAttempt> findByTenantIdAndProviderAndProviderPaymentIdAndIsDeletedFalse(
            String tenantId, String provider, String providerPaymentId);
}
