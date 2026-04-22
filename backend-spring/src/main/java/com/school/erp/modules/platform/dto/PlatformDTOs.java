package com.school.erp.modules.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class PlatformDTOs {

    public static class OnboardSchoolRequest {
        @NotBlank
        private String schoolName;
        @NotBlank
        @Size(min = 3, max = 20)
        private String schoolCode;
        @NotBlank
        private String adminName;
        private String adminEmail;
        @NotBlank
        @Size(min = 8, max = 128)
        private String adminPassword;
        @NotBlank
        private String phone;
        private String address;
        @Size(max = 16)
        private String interfaceLocale;
        @Size(max = 50)
        private String academicYearName;
        private LocalDate academicYearStartDate;
        private LocalDate academicYearEndDate;

        public String getSchoolName() { return schoolName; }
        public void setSchoolName(String schoolName) { this.schoolName = schoolName; }
        public String getSchoolCode() { return schoolCode; }
        public void setSchoolCode(String schoolCode) { this.schoolCode = schoolCode; }
        public String getAdminName() { return adminName; }
        public void setAdminName(String adminName) { this.adminName = adminName; }
        public String getAdminEmail() { return adminEmail; }
        public void setAdminEmail(String adminEmail) { this.adminEmail = adminEmail; }
        public String getAdminPassword() { return adminPassword; }
        public void setAdminPassword(String adminPassword) { this.adminPassword = adminPassword; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getInterfaceLocale() { return interfaceLocale; }
        public void setInterfaceLocale(String interfaceLocale) { this.interfaceLocale = interfaceLocale; }
        public String getAcademicYearName() { return academicYearName; }
        public void setAcademicYearName(String academicYearName) { this.academicYearName = academicYearName; }
        public LocalDate getAcademicYearStartDate() { return academicYearStartDate; }
        public void setAcademicYearStartDate(LocalDate academicYearStartDate) { this.academicYearStartDate = academicYearStartDate; }
        public LocalDate getAcademicYearEndDate() { return academicYearEndDate; }
        public void setAcademicYearEndDate(LocalDate academicYearEndDate) { this.academicYearEndDate = academicYearEndDate; }
    }

    public static class OnboardSchoolResponse {
        private String tenantId;
        private String schoolCode;
        private Long adminUserId;
        private String adminEmail;
        private String adminPhone;
        private Long academicYearId;

        public String getTenantId() { return tenantId; }
        public void setTenantId(String tenantId) { this.tenantId = tenantId; }
        public String getSchoolCode() { return schoolCode; }
        public void setSchoolCode(String schoolCode) { this.schoolCode = schoolCode; }
        public Long getAdminUserId() { return adminUserId; }
        public void setAdminUserId(Long adminUserId) { this.adminUserId = adminUserId; }
        public String getAdminEmail() { return adminEmail; }
        public void setAdminEmail(String adminEmail) { this.adminEmail = adminEmail; }
        public String getAdminPhone() { return adminPhone; }
        public void setAdminPhone(String adminPhone) { this.adminPhone = adminPhone; }
        public Long getAcademicYearId() { return academicYearId; }
        public void setAcademicYearId(Long academicYearId) { this.academicYearId = academicYearId; }
    }

    public static class MetricPoint {
        private String label;
        private long value;

        public MetricPoint() {}

        public MetricPoint(String label, long value) {
            this.label = label;
            this.value = value;
        }

        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
        public long getValue() { return value; }
        public void setValue(long value) { this.value = value; }
    }

    public static class PlatformActivity {
        private String title;
        private String description;
        private String tone;
        private String timestamp;

        public PlatformActivity() {}

        public PlatformActivity(String title, String description, String tone, String timestamp) {
            this.title = title;
            this.description = description;
            this.tone = tone;
            this.timestamp = timestamp;
        }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getTone() { return tone; }
        public void setTone(String tone) { this.tone = tone; }
        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    }

    public static class SchoolSummary {
        private String tenantId;
        private String schoolName;
        private String schoolCode;
        private String email;
        private String phone;
        private String address;
        private boolean active;
        private long studentCount;
        private long teacherCount;
        private long adminCount;
        private String primaryColor;
        private String secondaryColor;

        public String getTenantId() { return tenantId; }
        public void setTenantId(String tenantId) { this.tenantId = tenantId; }
        public String getSchoolName() { return schoolName; }
        public void setSchoolName(String schoolName) { this.schoolName = schoolName; }
        public String getSchoolCode() { return schoolCode; }
        public void setSchoolCode(String schoolCode) { this.schoolCode = schoolCode; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public boolean isActive() { return active; }
        public void setActive(boolean active) { this.active = active; }
        public long getStudentCount() { return studentCount; }
        public void setStudentCount(long studentCount) { this.studentCount = studentCount; }
        public long getTeacherCount() { return teacherCount; }
        public void setTeacherCount(long teacherCount) { this.teacherCount = teacherCount; }
        public long getAdminCount() { return adminCount; }
        public void setAdminCount(long adminCount) { this.adminCount = adminCount; }
        public String getPrimaryColor() { return primaryColor; }
        public void setPrimaryColor(String primaryColor) { this.primaryColor = primaryColor; }
        public String getSecondaryColor() { return secondaryColor; }
        public void setSecondaryColor(String secondaryColor) { this.secondaryColor = secondaryColor; }
    }

    public static class SchoolAdminSummary {
        private Long id;
        private String name;
        private String email;
        private String phone;
        private String schoolCode;
        private boolean active;
        private String createdAt;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getSchoolCode() { return schoolCode; }
        public void setSchoolCode(String schoolCode) { this.schoolCode = schoolCode; }
        public boolean isActive() { return active; }
        public void setActive(boolean active) { this.active = active; }
        public String getCreatedAt() { return createdAt; }
        public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    }

    /** Super-admin chat picker: campus admin + school context (same shape for UI list). */
    public static class SchoolAdminChatHit {
        private Long userId;
        private String name;
        private String email;
        private String phone;
        private String schoolName;
        private String schoolCode;
        private String tenantId;

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getSchoolName() { return schoolName; }
        public void setSchoolName(String schoolName) { this.schoolName = schoolName; }
        public String getSchoolCode() { return schoolCode; }
        public void setSchoolCode(String schoolCode) { this.schoolCode = schoolCode; }
        public String getTenantId() { return tenantId; }
        public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    }

    public static class ToggleAdminStatusRequest {
        private boolean active;

        public boolean isActive() { return active; }
        public void setActive(boolean active) { this.active = active; }
    }

    public static class PlatformDashboardResponse {
        private long totalSchools;
        private long activeSchools;
        private long totalStudents;
        private long totalTeachers;
        private long totalAdmins;
        private List<MetricPoint> schoolGrowth = new ArrayList<>();
        private List<MetricPoint> revenueTrend = new ArrayList<>();
        private List<PlatformActivity> recentActivities = new ArrayList<>();
        private List<SchoolSummary> topSchools = new ArrayList<>();

        public long getTotalSchools() { return totalSchools; }
        public void setTotalSchools(long totalSchools) { this.totalSchools = totalSchools; }
        public long getActiveSchools() { return activeSchools; }
        public void setActiveSchools(long activeSchools) { this.activeSchools = activeSchools; }
        public long getTotalStudents() { return totalStudents; }
        public void setTotalStudents(long totalStudents) { this.totalStudents = totalStudents; }
        public long getTotalTeachers() { return totalTeachers; }
        public void setTotalTeachers(long totalTeachers) { this.totalTeachers = totalTeachers; }
        public long getTotalAdmins() { return totalAdmins; }
        public void setTotalAdmins(long totalAdmins) { this.totalAdmins = totalAdmins; }
        public List<MetricPoint> getSchoolGrowth() { return schoolGrowth; }
        public void setSchoolGrowth(List<MetricPoint> schoolGrowth) { this.schoolGrowth = schoolGrowth; }
        public List<MetricPoint> getRevenueTrend() { return revenueTrend; }
        public void setRevenueTrend(List<MetricPoint> revenueTrend) { this.revenueTrend = revenueTrend; }
        public List<PlatformActivity> getRecentActivities() { return recentActivities; }
        public void setRecentActivities(List<PlatformActivity> recentActivities) { this.recentActivities = recentActivities; }
        public List<SchoolSummary> getTopSchools() { return topSchools; }
        public void setTopSchools(List<SchoolSummary> topSchools) { this.topSchools = topSchools; }
    }

    /** JVM / disk / dependency snapshot for super-admin operations console. */
    public static class PlatformHealthResponse {
        private String checkedAt;
        private JvmMemory jvm;
        private DiskSpace disk;
        private List<ComponentHealth> components = new ArrayList<>();
        private List<SloSignal> sloSignals = new ArrayList<>();
        private List<OperationalAlert> alerts = new ArrayList<>();

        public String getCheckedAt() { return checkedAt; }
        public void setCheckedAt(String checkedAt) { this.checkedAt = checkedAt; }
        public JvmMemory getJvm() { return jvm; }
        public void setJvm(JvmMemory jvm) { this.jvm = jvm; }
        public DiskSpace getDisk() { return disk; }
        public void setDisk(DiskSpace disk) { this.disk = disk; }
        public List<ComponentHealth> getComponents() { return components; }
        public void setComponents(List<ComponentHealth> components) { this.components = components; }
        public List<SloSignal> getSloSignals() { return sloSignals; }
        public void setSloSignals(List<SloSignal> sloSignals) { this.sloSignals = sloSignals; }
        public List<OperationalAlert> getAlerts() { return alerts; }
        public void setAlerts(List<OperationalAlert> alerts) { this.alerts = alerts; }
    }

    public static class JvmMemory {
        private long heapUsedBytes;
        private long heapMaxBytes;
        private int heapUsagePercent;

        public long getHeapUsedBytes() { return heapUsedBytes; }
        public void setHeapUsedBytes(long heapUsedBytes) { this.heapUsedBytes = heapUsedBytes; }
        public long getHeapMaxBytes() { return heapMaxBytes; }
        public void setHeapMaxBytes(long heapMaxBytes) { this.heapMaxBytes = heapMaxBytes; }
        public int getHeapUsagePercent() { return heapUsagePercent; }
        public void setHeapUsagePercent(int heapUsagePercent) { this.heapUsagePercent = heapUsagePercent; }
    }

    public static class DiskSpace {
        private String path;
        private long totalBytes;
        private long usableBytes;
        private int usagePercent;

        public String getPath() { return path; }
        public void setPath(String path) { this.path = path; }
        public long getTotalBytes() { return totalBytes; }
        public void setTotalBytes(long totalBytes) { this.totalBytes = totalBytes; }
        public long getUsableBytes() { return usableBytes; }
        public void setUsableBytes(long usableBytes) { this.usableBytes = usableBytes; }
        public int getUsagePercent() { return usagePercent; }
        public void setUsagePercent(int usagePercent) { this.usagePercent = usagePercent; }
    }

    public static class ComponentHealth {
        private String name;
        private String status;
        private String detail;

        public ComponentHealth() {}

        public ComponentHealth(String name, String status, String detail) {
            this.name = name;
            this.status = status;
            this.detail = detail;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getDetail() { return detail; }
        public void setDetail(String detail) { this.detail = detail; }
    }

    /** Named SLO metric and its current state for platform operations. */
    public static class SloSignal {
        private String key;
        private String label;
        private String unit;
        private double value;
        private double warnThreshold;
        private double criticalThreshold;
        private String status;

        public String getKey() { return key; }
        public void setKey(String key) { this.key = key; }
        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }
        public double getValue() { return value; }
        public void setValue(double value) { this.value = value; }
        public double getWarnThreshold() { return warnThreshold; }
        public void setWarnThreshold(double warnThreshold) { this.warnThreshold = warnThreshold; }
        public double getCriticalThreshold() { return criticalThreshold; }
        public void setCriticalThreshold(double criticalThreshold) { this.criticalThreshold = criticalThreshold; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    /** Alert-ready signal for dashboards/notifications. */
    public static class OperationalAlert {
        private String severity;
        private String code;
        private String title;
        private String detail;
        private String suggestedAction;

        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDetail() { return detail; }
        public void setDetail(String detail) { this.detail = detail; }
        public String getSuggestedAction() { return suggestedAction; }
        public void setSuggestedAction(String suggestedAction) { this.suggestedAction = suggestedAction; }
    }

    public static class LifecycleSummaryResponse {
        private long archivedRecordCount;
        private String latestArchivedAt;
        private long reportStorageTrackedRows;
        private long reportStorageMissingFiles;

        public long getArchivedRecordCount() { return archivedRecordCount; }
        public void setArchivedRecordCount(long archivedRecordCount) { this.archivedRecordCount = archivedRecordCount; }
        public String getLatestArchivedAt() { return latestArchivedAt; }
        public void setLatestArchivedAt(String latestArchivedAt) { this.latestArchivedAt = latestArchivedAt; }
        public long getReportStorageTrackedRows() { return reportStorageTrackedRows; }
        public void setReportStorageTrackedRows(long reportStorageTrackedRows) { this.reportStorageTrackedRows = reportStorageTrackedRows; }
        public long getReportStorageMissingFiles() { return reportStorageMissingFiles; }
        public void setReportStorageMissingFiles(long reportStorageMissingFiles) { this.reportStorageMissingFiles = reportStorageMissingFiles; }
    }

    public static class StorageReconciliationResponse {
        private boolean dryRun;
        private int scannedFiles;
        private int referencedFiles;
        private int missingFiles;
        private int orphanFiles;
        private int deletedOrphanFiles;
        private List<String> sampleMissingFiles = new ArrayList<>();
        private List<String> sampleOrphanFiles = new ArrayList<>();

        public boolean isDryRun() { return dryRun; }
        public void setDryRun(boolean dryRun) { this.dryRun = dryRun; }
        public int getScannedFiles() { return scannedFiles; }
        public void setScannedFiles(int scannedFiles) { this.scannedFiles = scannedFiles; }
        public int getReferencedFiles() { return referencedFiles; }
        public void setReferencedFiles(int referencedFiles) { this.referencedFiles = referencedFiles; }
        public int getMissingFiles() { return missingFiles; }
        public void setMissingFiles(int missingFiles) { this.missingFiles = missingFiles; }
        public int getOrphanFiles() { return orphanFiles; }
        public void setOrphanFiles(int orphanFiles) { this.orphanFiles = orphanFiles; }
        public int getDeletedOrphanFiles() { return deletedOrphanFiles; }
        public void setDeletedOrphanFiles(int deletedOrphanFiles) { this.deletedOrphanFiles = deletedOrphanFiles; }
        public List<String> getSampleMissingFiles() { return sampleMissingFiles; }
        public void setSampleMissingFiles(List<String> sampleMissingFiles) { this.sampleMissingFiles = sampleMissingFiles; }
        public List<String> getSampleOrphanFiles() { return sampleOrphanFiles; }
        public void setSampleOrphanFiles(List<String> sampleOrphanFiles) { this.sampleOrphanFiles = sampleOrphanFiles; }
    }

    public static class LifecycleArchiveSourceStat {
        private String sourceTable;
        private long recordCount;
        private String latestArchivedAt;

        public String getSourceTable() { return sourceTable; }
        public void setSourceTable(String sourceTable) { this.sourceTable = sourceTable; }
        public long getRecordCount() { return recordCount; }
        public void setRecordCount(long recordCount) { this.recordCount = recordCount; }
        public String getLatestArchivedAt() { return latestArchivedAt; }
        public void setLatestArchivedAt(String latestArchivedAt) { this.latestArchivedAt = latestArchivedAt; }
    }

    public static class LifecycleDailyArchivePoint {
        private String day;
        private long archivedCount;

        public String getDay() { return day; }
        public void setDay(String day) { this.day = day; }
        public long getArchivedCount() { return archivedCount; }
        public void setArchivedCount(long archivedCount) { this.archivedCount = archivedCount; }
    }

    public static class LifecycleObservabilityResponse {
        private long totalArchivedRecords;
        private String latestArchivedAt;
        private long archiveLagDays;
        private List<LifecycleArchiveSourceStat> sourceStats = new ArrayList<>();
        private List<LifecycleDailyArchivePoint> dailyTrend = new ArrayList<>();

        public long getTotalArchivedRecords() { return totalArchivedRecords; }
        public void setTotalArchivedRecords(long totalArchivedRecords) { this.totalArchivedRecords = totalArchivedRecords; }
        public String getLatestArchivedAt() { return latestArchivedAt; }
        public void setLatestArchivedAt(String latestArchivedAt) { this.latestArchivedAt = latestArchivedAt; }
        public long getArchiveLagDays() { return archiveLagDays; }
        public void setArchiveLagDays(long archiveLagDays) { this.archiveLagDays = archiveLagDays; }
        public List<LifecycleArchiveSourceStat> getSourceStats() { return sourceStats; }
        public void setSourceStats(List<LifecycleArchiveSourceStat> sourceStats) { this.sourceStats = sourceStats; }
        public List<LifecycleDailyArchivePoint> getDailyTrend() { return dailyTrend; }
        public void setDailyTrend(List<LifecycleDailyArchivePoint> dailyTrend) { this.dailyTrend = dailyTrend; }
    }

    /** Single-school drill-down for platform operators. */
    public static class SchoolDetailResponse {
        private SchoolSummary school;
        private List<SchoolAdminSummary> admins = new ArrayList<>();
        private long parentUserCount;
        /** Placeholder until billing module is wired (same shape for mock/real swap). */
        private String subscriptionPlanCode = "STANDARD";
        private String subscriptionStatus = "ACTIVE";

        public SchoolSummary getSchool() { return school; }
        public void setSchool(SchoolSummary school) { this.school = school; }
        public List<SchoolAdminSummary> getAdmins() { return admins; }
        public void setAdmins(List<SchoolAdminSummary> admins) { this.admins = admins; }
        public long getParentUserCount() { return parentUserCount; }
        public void setParentUserCount(long parentUserCount) { this.parentUserCount = parentUserCount; }
        public String getSubscriptionPlanCode() { return subscriptionPlanCode; }
        public void setSubscriptionPlanCode(String subscriptionPlanCode) { this.subscriptionPlanCode = subscriptionPlanCode; }
        public String getSubscriptionStatus() { return subscriptionStatus; }
        public void setSubscriptionStatus(String subscriptionStatus) { this.subscriptionStatus = subscriptionStatus; }
    }

    public static class PurgeSchoolDataRequest {
        @NotBlank
        private String confirmSchoolCode;

        public String getConfirmSchoolCode() { return confirmSchoolCode; }
        public void setConfirmSchoolCode(String confirmSchoolCode) { this.confirmSchoolCode = confirmSchoolCode; }
    }

    public static class PurgeJobSummary {
        private Long id;
        private String tenantId;
        private String schoolCode;
        private String schoolName;
        private String status;
        private String errorMessage;
        private Integer rowsDeletedEstimate;
        private Long executionDurationMs;
        private Long requestedByUserId;
        private String requestedByRole;
        private String requestedByPrincipal;
        private String requestedByDisplayName;
        private Long executedByUserId;
        private String executedByRole;
        private String executedByPrincipal;
        private String executedByDisplayName;
        private Long affectedStudents;
        private Long affectedTeachers;
        private Long affectedAdmins;
        private Long affectedParentAccounts;
        private String createdAt;
        private String startedAt;
        private String completedAt;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getTenantId() { return tenantId; }
        public void setTenantId(String tenantId) { this.tenantId = tenantId; }
        public String getSchoolCode() { return schoolCode; }
        public void setSchoolCode(String schoolCode) { this.schoolCode = schoolCode; }
        public String getSchoolName() { return schoolName; }
        public void setSchoolName(String schoolName) { this.schoolName = schoolName; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
        public Integer getRowsDeletedEstimate() { return rowsDeletedEstimate; }
        public void setRowsDeletedEstimate(Integer rowsDeletedEstimate) { this.rowsDeletedEstimate = rowsDeletedEstimate; }
        public Long getExecutionDurationMs() { return executionDurationMs; }
        public void setExecutionDurationMs(Long executionDurationMs) { this.executionDurationMs = executionDurationMs; }
        public Long getRequestedByUserId() { return requestedByUserId; }
        public void setRequestedByUserId(Long requestedByUserId) { this.requestedByUserId = requestedByUserId; }
        public String getRequestedByRole() { return requestedByRole; }
        public void setRequestedByRole(String requestedByRole) { this.requestedByRole = requestedByRole; }
        public String getRequestedByPrincipal() { return requestedByPrincipal; }
        public void setRequestedByPrincipal(String requestedByPrincipal) { this.requestedByPrincipal = requestedByPrincipal; }
        public String getRequestedByDisplayName() { return requestedByDisplayName; }
        public void setRequestedByDisplayName(String requestedByDisplayName) { this.requestedByDisplayName = requestedByDisplayName; }
        public Long getExecutedByUserId() { return executedByUserId; }
        public void setExecutedByUserId(Long executedByUserId) { this.executedByUserId = executedByUserId; }
        public String getExecutedByRole() { return executedByRole; }
        public void setExecutedByRole(String executedByRole) { this.executedByRole = executedByRole; }
        public String getExecutedByPrincipal() { return executedByPrincipal; }
        public void setExecutedByPrincipal(String executedByPrincipal) { this.executedByPrincipal = executedByPrincipal; }
        public String getExecutedByDisplayName() { return executedByDisplayName; }
        public void setExecutedByDisplayName(String executedByDisplayName) { this.executedByDisplayName = executedByDisplayName; }
        public Long getAffectedStudents() { return affectedStudents; }
        public void setAffectedStudents(Long affectedStudents) { this.affectedStudents = affectedStudents; }
        public Long getAffectedTeachers() { return affectedTeachers; }
        public void setAffectedTeachers(Long affectedTeachers) { this.affectedTeachers = affectedTeachers; }
        public Long getAffectedAdmins() { return affectedAdmins; }
        public void setAffectedAdmins(Long affectedAdmins) { this.affectedAdmins = affectedAdmins; }
        public Long getAffectedParentAccounts() { return affectedParentAccounts; }
        public void setAffectedParentAccounts(Long affectedParentAccounts) { this.affectedParentAccounts = affectedParentAccounts; }
        public String getCreatedAt() { return createdAt; }
        public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
        public String getStartedAt() { return startedAt; }
        public void setStartedAt(String startedAt) { this.startedAt = startedAt; }
        public String getCompletedAt() { return completedAt; }
        public void setCompletedAt(String completedAt) { this.completedAt = completedAt; }
    }

    public static class PlatformBroadcastRequest {
        /** When null or blank, fan-out to every non-deleted school workspace. */
        private String targetTenantId;
        @NotBlank
        private String title;
        @NotBlank
        private String message;
        /** INFO, WARNING, SUCCESS, ERROR */
        private String notificationType = "INFO";

        public String getTargetTenantId() { return targetTenantId; }
        public void setTargetTenantId(String targetTenantId) { this.targetTenantId = targetTenantId; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getNotificationType() { return notificationType; }
        public void setNotificationType(String notificationType) { this.notificationType = notificationType; }
    }

    public static class PlatformBroadcastResult {
        private int notificationRowsCreated;
        private int tenantWorkspacesReached;

        public PlatformBroadcastResult() {}

        public PlatformBroadcastResult(int notificationRowsCreated, int tenantWorkspacesReached) {
            this.notificationRowsCreated = notificationRowsCreated;
            this.tenantWorkspacesReached = tenantWorkspacesReached;
        }

        public int getNotificationRowsCreated() { return notificationRowsCreated; }
        public void setNotificationRowsCreated(int notificationRowsCreated) { this.notificationRowsCreated = notificationRowsCreated; }
        public int getTenantWorkspacesReached() { return tenantWorkspacesReached; }
        public void setTenantWorkspacesReached(int tenantWorkspacesReached) { this.tenantWorkspacesReached = tenantWorkspacesReached; }
    }

    public static class SubscriptionPlanRow {
        private String code;
        private String name;
        private String description;
        private int monthlyPriceMinorUnits;
        private String currency;
        private List<String> highlights = new ArrayList<>();
        /** Human-readable cap, e.g. "Up to 300" or "Custom / unlimited". */
        private String maxStudentsLabel;
        private String supportTier;
        private String billingCadence = "Monthly";
        /** Product modules included (academics, fees, transport, …). */
        private List<String> modules = new ArrayList<>();
        private boolean recommended;
        /** Longer commercial / GTM copy for operator detail drawer (optional). */
        private String commercialNotes;
        /** Placeholder for billing integration key (e.g. Stripe price id) until invoicing service owns catalog. */
        private String integrationPriceKey;

        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public int getMonthlyPriceMinorUnits() { return monthlyPriceMinorUnits; }
        public void setMonthlyPriceMinorUnits(int monthlyPriceMinorUnits) { this.monthlyPriceMinorUnits = monthlyPriceMinorUnits; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public List<String> getHighlights() { return highlights; }
        public void setHighlights(List<String> highlights) { this.highlights = highlights; }
        public String getMaxStudentsLabel() { return maxStudentsLabel; }
        public void setMaxStudentsLabel(String maxStudentsLabel) { this.maxStudentsLabel = maxStudentsLabel; }
        public String getSupportTier() { return supportTier; }
        public void setSupportTier(String supportTier) { this.supportTier = supportTier; }
        public String getBillingCadence() { return billingCadence; }
        public void setBillingCadence(String billingCadence) { this.billingCadence = billingCadence; }
        public List<String> getModules() { return modules; }
        public void setModules(List<String> modules) { this.modules = modules; }
        public boolean isRecommended() { return recommended; }
        public void setRecommended(boolean recommended) { this.recommended = recommended; }
        public String getCommercialNotes() { return commercialNotes; }
        public void setCommercialNotes(String commercialNotes) { this.commercialNotes = commercialNotes; }
        public String getIntegrationPriceKey() { return integrationPriceKey; }
        public void setIntegrationPriceKey(String integrationPriceKey) { this.integrationPriceKey = integrationPriceKey; }
    }

    /**
     * Request to clear cache. When {@code regions} is empty, every {@link com.school.erp.cache.CacheService.CacheRegion}
     * is cleared (including {@code tenantFeatureFlags}).
     * <p><strong>Tenant id caveat:</strong> Spring Cache does not expose key iteration; when {@code tenantId} is set,
     * With {@code tenantId}: only that school's cache entries are removed (Redis key pattern per tenant).
     */
    public static class CacheClearRequest {
        /** Optional tenant ID — when set, only this school's keys are evicted in the chosen region(s). */
        private String tenantId;
        /** Optional region names (e.g. {@code dashboardSnapshots}) — if null/empty, clears all regions. */
        private List<String> regions;

        public CacheClearRequest() {}

        public CacheClearRequest(String tenantId, List<String> regions) {
            this.tenantId = tenantId;
            this.regions = regions;
        }

        public String getTenantId() { return tenantId; }
        public void setTenantId(String tenantId) { this.tenantId = tenantId; }
        public List<String> getRegions() { return regions; }
        public void setRegions(List<String> regions) { this.regions = regions; }
    }

    public static class CacheClearResponse {
        private boolean success;
        private String message;
        private CacheStatistics statistics;

        public CacheClearResponse() {}

        public CacheClearResponse(boolean success, String message, CacheStatistics statistics) {
            this.success = success;
            this.message = message;
            this.statistics = statistics;
        }

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public CacheStatistics getStatistics() { return statistics; }
        public void setStatistics(CacheStatistics statistics) { this.statistics = statistics; }
    }

    public static class CacheStatistics {
        private int regionsCleared;
        private List<String> clearedRegions;
        private String clearedAt;
        private String clearedBy;
        /** Tenant ID if scoped to one school, null if global. */
        private String targetTenantId;
        /** School name for UI display when tenant-scoped. */
        private String targetSchoolName;
        /** Approximate Redis keys removed (tenant-scoped clears only; null for global region clears). */
        private Long keysEvicted;
        /** Regions that failed to clear in this request (partial success if non-empty). */
        private List<String> failedRegions;

        public CacheStatistics() {}

        public CacheStatistics(int regionsCleared, List<String> clearedRegions, String clearedAt, String clearedBy) {
            this.regionsCleared = regionsCleared;
            this.clearedRegions = clearedRegions;
            this.clearedAt = clearedAt;
            this.clearedBy = clearedBy;
        }

        public int getRegionsCleared() { return regionsCleared; }
        public void setRegionsCleared(int regionsCleared) { this.regionsCleared = regionsCleared; }
        public List<String> getClearedRegions() { return clearedRegions; }
        public void setClearedRegions(List<String> clearedRegions) { this.clearedRegions = clearedRegions; }
        public String getClearedAt() { return clearedAt; }
        public void setClearedAt(String clearedAt) { this.clearedAt = clearedAt; }
        public String getClearedBy() { return clearedBy; }
        public void setClearedBy(String clearedBy) { this.clearedBy = clearedBy; }
        public String getTargetTenantId() { return targetTenantId; }
        public void setTargetTenantId(String targetTenantId) { this.targetTenantId = targetTenantId; }
        public String getTargetSchoolName() { return targetSchoolName; }
        public void setTargetSchoolName(String targetSchoolName) { this.targetSchoolName = targetSchoolName; }
        public Long getKeysEvicted() { return keysEvicted; }
        public void setKeysEvicted(Long keysEvicted) { this.keysEvicted = keysEvicted; }
        public List<String> getFailedRegions() { return failedRegions; }
        public void setFailedRegions(List<String> failedRegions) { this.failedRegions = failedRegions; }
    }
}
