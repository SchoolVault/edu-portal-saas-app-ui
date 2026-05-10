package com.school.erp.integration.email.verification;

/**
 * Pluggable email delivery for {@code email_verification_requested}. New providers: add a value, implement
 * {@link EmailVerificationChannel}, and extend {@code EmailVerificationChannelSelector}.
 */
public enum EmailProvider {

    /**
     * Use SendGrid if key+from present, else Brevo, else Amazon SES, else HTTP trigger URL.
     */
    AUTO,

    SENDGRID,
    BREVO,

    /**
     * Amazon SES via IAM or static keys; {@code app.integration.email.ses}.
     */
    SES,
    /**
     * POST to {@code app.integration.email.trigger-url} only.
     */
    HTTP,

    /** No outbound (verification email will not be sent; useful for stricter test environments). */
    NONE
}
