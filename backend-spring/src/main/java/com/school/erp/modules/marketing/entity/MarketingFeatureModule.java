package com.school.erp.modules.marketing.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "marketing_feature_modules", indexes = {
        @Index(name = "idx_marketing_feature_category", columnList = "category"),
        @Index(name = "idx_marketing_feature_sort", columnList = "sort_order")
})
public class MarketingFeatureModule {
    @Id
    @Column(length = 36, nullable = false, columnDefinition = "CHAR(36)")
    private String id;

    @Column(nullable = false, unique = true, length = 80)
    private String slug;
    @Column(nullable = false, length = 120)
    private String name;
    @Column(nullable = false, length = 60)
    private String category;
    @Column(name = "short_description", nullable = false, length = 280)
    private String shortDescription;
    @Column(name = "detailed_description", columnDefinition = "LONGTEXT")
    private String detailedDescription;
    @Column(length = 1000)
    private String highlights;
    @Column(name = "enabled_for_marketing", nullable = false)
    private Boolean enabledForMarketing;
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;
    @Column(nullable = false, length = 20)
    private String status;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }
        final LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
