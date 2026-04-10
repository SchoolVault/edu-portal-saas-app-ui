package com.school.erp.modules.operations.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "operational_staff",
        indexes = {
                @Index(name = "idx_ops_staff_tenant_role", columnList = "tenant_id, staff_role"),
                @Index(name = "idx_ops_staff_user", columnList = "tenant_id, user_id")
        })
public class OperationalStaff extends BaseEntity {

    @Column(name = "staff_role", nullable = false, length = 40)
    private String staffRole;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(length = 40)
    private String phone;

    @Column(length = 120)
    private String email;

    @Column(name = "employee_code", length = 64)
    private String employeeCode;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "transport_route_id")
    private Long transportRouteId;

    @Column(length = 500)
    private String notes;

    public String getStaffRole() {
        return staffRole;
    }

    public void setStaffRole(String staffRole) {
        this.staffRole = staffRole;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
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

    public String getEmployeeCode() {
        return employeeCode;
    }

    public void setEmployeeCode(String employeeCode) {
        this.employeeCode = employeeCode;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getTransportRouteId() {
        return transportRouteId;
    }

    public void setTransportRouteId(Long transportRouteId) {
        this.transportRouteId = transportRouteId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
