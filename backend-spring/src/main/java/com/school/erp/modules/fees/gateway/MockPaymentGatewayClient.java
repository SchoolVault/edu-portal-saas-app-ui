package com.school.erp.modules.fees.gateway;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Locale;
import java.util.UUID;

/** In-process sandbox orders; used by {@link com.school.erp.modules.fees.gateway.strategy.MockSandboxFeePaymentCheckoutStrategy}. */
@Component
public class MockPaymentGatewayClient {
    public PaymentGatewayClient.GatewayCheckoutSession createSession(String provider, String tenantId, Long paymentId, BigDecimal amount, String currency, String returnUrl) {
        String normalizedProvider = provider == null ? "mockpay" : provider.trim().toLowerCase(Locale.ROOT);
        String orderId = normalizedProvider.toUpperCase(Locale.ROOT) + "-ORDER-" + UUID.randomUUID().toString().substring(0, 10);
        String token = normalizedProvider + "-token-" + UUID.randomUUID().toString().replace("-", "");
        String checkoutUrl = (returnUrl != null && !returnUrl.isBlank() ? returnUrl : "https://mockpay.schoolvault.local/checkout")
                + "?token=" + token + "&orderId=" + orderId;
        String payload = "{\"provider\":\"" + normalizedProvider + "\",\"tenantId\":\"" + tenantId + "\",\"paymentId\":" + paymentId + ",\"amount\":\"" + amount + "\"}";
        return new PaymentGatewayClient.GatewayCheckoutSession(normalizedProvider, orderId, token, checkoutUrl, payload);
    }

    public PaymentGatewayClient.GatewayPaymentConfirmation confirmPayment(String provider, String checkoutToken, String providerOrderId, String providerPaymentId, String providerSignature) {
        String normalizedProvider = provider == null ? "mockpay" : provider.trim().toLowerCase(Locale.ROOT);
        String resolvedPaymentId = (providerPaymentId != null && !providerPaymentId.isBlank())
                ? providerPaymentId
                : normalizedProvider.toUpperCase(Locale.ROOT) + "-PAY-" + UUID.randomUUID().toString().substring(0, 10);
        String payload = "{\"provider\":\"" + normalizedProvider + "\",\"checkoutToken\":\"" + checkoutToken + "\",\"providerOrderId\":\"" + providerOrderId + "\",\"providerPaymentId\":\"" + resolvedPaymentId + "\"}";
        return new PaymentGatewayClient.GatewayPaymentConfirmation(resolvedPaymentId, "SUCCESS", payload);
    }

    public PaymentGatewayClient.GatewayPaymentStatus fetchPaymentStatus(String provider, String providerOrderId, String providerPaymentId) {
        String normalizedProvider = provider == null ? "mockpay" : provider.trim().toLowerCase(Locale.ROOT);
        String resolvedPaymentId = (providerPaymentId != null && !providerPaymentId.isBlank())
                ? providerPaymentId
                : normalizedProvider.toUpperCase(Locale.ROOT) + "-PAY-" + UUID.randomUUID().toString().substring(0, 10);
        String payload = "{\"provider\":\"" + normalizedProvider + "\",\"providerOrderId\":\"" + providerOrderId + "\",\"providerPaymentId\":\"" + resolvedPaymentId + "\",\"status\":\"CAPTURED\"}";
        return new PaymentGatewayClient.GatewayPaymentStatus(resolvedPaymentId, "CAPTURED", payload);
    }
}
