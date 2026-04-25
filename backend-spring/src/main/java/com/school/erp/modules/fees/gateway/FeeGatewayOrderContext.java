package com.school.erp.modules.fees.gateway;

import java.math.BigDecimal;

/**
 * Immutable context for creating a provider order after the {@code fee_payment_attempts} row exists,
 * so correlation notes (tenant, attempt, payment) are attached for webhooks and support.
 */
public record FeeGatewayOrderContext(
        String tenantId,
        Long feePaymentId,
        Long feePaymentAttemptId,
        BigDecimal amount,
        String currency,
        String returnUrl) {

    public FeeGatewayOrderContext {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("tenantId required");
        }
        if (feePaymentId == null) {
            throw new IllegalArgumentException("feePaymentId required");
        }
        if (feePaymentAttemptId == null) {
            throw new IllegalArgumentException("feePaymentAttemptId required");
        }
        if (amount == null) {
            throw new IllegalArgumentException("amount required");
        }
    }
}
