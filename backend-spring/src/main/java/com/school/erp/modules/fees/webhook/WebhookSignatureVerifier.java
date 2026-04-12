package com.school.erp.modules.fees.webhook;

/**
 * Pluggable signature verification for payment webhooks (Razorpay, Stripe, etc.).
 */
public interface WebhookSignatureVerifier {

    String providerId();

    boolean isConfigured();

    /**
     * @param rawBody     exact request body bytes as received
     * @param signatureHeader value of the provider-specific signature header
     */
    boolean verify(byte[] rawBody, String signatureHeader);
}
