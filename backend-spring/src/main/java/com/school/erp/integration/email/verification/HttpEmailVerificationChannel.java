package com.school.erp.integration.email.verification;

import com.school.erp.integration.outbound.OutboundEmailHttpClient;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Publishes the same {@code email_verification_requested} JSON as legacy integration workers.
 */
@Component
public class HttpEmailVerificationChannel implements EmailVerificationChannel {

    private final OutboundEmailHttpClient outboundEmailHttpClient;

    public HttpEmailVerificationChannel(OutboundEmailHttpClient outboundEmailHttpClient) {
        this.outboundEmailHttpClient = outboundEmailHttpClient;
    }

    @Override
    public EmailProvider kind() {
        return EmailProvider.HTTP;
    }

    @Override
    public boolean isReady() {
        return outboundEmailHttpClient.isTriggerConfigured();
    }

    @Override
    public void send(
            String tenantId,
            Long userId,
            String toEmail,
            String verificationUrl,
            String expiresAtIso) {
        if (!StringUtils.hasText(verificationUrl) || !StringUtils.hasText(toEmail)) {
            return;
        }
        Map<String, Object> attrs = new LinkedHashMap<>();
        attrs.put("toEmail", toEmail);
        attrs.put("verificationUrl", verificationUrl);
        attrs.put("userId", userId);
        attrs.put("expiresAt", expiresAtIso);
        outboundEmailHttpClient.postTriggerPayload("email_verification_requested", tenantId, attrs);
    }
}
