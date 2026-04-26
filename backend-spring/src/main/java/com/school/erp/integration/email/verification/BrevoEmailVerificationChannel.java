package com.school.erp.integration.email.verification;

import com.school.erp.integration.email.BrevoTransactionalMailClient;
import org.springframework.stereotype.Component;

@Component
public class BrevoEmailVerificationChannel implements EmailVerificationChannel {

    private final BrevoTransactionalMailClient client;

    public BrevoEmailVerificationChannel(BrevoTransactionalMailClient client) {
        this.client = client;
    }

    @Override
    public EmailProvider kind() {
        return EmailProvider.BREVO;
    }

    @Override
    public boolean isReady() {
        return client.isConfigured();
    }

    @Override
    public void send(
            String tenantId,
            Long userId,
            String toEmail,
            String verificationUrl,
            String expiresAtIso) {
        client.sendEmailVerification(toEmail, verificationUrl, expiresAtIso);
    }
}
