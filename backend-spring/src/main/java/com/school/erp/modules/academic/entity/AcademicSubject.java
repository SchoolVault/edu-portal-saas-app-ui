package com.school.erp.modules.academic.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "academic_subjects",
        uniqueConstraints = @UniqueConstraint(name = "uk_academic_subject_tenant_name", columnNames = {"tenant_id", "name"}),
        indexes = {@Index(name = "idx_academic_subject_tenant", columnList = "tenant_id, is_deleted, sort_order")})
public class AcademicSubject extends BaseEntity {

    @Column(length = 40)
    private String code;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 50)
    private String category;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    public String getCode() {
        return code;
    }

    public void setCode(final String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(final String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(final String category) {
        this.category = category;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(final Integer sortOrder) {
        this.sortOrder = sortOrder;
    }
}
