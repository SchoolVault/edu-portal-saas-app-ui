package com.school.erp.modules.auth.port;

/**
 * Publishes a login-email verification link to an outbound channel (HTTP worker, queue, etc.).
 * Default implementation posts to {@code app.integration.email.trigger-url} when configured.
 */
public interface EmailVerificationDispatchPort {

    /** {@code true} when outbound HTTP email trigger is configured and a link can be handed to the worker. */
    boolean canSendOutbound();

    /**
     * Notifies the integration layer to send (or queue) the verification email.
     *
     * @param verificationUrl full SPA URL including {@code /verify-email?token=…}
     */
    void publishVerificationLink(String tenantId, Long userId, String toEmail, String verificationUrl, String expiresAtIso);
}
