package com.school.erp.modules.fees.gateway.strategy;

import com.school.erp.modules.fees.gateway.FeeGatewayOrderContext;
import com.school.erp.modules.fees.gateway.PaymentGatewayClient;
import com.school.erp.modules.fees.gateway.RazorpayPaymentGatewayClient;
import com.school.erp.modules.payment.domain.PaymentProviderIds;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Live Razorpay Orders API + signature verification on confirm.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RazorpayFeePaymentCheckoutStrategy implements FeePaymentCheckoutStrategy {

    private final RazorpayPaymentGatewayClient razorpay;

    @Override
    public boolean supports(String providerId) {
        return PaymentProviderIds.RAZORPAY.equals(providerId);
    }

    @Override
    public PaymentGatewayClient.GatewayCheckoutSession createSession(String providerId, FeeGatewayOrderContext orderContext) {
        return razorpay.create(orderContext);
    }

    @Override
    public PaymentGatewayClient.GatewayPaymentConfirmation confirmPayment(
            String providerId,
            String checkoutToken,
            String providerOrderId,
            String providerPaymentId,
            String providerSignature) {
        return razorpay.confirm(checkoutToken, providerOrderId, providerPaymentId, providerSignature);
    }

    @Override
    public PaymentGatewayClient.GatewayPaymentStatus fetchPaymentStatus(
            String providerId,
            String providerOrderId,
            String providerPaymentId) {
        return razorpay.fetchPaymentStatus(providerOrderId, providerPaymentId);
    }

    public RazorpayFeePaymentCheckoutStrategy(RazorpayPaymentGatewayClient razorpay) {
        this.razorpay = razorpay;
    }
}
