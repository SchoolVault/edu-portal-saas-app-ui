package com.school.erp.modules.platform.dto;

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
}
