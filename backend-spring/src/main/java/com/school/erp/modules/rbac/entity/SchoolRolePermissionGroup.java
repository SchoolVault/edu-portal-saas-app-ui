package com.school.erp.modules.rbac.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/** Junction: which {@link PermissionGroup}s compose a {@link SchoolRole}. */
@Entity
@Table(
        name = "rbac_school_role_permission_group",
        uniqueConstraints =
                @UniqueConstraint(name = "uq_rbac_sr_pg", columnNames = {"school_role_id", "permission_group_id"}))
public class SchoolRolePermissionGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "school_role_id", nullable = false)
    private SchoolRole schoolRole;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "permission_group_id", nullable = false)
    private PermissionGroup permissionGroup;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public Long getId() {
        return id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public SchoolRole getSchoolRole() {
        return schoolRole;
    }

    public void setSchoolRole(SchoolRole schoolRole) {
        this.schoolRole = schoolRole;
    }

    public PermissionGroup getPermissionGroup() {
        return permissionGroup;
    }

    public void setPermissionGroup(PermissionGroup permissionGroup) {
        this.permissionGroup = permissionGroup;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
