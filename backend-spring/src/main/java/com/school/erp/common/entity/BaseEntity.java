package com.school.erp.common.entity;

import com.school.erp.tenant.hibernate.TenantScopedFilter;
import jakarta.persistence.*;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.time.LocalDateTime;

/**
 * All concrete entities inherit {@code tenant_id}. Hibernate filter {@value TenantScopedFilter#NAME} is applied
 * automatically per transaction (see {@link com.school.erp.tenant.hibernate.TenantAwareJpaTransactionManager})
 * except for platform {@code SUPER_ADMIN}. Explicit repository tenant predicates remain the primary contract.
 */
@FilterDef(name = TenantScopedFilter.NAME, parameters = @ParamDef(name = "tenantId", type = String.class))
@Filter(name = TenantScopedFilter.NAME, condition = "tenant_id = :tenantId")
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;
    @Column(name = "is_active")
    private Boolean isActive = true;
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    @Column(name = "created_by", length = 100)
    private String createdBy;
    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    public Long getId() {
        return this.id;
    }

    public String getTenantId() {
        return this.tenantId;
    }

    public Boolean getIsActive() {
        return this.isActive;
    }

    public Boolean getIsDeleted() {
        return this.isDeleted;
    }

    public LocalDateTime getCreatedAt() {
        return this.createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return this.updatedAt;
    }

    public String getCreatedBy() {
        return this.createdBy;
    }

    public String getUpdatedBy() {
        return this.updatedBy;
    }

    public void setId(final Long id) {
        this.id = id;
    }

    public void setTenantId(final String tenantId) {
        this.tenantId = tenantId;
    }

    public void setIsActive(final Boolean isActive) {
        this.isActive = isActive;
    }

    public void setIsDeleted(final Boolean isDeleted) {
        this.isDeleted = isDeleted;
    }

    public void setCreatedAt(final LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(final LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public void setCreatedBy(final String createdBy) {
        this.createdBy = createdBy;
    }

    public void setUpdatedBy(final String updatedBy) {
        this.updatedBy = updatedBy;
    }
}
