package com.school.erp.modules.auth.service;

import com.school.erp.integration.outbound.OutboundEmailHttpClient;
import com.school.erp.modules.auth.port.EmailVerificationDispatchPort;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Sends {@code email_verification_requested} to the optional integration email worker
 * ({@code app.integration.email.trigger-url}), same transport as other domain email hooks.
 */
@Component
public class EmailVerificationHttpDispatchAdapter implements EmailVerificationDispatchPort {

    private final OutboundEmailHttpClient outboundEmailHttpClient;

    public EmailVerificationHttpDispatchAdapter(OutboundEmailHttpClient outboundEmailHttpClient) {
        this.outboundEmailHttpClient = outboundEmailHttpClient;
    }

    @Override
    public boolean canSendOutbound() {
        return outboundEmailHttpClient.isTriggerConfigured();
    }

    @Override
    public void publishVerificationLink(
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
