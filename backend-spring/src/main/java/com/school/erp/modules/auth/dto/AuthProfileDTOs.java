package com.school.erp.modules.auth.dto;

public class AuthProfileDTOs {

    public static class ProfileSummaryResponse {
        private Long id;
        private String name;
        private String email;
        private String phone;
        private String role;
        private String tenantId;
        private String avatar;
        private String schoolName;
        private String schoolCode;
        private String schoolEmail;
        private String schoolPhone;
        private String schoolAddress;
        private String primaryColor;
        private String secondaryColor;
        private String userTitle;
        private String qualification;
        private String specialization;
        private long childCount;
        private long assignedClassCount;
        private long subjectCount;
        private long managedStudentCount;
        private long managedTeacherCount;
        /** Populated for SUPER_ADMIN: active (non-deleted) school workspaces. */
        private int platformWorkspaceCount;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getTenantId() { return tenantId; }
        public void setTenantId(String tenantId) { this.tenantId = tenantId; }
        public String getAvatar() { return avatar; }
        public void setAvatar(String avatar) { this.avatar = avatar; }
        public String getSchoolName() { return schoolName; }
        public void setSchoolName(String schoolName) { this.schoolName = schoolName; }
        public String getSchoolCode() { return schoolCode; }
        public void setSchoolCode(String schoolCode) { this.schoolCode = schoolCode; }
        public String getSchoolEmail() { return schoolEmail; }
        public void setSchoolEmail(String schoolEmail) { this.schoolEmail = schoolEmail; }
        public String getSchoolPhone() { return schoolPhone; }
        public void setSchoolPhone(String schoolPhone) { this.schoolPhone = schoolPhone; }
        public String getSchoolAddress() { return schoolAddress; }
        public void setSchoolAddress(String schoolAddress) { this.schoolAddress = schoolAddress; }
        public String getPrimaryColor() { return primaryColor; }
        public void setPrimaryColor(String primaryColor) { this.primaryColor = primaryColor; }
        public String getSecondaryColor() { return secondaryColor; }
        public void setSecondaryColor(String secondaryColor) { this.secondaryColor = secondaryColor; }
        public String getUserTitle() { return userTitle; }
        public void setUserTitle(String userTitle) { this.userTitle = userTitle; }
        public String getQualification() { return qualification; }
        public void setQualification(String qualification) { this.qualification = qualification; }
        public String getSpecialization() { return specialization; }
        public void setSpecialization(String specialization) { this.specialization = specialization; }
        public long getChildCount() { return childCount; }
        public void setChildCount(long childCount) { this.childCount = childCount; }
        public long getAssignedClassCount() { return assignedClassCount; }
        public void setAssignedClassCount(long assignedClassCount) { this.assignedClassCount = assignedClassCount; }
        public long getSubjectCount() { return subjectCount; }
        public void setSubjectCount(long subjectCount) { this.subjectCount = subjectCount; }
        public long getManagedStudentCount() { return managedStudentCount; }
        public void setManagedStudentCount(long managedStudentCount) { this.managedStudentCount = managedStudentCount; }
        public long getManagedTeacherCount() { return managedTeacherCount; }
        public void setManagedTeacherCount(long managedTeacherCount) { this.managedTeacherCount = managedTeacherCount; }
        public int getPlatformWorkspaceCount() { return platformWorkspaceCount; }
        public void setPlatformWorkspaceCount(int platformWorkspaceCount) { this.platformWorkspaceCount = platformWorkspaceCount; }
    }
}
