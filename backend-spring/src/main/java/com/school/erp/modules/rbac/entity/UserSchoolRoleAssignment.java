package com.school.erp.modules.rbac.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Links a {@link com.school.erp.modules.auth.entity.User} to a school {@link SchoolRole} within a tenant.
 */
@Entity
@Table(
        name = "rbac_user_school_role",
        uniqueConstraints = @UniqueConstraint(name = "uq_rbac_user_school_role", columnNames = {"tenant_id", "user_id", "school_role_id"}))
public class UserSchoolRoleAssignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "school_role_id", nullable = false)
    private SchoolRole schoolRole;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    public Long getId() {
        return id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public SchoolRole getSchoolRole() {
        return schoolRole;
    }

    public void setSchoolRole(SchoolRole schoolRole) {
        this.schoolRole = schoolRole;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
