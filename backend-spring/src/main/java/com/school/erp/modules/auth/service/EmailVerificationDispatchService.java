package com.school.erp.modules.auth.service;

import com.school.erp.modules.auth.port.EmailVerificationDispatchPort;
import com.school.erp.integration.email.verification.EmailVerificationChannel;
import com.school.erp.integration.email.verification.EmailVerificationChannelSelector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Routes email verification to the selected {@link EmailVerificationChannel} (SendGrid, Brevo, or HTTP
 * trigger). Add providers by implementing {@code EmailVerificationChannel} and updating
 * {@link EmailVerificationChannelSelector}.
 */
@Component
public class EmailVerificationDispatchService implements EmailVerificationDispatchPort {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationDispatchService.class);

    private final EmailVerificationChannelSelector channelSelector;

    public EmailVerificationDispatchService(EmailVerificationChannelSelector channelSelector) {
        this.channelSelector = channelSelector;
    }

    @Override
    public boolean canSendOutbound() {
        return channelSelector.select().isPresent();
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
        var channel = channelSelector.select();
        if (channel.isEmpty()) {
            return;
        }
        EmailVerificationChannel c = channel.get();
        if (log.isDebugEnabled()) {
            log.debug("email_verification delivery via channel={}", c.kind());
        }
        c.send(tenantId, userId, toEmail, verificationUrl, expiresAtIso);
    }
}
