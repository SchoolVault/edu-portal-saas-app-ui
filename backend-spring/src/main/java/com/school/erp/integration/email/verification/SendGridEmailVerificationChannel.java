package com.school.erp.integration.email.verification;

import com.school.erp.integration.email.SendGridTransactionalMailClient;
import org.springframework.stereotype.Component;

@Component
public class SendGridEmailVerificationChannel implements EmailVerificationChannel {

    private final SendGridTransactionalMailClient client;

    public SendGridEmailVerificationChannel(SendGridTransactionalMailClient client) {
        this.client = client;
    }

    @Override
    public EmailProvider kind() {
        return EmailProvider.SENDGRID;
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
