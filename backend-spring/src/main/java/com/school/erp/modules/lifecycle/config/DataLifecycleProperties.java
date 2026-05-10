package com.school.erp.modules.lifecycle.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Year-window policy for hot/warm/cold data handling.
 */
@ConfigurationProperties(prefix = "app.data-lifecycle")
public class DataLifecycleProperties {

    /**
     * Current year + this many previous years are considered HOT.
     */
    private int hotWindowYears = 1;

    /**
     * Data older than hot window but within this range is WARM.
     */
    private int warmWindowYears = 3;

    /**
     * Years older than this threshold are COLD and become archive candidates.
     */
    private int archiveAfterYears = 5;

    /**
     * When true, cold years should be served via read-only query paths.
     */
    private boolean coldReadsReadOnly = true;

    public int getHotWindowYears() {
        return hotWindowYears;
    }

    public void setHotWindowYears(int hotWindowYears) {
        this.hotWindowYears = hotWindowYears;
    }

    public int getWarmWindowYears() {
        return warmWindowYears;
    }

    public void setWarmWindowYears(int warmWindowYears) {
        this.warmWindowYears = warmWindowYears;
    }

    public int getArchiveAfterYears() {
        return archiveAfterYears;
    }

    public void setArchiveAfterYears(int archiveAfterYears) {
        this.archiveAfterYears = archiveAfterYears;
    }

    public boolean isColdReadsReadOnly() {
        return coldReadsReadOnly;
    }

    public void setColdReadsReadOnly(boolean coldReadsReadOnly) {
        this.coldReadsReadOnly = coldReadsReadOnly;
    }
}
