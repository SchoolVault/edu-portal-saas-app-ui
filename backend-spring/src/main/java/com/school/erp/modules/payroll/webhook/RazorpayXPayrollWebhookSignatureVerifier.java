package com.school.erp.modules.payroll.webhook;

import com.school.erp.modules.payroll.payout.PayrollPayoutRazorpayXProperties;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Component;

@Component
public class RazorpayXPayrollWebhookSignatureVerifier {
    private static final String HEADER = "X-Razorpay-Signature";
    private final PayrollPayoutRazorpayXProperties properties;

    public RazorpayXPayrollWebhookSignatureVerifier(PayrollPayoutRazorpayXProperties properties) {
        this.properties = properties;
    }

    public boolean isConfigured() {
        String secret = properties.getWebhookSecret();
        return secret != null && !secret.isBlank();
    }

    public boolean verify(byte[] rawBody, String signatureHeader) {
        String secret = properties.getWebhookSecret();
        if (secret == null || secret.isBlank() || rawBody == null || signatureHeader == null || signatureHeader.isBlank()) {
            return false;
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String expected = HexFormat.of().formatHex(mac.doFinal(rawBody)).toLowerCase(Locale.ROOT);
            return constantTimeEquals(expected, signatureHeader.trim().toLowerCase(Locale.ROOT));
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
