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
@Table(name = "marketing_testimonials", indexes = {
        @Index(name = "idx_marketing_testimonial_published", columnList = "published"),
        @Index(name = "idx_marketing_testimonial_order", columnList = "display_order")
})
public class MarketingTestimonial {
    @Id
    @Column(length = 36, nullable = false, columnDefinition = "CHAR(36)")
    private String id;

    @Column(nullable = false, length = 120)
    private String name;
    @Column(length = 120)
    private String designation;
    @Column(length = 180)
    private String institution;
    @Column(nullable = false, length = 1500)
    private String quote;
    @Column(nullable = false)
    private Integer rating;
    @Column(name = "avatar_url", length = 400)
    private String avatarUrl;
    @Column(nullable = false)
    private Boolean featured;
    @Column(nullable = false)
    private Boolean published;
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;
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
