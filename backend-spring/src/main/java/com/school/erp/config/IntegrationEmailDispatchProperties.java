package com.school.erp.config;

import com.school.erp.integration.email.verification.EmailProvider;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Drives which {@link com.school.erp.integration.email.verification.EmailVerificationChannel} is used.
 */
@ConfigurationProperties(prefix = "app.integration.email.dispatch")
public class IntegrationEmailDispatchProperties {

    private EmailProvider provider = EmailProvider.AUTO;

    public EmailProvider getProvider() {
        return provider;
    }

    public void setProvider(EmailProvider provider) {
        this.provider = provider;
    }
}
