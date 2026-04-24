package com.school.erp.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.auth.email-verification")
public class AuthEmailVerificationProperties {

    /** How long the one-time token remains valid. */
    private int tokenTtlHours = 48;

    /**
     * When true, the API response to "request verification" includes the raw token (dev / staging only).
     * Never enable in production.
     */
    private boolean exposePlainTokenInApiResponse = false;
    private int requestCooldownSeconds = 60;

    /**
     * Public origin of the Angular SPA (no trailing slash), used to build {@code /verify-email?token=…} links
     * for outbound email / webhooks. Example: {@code https://portal.example.com}
     */
    private String publicSpaBaseUrl = "";

    public int getTokenTtlHours() {
        return tokenTtlHours;
    }

    public void setTokenTtlHours(int tokenTtlHours) {
        this.tokenTtlHours = tokenTtlHours;
    }

    public boolean isExposePlainTokenInApiResponse() {
        return exposePlainTokenInApiResponse;
    }

    public void setExposePlainTokenInApiResponse(boolean exposePlainTokenInApiResponse) {
        this.exposePlainTokenInApiResponse = exposePlainTokenInApiResponse;
    }

    public int getRequestCooldownSeconds() {
        return requestCooldownSeconds;
    }

    public void setRequestCooldownSeconds(int requestCooldownSeconds) {
        this.requestCooldownSeconds = requestCooldownSeconds;
    }

    public String getPublicSpaBaseUrl() {
        return publicSpaBaseUrl;
    }

    public void setPublicSpaBaseUrl(String publicSpaBaseUrl) {
        this.publicSpaBaseUrl = publicSpaBaseUrl;
    }
}
