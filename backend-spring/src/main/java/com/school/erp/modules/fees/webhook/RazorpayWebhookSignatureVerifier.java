package com.school.erp.modules.fees.webhook;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Razorpay webhook HMAC: {@code HMAC_SHA256(webhook_secret, raw_body)} compared to {@code X-Razorpay-Signature} header.
 */
@Component
public class RazorpayWebhookSignatureVerifier implements WebhookSignatureVerifier {

    private static final String HEADER = "X-Razorpay-Signature";

    @Value("${app.payments.razorpay.webhook-secret:}")
    private String webhookSecret;

    @Override
    public String providerId() {
        return "razorpay";
    }

    @Override
    public boolean isConfigured() {
        return webhookSecret != null && !webhookSecret.isBlank();
    }

    @Override
    public boolean verify(byte[] rawBody, String signatureHeader) {
        if (!isConfigured() || signatureHeader == null || signatureHeader.isBlank() || rawBody == null) {
            return false;
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] expected = mac.doFinal(rawBody);
            String hex = HexFormat.of().formatHex(expected);
            return constantTimeEquals(hex.toLowerCase(java.util.Locale.ROOT), signatureHeader.trim().toLowerCase(java.util.Locale.ROOT));
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            return false;
        }
    }

    public static String expectedHeaderName() {
        return HEADER;
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null || a.length() != b.length()) {
            return false;
        }
        int r = 0;
        for (int i = 0; i < a.length(); i++) {
            r |= a.charAt(i) ^ b.charAt(i);
        }
        return r == 0;
    }
}
