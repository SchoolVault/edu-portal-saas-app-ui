package com.school.erp.modules.platform.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.ArrayList;
import java.util.List;

public class PlatformDTOs {

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

        public String getCheckedAt() { return checkedAt; }
        public void setCheckedAt(String checkedAt) { this.checkedAt = checkedAt; }
        public JvmMemory getJvm() { return jvm; }
        public void setJvm(JvmMemory jvm) { this.jvm = jvm; }
        public DiskSpace getDisk() { return disk; }
        public void setDisk(DiskSpace disk) { this.disk = disk; }
        public List<ComponentHealth> getComponents() { return components; }
        public void setComponents(List<ComponentHealth> components) { this.components = components; }
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
        private String status;
        private String errorMessage;
        private Integer rowsDeletedEstimate;
        private String createdAt;
        private String startedAt;
        private String completedAt;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getTenantId() { return tenantId; }
        public void setTenantId(String tenantId) { this.tenantId = tenantId; }
        public String getSchoolCode() { return schoolCode; }
        public void setSchoolCode(String schoolCode) { this.schoolCode = schoolCode; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
        public Integer getRowsDeletedEstimate() { return rowsDeletedEstimate; }
        public void setRowsDeletedEstimate(Integer rowsDeletedEstimate) { this.rowsDeletedEstimate = rowsDeletedEstimate; }
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
    }
}
