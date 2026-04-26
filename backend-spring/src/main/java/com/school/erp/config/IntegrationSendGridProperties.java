package com.school.erp.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

/**
 * Direct transactional email via SendGrid HTTP v3 (server-to-server). Preferred over
 * {@code app.integration.email.trigger-url} for email verification: API key in secrets, no extra hop.
 * <p>
 * Create a key in SendGrid, verify the sender (single sender or domain), then set
 * {@code SENDGRID_API_KEY} and {@code EMAIL_VERIFICATION_FROM_EMAIL} in your runtime (K8s secret / Render).
 */
@ConfigurationProperties(prefix = "app.integration.email.sendgrid")
public class IntegrationSendGridProperties {

    /** Set via SENDGRID_API_KEY. Never log or return to clients. */
    private String apiKey = "";

    private String fromEmail = "";
    private String fromName = "School Vault";
    private String subject = "Verify your email";

    public boolean isConfigured() {
        return StringUtils.hasText(apiKey) && StringUtils.hasText(fromEmail);
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getFromEmail() {
        return fromEmail;
    }

    public void setFromEmail(String fromEmail) {
        this.fromEmail = fromEmail;
    }

    public String getFromName() {
        return fromName;
    }

    public void setFromName(String fromName) {
        this.fromName = fromName;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }
}
