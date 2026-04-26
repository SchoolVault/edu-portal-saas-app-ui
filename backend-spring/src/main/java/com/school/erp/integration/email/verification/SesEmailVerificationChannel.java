package com.school.erp.integration.email.verification;

import com.school.erp.integration.email.SesTransactionalMailClient;
import org.springframework.stereotype.Component;

@Component
public class SesEmailVerificationChannel implements EmailVerificationChannel {

    private final SesTransactionalMailClient client;

    public SesEmailVerificationChannel(SesTransactionalMailClient client) {
        this.client = client;
    }

    @Override
    public EmailProvider kind() {
        return EmailProvider.SES;
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
