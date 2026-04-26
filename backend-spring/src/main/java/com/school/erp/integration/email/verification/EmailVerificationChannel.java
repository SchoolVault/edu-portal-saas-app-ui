package com.school.erp.integration.email.verification;

/**
 * Pluggable email verification delivery. Add a new provider: implement, register as a Spring bean, update
 * {@link EmailVerificationChannelSelector}.
 */
public interface EmailVerificationChannel {

    /**
     * Stable id for config (logging / metrics / future per-tenant routing).
     */
    EmailProvider kind();

    /**
     * Whether credentials / URL for this channel are set so a send can be attempted.
     */
    boolean isReady();

    void send(
            String tenantId,
            Long userId,
            String toEmail,
            String verificationUrl,
            String expiresAtIso);
}
