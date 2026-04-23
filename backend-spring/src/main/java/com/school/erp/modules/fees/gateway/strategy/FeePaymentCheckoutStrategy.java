package com.school.erp.modules.fees.gateway.strategy;

import com.school.erp.modules.fees.gateway.PaymentGatewayClient;

/**
 * Pluggable parent-fee checkout: add a Spring {@code @Component} implementing this interface to
 * support a new provider id (e.g. stripe). Use {@link org.springframework.core.annotation.Order}:
 * specific providers first (low order value), broad fallbacks last.
 */
public interface FeePaymentCheckoutStrategy {

    /**
     * @param providerId normalized lowercase provider (e.g. {@code razorpay}, {@code mockpay})
     */
    boolean supports(String providerId);

    PaymentGatewayClient.GatewayCheckoutSession createSession(
            String providerId,
            String tenantId,
            Long paymentId,
            java.math.BigDecimal amount,
            String currency,
            String returnUrl);

    PaymentGatewayClient.GatewayPaymentConfirmation confirmPayment(
            String providerId,
            String checkoutToken,
            String providerOrderId,
            String providerPaymentId,
            String providerSignature);

    PaymentGatewayClient.GatewayPaymentStatus fetchPaymentStatus(
            String providerId,
            String providerOrderId,
            String providerPaymentId);
}
