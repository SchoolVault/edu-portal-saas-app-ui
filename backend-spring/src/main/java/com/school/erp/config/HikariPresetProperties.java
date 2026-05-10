package com.school.erp.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.datasource.hikari-preset")
public class HikariPresetProperties {

    /**
     * none | small | medium | large
     */
    private String profile = "none";

    public String getProfile() {
        return profile;
    }

    public void setProfile(String profile) {
        this.profile = profile;
    }
}

