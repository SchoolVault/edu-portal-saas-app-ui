package com.school.erp.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

/**
 * Amazon Simple Email Service (v2 client via {@code software.amazon.awssdk.services.ses}).
 * <p>
 * In AWS (ECS, EC2, Lambda) use IAM + {@code use-default-credential-chain=true} (no long-lived keys).
 * In sandbox, verify the destination address in SES or the send will be rejected.
 */
@ConfigurationProperties(prefix = "app.integration.email.ses")
public class IntegrationSesProperties {

    private String region = "us-east-1";
    /** From address; must be verified in SES in the same region. */
    private String fromEmail = "";
    private String fromName = "School Vault";
    private String subject = "Verify your email";
    /**
     * Use {@link software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider} (EC2, ECS, env, profile).
     */
    private boolean useDefaultCredentialChain = true;
    /** Optional; if set, overrides default chain (discouraged in production). */
    private String accessKey = "";
    private String secretKey = "";

    public boolean isConfigured() {
        if (!StringUtils.hasText(fromEmail) || !StringUtils.hasText(region)) {
            return false;
        }
        if (useDefaultCredentialChain) {
            return true;
        }
        return StringUtils.hasText(accessKey) && StringUtils.hasText(secretKey);
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
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

    public boolean isUseDefaultCredentialChain() {
        return useDefaultCredentialChain;
    }

    public void setUseDefaultCredentialChain(boolean useDefaultCredentialChain) {
        this.useDefaultCredentialChain = useDefaultCredentialChain;
    }

    public String getAccessKey() {
        return accessKey;
    }

    public void setAccessKey(String accessKey) {
        this.accessKey = accessKey;
    }

    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }
}
