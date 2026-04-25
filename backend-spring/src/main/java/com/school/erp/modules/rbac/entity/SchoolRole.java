package com.school.erp.modules.rbac.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * A named bundle of {@link com.school.erp.security.rbac.AppPermission} codes (CSV) for one tenant.
 * Users receive effective permissions as the union of all assigned school roles.
 */
@Entity
@Table(
        name = "rbac_school_role",
        uniqueConstraints = @UniqueConstraint(name = "uq_rbac_school_role_tenant_code", columnNames = {"tenant_id", "code"}))
public class SchoolRole extends BaseEntity {

    @Column(name = "code", nullable = false, length = 64)
    private String code;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "system_role")
    private Boolean systemRole = false;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "permissions_csv", nullable = false, columnDefinition = "TEXT")
    private String permissionsCsv;

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getSystemRole() {
        return systemRole;
    }

    public void setSystemRole(Boolean systemRole) {
        this.systemRole = systemRole;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public String getPermissionsCsv() {
        return permissionsCsv;
    }

    public void setPermissionsCsv(String permissionsCsv) {
        this.permissionsCsv = permissionsCsv;
    }
}
