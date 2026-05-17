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
@Table(name = "marketing_leads", indexes = {
        @Index(name = "idx_marketing_lead_status", columnList = "status"),
        @Index(name = "idx_marketing_lead_created", columnList = "created_at")
})
public class MarketingLead {
    @Id
    @Column(length = 36, nullable = false, columnDefinition = "CHAR(36)")
    private String id;

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;
    @Column(name = "work_email", nullable = false, length = 180)
    private String workEmail;
    @Column(length = 30)
    private String phone;
    @Column(name = "school_name", length = 180)
    private String schoolName;
    @Column(length = 80)
    private String role;
    @Column(name = "student_strength_range", length = 40)
    private String studentStrengthRange;
    @Column(length = 80)
    private String city;
    @Column(length = 80)
    private String country;
    @Column(length = 2000)
    private String message;
    @Column(name = "preferred_contact_time", length = 60)
    private String preferredContactTime;
    @Column(nullable = false, length = 20)
    private String source;
    @Column(name = "utm_source", length = 80)
    private String utmSource;
    @Column(name = "utm_medium", length = 80)
    private String utmMedium;
    @Column(name = "utm_campaign", length = 80)
    private String utmCampaign;
    @Column(name = "page_path", length = 200)
    private String pagePath;
    @Column(nullable = false, length = 20)
    private String status;
    @Column(name = "privacy_consent", nullable = false)
    private Boolean privacyConsent;
    @Column(name = "marketing_consent", nullable = false)
    private Boolean marketingConsent;
    @Column(name = "ip_hash", length = 64)
    private String ipHash;
    @Column(name = "user_agent", length = 400)
    private String userAgent;
    @Column(length = 4000)
    private String notes;
    @Column(name = "idempotency_key", unique = true, length = 80)
    private String idempotencyKey;
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
