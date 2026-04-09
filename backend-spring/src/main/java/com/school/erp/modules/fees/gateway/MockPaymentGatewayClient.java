package com.school.erp.modules.fees.gateway;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Locale;
import java.util.UUID;

@Component
public class MockPaymentGatewayClient implements PaymentGatewayClient {
    @Override
    public GatewayCheckoutSession createSession(String provider, String tenantId, Long paymentId, BigDecimal amount, String currency, String returnUrl) {
        String normalizedProvider = provider == null ? "mockpay" : provider.trim().toLowerCase(Locale.ROOT);
        String orderId = normalizedProvider.toUpperCase(Locale.ROOT) + "-ORDER-" + UUID.randomUUID().toString().substring(0, 10);
        String token = normalizedProvider + "-token-" + UUID.randomUUID().toString().replace("-", "");
        String checkoutUrl = (returnUrl != null && !returnUrl.isBlank() ? returnUrl : "https://mockpay.schoolvault.local/checkout")
                + "?token=" + token + "&orderId=" + orderId;
        String payload = "{\"provider\":\"" + normalizedProvider + "\",\"tenantId\":\"" + tenantId + "\",\"paymentId\":" + paymentId + ",\"amount\":\"" + amount + "\"}";
        return new GatewayCheckoutSession(normalizedProvider, orderId, token, checkoutUrl, payload);
    }

    @Override
    public GatewayPaymentConfirmation confirmPayment(String provider, String checkoutToken, String providerOrderId, String providerPaymentId, String providerSignature) {
        String normalizedProvider = provider == null ? "mockpay" : provider.trim().toLowerCase(Locale.ROOT);
        String resolvedPaymentId = (providerPaymentId != null && !providerPaymentId.isBlank())
                ? providerPaymentId
                : normalizedProvider.toUpperCase(Locale.ROOT) + "-PAY-" + UUID.randomUUID().toString().substring(0, 10);
        String payload = "{\"provider\":\"" + normalizedProvider + "\",\"checkoutToken\":\"" + checkoutToken + "\",\"providerOrderId\":\"" + providerOrderId + "\",\"providerPaymentId\":\"" + resolvedPaymentId + "\"}";
        return new GatewayPaymentConfirmation(resolvedPaymentId, "SUCCESS", payload);
    }
}
