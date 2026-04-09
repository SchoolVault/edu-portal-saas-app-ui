package com.school.erp.modules.fees.gateway;

import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Locale;

@Primary
@Component
public class RoutingPaymentGatewayClient implements PaymentGatewayClient {
    private final MockPaymentGatewayClient mock;
    private final RazorpayPaymentGatewayClient razorpay;

    @Override
    public GatewayCheckoutSession createSession(String provider, String tenantId, Long paymentId, BigDecimal amount, String currency, String returnUrl) {
        String p = provider == null ? "mockpay" : provider.trim().toLowerCase(Locale.ROOT);
        if ("razorpay".equals(p)) {
            return razorpay.create(tenantId, paymentId, amount, currency, returnUrl);
        }
        return mock.createSession(p, tenantId, paymentId, amount, currency, returnUrl);
    }

    @Override
    public GatewayPaymentConfirmation confirmPayment(String provider, String checkoutToken, String providerOrderId, String providerPaymentId, String providerSignature) {
        String p = provider == null ? "mockpay" : provider.trim().toLowerCase(Locale.ROOT);
        if ("razorpay".equals(p)) {
            return razorpay.confirm(checkoutToken, providerOrderId, providerPaymentId, providerSignature);
        }
        return mock.confirmPayment(p, checkoutToken, providerOrderId, providerPaymentId, providerSignature);
    }

    public RoutingPaymentGatewayClient(MockPaymentGatewayClient mock, RazorpayPaymentGatewayClient razorpay) {
        this.mock = mock;
        this.razorpay = razorpay;
    }
}

