package com.school.erp.modules.fees.gateway.strategy;

import com.school.erp.modules.fees.gateway.FeeGatewayOrderContext;
import com.school.erp.modules.fees.gateway.MockPaymentGatewayClient;
import com.school.erp.modules.fees.gateway.PaymentGatewayClient;
import com.school.erp.modules.payment.domain.PaymentProviderIds;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * In-process sandbox for integration tests and optional non-production gateways (mockpay, upi, …).
 * Parent portal production builds should leave only {@code razorpay} in {@code app.payments.parent.enabled-providers}.
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class MockSandboxFeePaymentCheckoutStrategy implements FeePaymentCheckoutStrategy {

    private final MockPaymentGatewayClient mock;

    @Override
    public boolean supports(String providerId) {
        return !PaymentProviderIds.RAZORPAY.equals(providerId) && !PaymentProviderIds.STRIPE.equals(providerId);
    }

    @Override
    public PaymentGatewayClient.GatewayCheckoutSession createSession(String providerId, FeeGatewayOrderContext orderContext) {
        return mock.createSession(providerId, orderContext);
    }

    @Override
    public PaymentGatewayClient.GatewayPaymentConfirmation confirmPayment(
            String providerId,
            String checkoutToken,
            String providerOrderId,
            String providerPaymentId,
            String providerSignature) {
        return mock.confirmPayment(providerId, checkoutToken, providerOrderId, providerPaymentId, providerSignature);
    }

    @Override
    public PaymentGatewayClient.GatewayPaymentStatus fetchPaymentStatus(
            String providerId,
            String providerOrderId,
            String providerPaymentId) {
        return mock.fetchPaymentStatus(providerId, providerOrderId, providerPaymentId);
    }

    public MockSandboxFeePaymentCheckoutStrategy(MockPaymentGatewayClient mock) {
        this.mock = mock;
    }
}
