package com.school.erp.modules.fees.gateway;

import java.math.BigDecimal;

public interface PaymentGatewayClient {
    GatewayCheckoutSession createSession(String provider, String tenantId, Long paymentId, BigDecimal amount, String currency, String returnUrl);
    GatewayPaymentConfirmation confirmPayment(String provider, String checkoutToken, String providerOrderId, String providerPaymentId, String providerSignature);

    class GatewayCheckoutSession {
        private final String provider;
        private final String providerOrderId;
        private final String checkoutToken;
        private final String checkoutUrl;
        private final String rawPayload;

        public GatewayCheckoutSession(String provider, String providerOrderId, String checkoutToken, String checkoutUrl, String rawPayload) {
            this.provider = provider;
            this.providerOrderId = providerOrderId;
            this.checkoutToken = checkoutToken;
            this.checkoutUrl = checkoutUrl;
            this.rawPayload = rawPayload;
        }

        public String getProvider() { return provider; }
        public String getProviderOrderId() { return providerOrderId; }
        public String getCheckoutToken() { return checkoutToken; }
        public String getCheckoutUrl() { return checkoutUrl; }
        public String getRawPayload() { return rawPayload; }
    }

    class GatewayPaymentConfirmation {
        private final String providerPaymentId;
        private final String status;
        private final String rawPayload;

        public GatewayPaymentConfirmation(String providerPaymentId, String status, String rawPayload) {
            this.providerPaymentId = providerPaymentId;
            this.status = status;
            this.rawPayload = rawPayload;
        }

        public String getProviderPaymentId() { return providerPaymentId; }
        public String getStatus() { return status; }
        public String getRawPayload() { return rawPayload; }
    }
}
