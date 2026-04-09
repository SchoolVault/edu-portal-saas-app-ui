package com.school.erp.modules.settings.dto;

/**
 * Read-only branch summary for schools sharing the same school code (multi-campus).
 */
public class SchoolBranchDTO {
    private String tenantId;
    private String schoolName;
    private String schoolCode;
    private String address;
    private String phone;
    private String email;
    private boolean currentTenant;

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getSchoolName() {
        return schoolName;
    }

    public void setSchoolName(String schoolName) {
        this.schoolName = schoolName;
    }

    public String getSchoolCode() {
        return schoolCode;
    }

    public void setSchoolCode(String schoolCode) {
        this.schoolCode = schoolCode;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public boolean isCurrentTenant() {
        return currentTenant;
    }

    public void setCurrentTenant(boolean currentTenant) {
        this.currentTenant = currentTenant;
    }
}
