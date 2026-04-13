package com.school.erp.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/**
 * Cache entry TTLs per region (transport, payroll, announcements). Override via env without code changes.
 * Keys are always tenant-scoped via {@link CacheConfig} key generators.
 */
@ConfigurationProperties(prefix = "app.cache.ttl")
public class AppCacheTtlProperties {

    private Duration defaultTtl = Duration.ofMinutes(5);
    private Duration transportRoutes = Duration.ofMinutes(15);
    private Duration announcementPreviews = Duration.ofSeconds(90);
    private Duration payrollStructures = Duration.ofMinutes(10);
    private Duration referenceData = Duration.ofHours(1);
    private Duration permissions = Duration.ofMinutes(15);
    private Duration tenantConfig = Duration.ofMinutes(10);
    private Duration reportResults = Duration.ofMinutes(5);

    public Duration getDefaultTtl() {
        return defaultTtl;
    }

    public void setDefaultTtl(Duration defaultTtl) {
        this.defaultTtl = defaultTtl;
    }

    public Duration getTransportRoutes() {
        return transportRoutes;
    }

    public void setTransportRoutes(Duration transportRoutes) {
        this.transportRoutes = transportRoutes;
    }

    public Duration getAnnouncementPreviews() {
        return announcementPreviews;
    }

    public void setAnnouncementPreviews(Duration announcementPreviews) {
        this.announcementPreviews = announcementPreviews;
    }

    public Duration getPayrollStructures() {
        return payrollStructures;
    }

    public void setPayrollStructures(Duration payrollStructures) {
        this.payrollStructures = payrollStructures;
    }

    public Duration getReferenceData() {
        return referenceData;
    }

    public void setReferenceData(Duration referenceData) {
        this.referenceData = referenceData;
    }

    public Duration getPermissions() {
        return permissions;
    }

    public void setPermissions(Duration permissions) {
        this.permissions = permissions;
    }

    public Duration getTenantConfig() {
        return tenantConfig;
    }

    public void setTenantConfig(Duration tenantConfig) {
        this.tenantConfig = tenantConfig;
    }

    public Duration getReportResults() {
        return reportResults;
    }

    public void setReportResults(Duration reportResults) {
        this.reportResults = reportResults;
    }
}
