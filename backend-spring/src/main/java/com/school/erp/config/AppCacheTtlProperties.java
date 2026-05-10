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
    /** Dashboard KPIs / admin & teacher dashboard payloads (Redis; refresh by TTL, e.g. 1h on free tier). */
    private Duration dashboardSnapshots = Duration.ofHours(1);
    /** Paged student roster and class-scoped lists (tenant + user + params in key). */
    private Duration studentDirectory = Duration.ofMinutes(20);
    /** Paged teacher directory. */
    private Duration teacherDirectory = Duration.ofMinutes(20);
    /** Subject catalog, academic years, classes-with-sections (mostly static per tenant). */
    private Duration academicCatalog = Duration.ofMinutes(45);
    /** Tenant settings / feature flags / branch list (evicted on settings writes where wired). */
    private Duration settingsSnapshot = Duration.ofHours(2);
    /** Book catalog (title search + paging keys include params; short TTL if you skip per-mutation evict). */
    private Duration libraryCatalog = Duration.ofMinutes(45);
    /** Circulation lists — changes when books are issued/returned. */
    private Duration libraryIssues = Duration.ofMinutes(4);
    /** Fee structure grid (one cache entry per tenant when using tenant key). */
    private Duration feesCatalog = Duration.ofMinutes(45);
    /** Class/section weekly timetable rows. */
    private Duration timetableGrid = Duration.ofMinutes(20);
    /** Leave policy card and admin entitlement settings. */
    private Duration leavePolicy = Duration.ofMinutes(20);
    /** Leave balance summary for current user. */
    private Duration leaveBalance = Duration.ofMinutes(3);
    private Duration reportResults = Duration.ofMinutes(30);

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

    public Duration getDashboardSnapshots() {
        return dashboardSnapshots;
    }

    public void setDashboardSnapshots(Duration dashboardSnapshots) {
        this.dashboardSnapshots = dashboardSnapshots;
    }

    public Duration getStudentDirectory() {
        return studentDirectory;
    }

    public void setStudentDirectory(Duration studentDirectory) {
        this.studentDirectory = studentDirectory;
    }

    public Duration getTeacherDirectory() {
        return teacherDirectory;
    }

    public void setTeacherDirectory(Duration teacherDirectory) {
        this.teacherDirectory = teacherDirectory;
    }

    public Duration getAcademicCatalog() {
        return academicCatalog;
    }

    public void setAcademicCatalog(Duration academicCatalog) {
        this.academicCatalog = academicCatalog;
    }

    public Duration getSettingsSnapshot() {
        return settingsSnapshot;
    }

    public void setSettingsSnapshot(Duration settingsSnapshot) {
        this.settingsSnapshot = settingsSnapshot;
    }

    public Duration getLibraryCatalog() {
        return libraryCatalog;
    }

    public void setLibraryCatalog(Duration libraryCatalog) {
        this.libraryCatalog = libraryCatalog;
    }

    public Duration getLibraryIssues() {
        return libraryIssues;
    }

    public void setLibraryIssues(Duration libraryIssues) {
        this.libraryIssues = libraryIssues;
    }

    public Duration getFeesCatalog() {
        return feesCatalog;
    }

    public void setFeesCatalog(Duration feesCatalog) {
        this.feesCatalog = feesCatalog;
    }

    public Duration getTimetableGrid() {
        return timetableGrid;
    }

    public void setTimetableGrid(Duration timetableGrid) {
        this.timetableGrid = timetableGrid;
    }

    public Duration getLeavePolicy() {
        return leavePolicy;
    }

    public void setLeavePolicy(Duration leavePolicy) {
        this.leavePolicy = leavePolicy;
    }

    public Duration getLeaveBalance() {
        return leaveBalance;
    }

    public void setLeaveBalance(Duration leaveBalance) {
        this.leaveBalance = leaveBalance;
    }
}
