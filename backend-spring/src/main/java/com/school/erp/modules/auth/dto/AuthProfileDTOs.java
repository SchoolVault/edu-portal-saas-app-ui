package com.school.erp.modules.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

public class AuthProfileDTOs {

    /** Classes where the current teacher is assigned as class teacher (directory / photo policy). */
    public static class ClassTeacherAssignment {
        private String classId;
        private String className;
        private String sectionId;
        private String sectionName;
        private long totalStudents;

        public String getClassId() { return classId; }
        public void setClassId(String classId) { this.classId = classId; }
        public String getClassName() { return className; }
        public void setClassName(String className) { this.className = className; }
        public String getSectionId() { return sectionId; }
        public void setSectionId(String sectionId) { this.sectionId = sectionId; }
        public String getSectionName() { return sectionName; }
        public void setSectionName(String sectionName) { this.sectionName = sectionName; }
        public long getTotalStudents() { return totalStudents; }
        public void setTotalStudents(long totalStudents) { this.totalStudents = totalStudents; }
    }

    /** Role-scoped stats use {@link Long} so unset fields are omitted from JSON (avoids misleading zeros for parents). */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ProfileSummaryResponse {
        private Long id;
        private String name;
        private String email;
        private String phone;
        private String role;
        private String tenantId;
        private String avatar;
        private String interfaceLocale;
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
        private Long childCount;
        private Long assignedClassCount;
        /** Distinct students across timetable-linked classes (timetable scope). */
        private Long assignedStudentCount;
        private Long subjectCount;
        private Long managedStudentCount;
        private Long managedTeacherCount;
        /** Populated for SUPER_ADMIN: active (non-deleted) school workspaces. */
        private int platformWorkspaceCount;
        /** Populated for TEACHER: classes where this teacher is the class teacher. */
        private List<ClassTeacherAssignment> classTeacherOf;
        /** TEACHER: primary subject line for shell (first listed subject, else specialization). */
        private String primaryTeachingSubject;

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
        public String getInterfaceLocale() { return interfaceLocale; }
        public void setInterfaceLocale(String interfaceLocale) { this.interfaceLocale = interfaceLocale; }
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
        public Long getChildCount() { return childCount; }
        public void setChildCount(Long childCount) { this.childCount = childCount; }
        public Long getAssignedClassCount() { return assignedClassCount; }
        public void setAssignedClassCount(Long assignedClassCount) { this.assignedClassCount = assignedClassCount; }
        public Long getAssignedStudentCount() { return assignedStudentCount; }
        public void setAssignedStudentCount(Long assignedStudentCount) { this.assignedStudentCount = assignedStudentCount; }
        public Long getSubjectCount() { return subjectCount; }
        public void setSubjectCount(Long subjectCount) { this.subjectCount = subjectCount; }
        public Long getManagedStudentCount() { return managedStudentCount; }
        public void setManagedStudentCount(Long managedStudentCount) { this.managedStudentCount = managedStudentCount; }
        public Long getManagedTeacherCount() { return managedTeacherCount; }
        public void setManagedTeacherCount(Long managedTeacherCount) { this.managedTeacherCount = managedTeacherCount; }
        public int getPlatformWorkspaceCount() { return platformWorkspaceCount; }
        public void setPlatformWorkspaceCount(int platformWorkspaceCount) { this.platformWorkspaceCount = platformWorkspaceCount; }
        public List<ClassTeacherAssignment> getClassTeacherOf() { return classTeacherOf; }
        public void setClassTeacherOf(List<ClassTeacherAssignment> classTeacherOf) { this.classTeacherOf = classTeacherOf; }

        public String getPrimaryTeachingSubject() { return primaryTeachingSubject; }
        public void setPrimaryTeachingSubject(String primaryTeachingSubject) { this.primaryTeachingSubject = primaryTeachingSubject; }
    }
}
