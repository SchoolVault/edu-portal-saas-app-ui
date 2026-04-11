package com.school.erp.modules.fees.gateway.strategy;

import com.school.erp.modules.fees.gateway.PaymentGatewayClient;
import com.school.erp.modules.fees.gateway.RazorpayPaymentGatewayClient;
import com.school.erp.modules.payment.domain.PaymentProviderIds;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

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
    public PaymentGatewayClient.GatewayCheckoutSession createSession(
            String providerId,
            String tenantId,
            Long paymentId,
            BigDecimal amount,
            String currency,
            String returnUrl) {
        return razorpay.create(tenantId, paymentId, amount, currency, returnUrl);
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

    public RazorpayFeePaymentCheckoutStrategy(RazorpayPaymentGatewayClient razorpay) {
        this.razorpay = razorpay;
    }
}
