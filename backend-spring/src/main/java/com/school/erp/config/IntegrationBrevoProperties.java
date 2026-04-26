package com.school.erp.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

/**
 * Brevo (ex-Sendinblue) transactional email (HTTPS, {@code api-key} header). Configure {@code BREVO_API_KEY}
 * and a verified sender.
 */
@ConfigurationProperties(prefix = "app.integration.email.brevo")
public class IntegrationBrevoProperties {

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
