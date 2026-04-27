package com.school.erp.modules.hostel.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.hostel.incident")
public class HostelIncidentSlaProperties {
    private int lowSeveritySlaMinutes = 480;
    private int mediumSeveritySlaMinutes = 240;
    private int highSeveritySlaMinutes = 120;
    private int criticalSeveritySlaMinutes = 60;

    public int getLowSeveritySlaMinutes() {
        return lowSeveritySlaMinutes;
    }

    public void setLowSeveritySlaMinutes(int lowSeveritySlaMinutes) {
        this.lowSeveritySlaMinutes = lowSeveritySlaMinutes;
    }

    public int getMediumSeveritySlaMinutes() {
        return mediumSeveritySlaMinutes;
    }

    public void setMediumSeveritySlaMinutes(int mediumSeveritySlaMinutes) {
        this.mediumSeveritySlaMinutes = mediumSeveritySlaMinutes;
    }

    public int getHighSeveritySlaMinutes() {
        return highSeveritySlaMinutes;
    }

    public void setHighSeveritySlaMinutes(int highSeveritySlaMinutes) {
        this.highSeveritySlaMinutes = highSeveritySlaMinutes;
    }

    public int getCriticalSeveritySlaMinutes() {
        return criticalSeveritySlaMinutes;
    }

    public void setCriticalSeveritySlaMinutes(int criticalSeveritySlaMinutes) {
        this.criticalSeveritySlaMinutes = criticalSeveritySlaMinutes;
    }
}
