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
@Table(name = "marketing_videos", indexes = {
        @Index(name = "idx_marketing_video_published", columnList = "published"),
        @Index(name = "idx_marketing_video_order", columnList = "display_order")
})
public class MarketingVideo {
    @Id
    @Column(length = 36, nullable = false, columnDefinition = "CHAR(36)")
    private String id;

    @Column(nullable = false, unique = true, length = 120)
    private String slug;
    @Column(nullable = false, length = 220)
    private String title;
    @Column(length = 1000)
    private String summary;
    @Column(name = "youtube_url", nullable = false, length = 600)
    private String youtubeUrl;
    @Column(name = "thumbnail_url", length = 600)
    private String thumbnailUrl;
    @Column(length = 80)
    private String category;
    @Column(length = 500)
    private String tags;
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
