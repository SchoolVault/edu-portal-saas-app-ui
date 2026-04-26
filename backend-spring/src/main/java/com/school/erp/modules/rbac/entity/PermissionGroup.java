package com.school.erp.modules.rbac.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/** Tenant-scoped named bundle of {@code AppPermission} codes, linkable to one or more {@link SchoolRole}s. */
@Entity
@Table(
        name = "rbac_permission_group",
        uniqueConstraints =
                @UniqueConstraint(name = "uq_rbac_pg_tenant_code", columnNames = {"tenant_id", "code"}))
public class PermissionGroup extends BaseEntity {

    @Column(name = "code", nullable = false, length = 64)
    private String code;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "system_template")
    private Boolean systemTemplate = false;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

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

    public Boolean getSystemTemplate() {
        return systemTemplate;
    }

    public void setSystemTemplate(Boolean systemTemplate) {
        this.systemTemplate = systemTemplate;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }
}
