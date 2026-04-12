package com.school.erp.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Environment-driven API/WebSocket exposure. Production should disable anonymous access to docs and actuator.
 */
@ConfigurationProperties(prefix = "app.security")
public class AppSecurityProperties {

    /**
     * When false, OpenAPI/Swagger UI require an authenticated admin-class user.
     */
    private boolean permitSwaggerAnonymous = true;

    /**
     * When false, only health/info are anonymous; other actuator endpoints require admin.
     */
    private boolean permitActuatorAnonymous = true;

    /**
     * Comma-separated STOMP/WebSocket allowed origins. Empty falls back to {@code app.cors.allowed-origins}.
     */
    private String websocketAllowedOrigins = "";

    public boolean isPermitSwaggerAnonymous() {
        return permitSwaggerAnonymous;
    }

    public void setPermitSwaggerAnonymous(boolean permitSwaggerAnonymous) {
        this.permitSwaggerAnonymous = permitSwaggerAnonymous;
    }

    public boolean isPermitActuatorAnonymous() {
        return permitActuatorAnonymous;
    }

    public void setPermitActuatorAnonymous(boolean permitActuatorAnonymous) {
        this.permitActuatorAnonymous = permitActuatorAnonymous;
    }

    public String getWebsocketAllowedOrigins() {
        return websocketAllowedOrigins;
    }

    public void setWebsocketAllowedOrigins(String websocketAllowedOrigins) {
        this.websocketAllowedOrigins = websocketAllowedOrigins;
    }
}
