package com.school.erp.modules.communication.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.entity.AcademicYearScopedEntity;
import com.school.erp.common.entity.AcademicYearScopeGuardListener;
import com.school.erp.common.enums.Enums;
import com.school.erp.modules.communication.domain.CommunicationEventStatus;
import com.school.erp.modules.communication.domain.CommunicationEventType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.Filter;
import org.hibernate.type.SqlTypes;
import com.school.erp.tenant.hibernate.AcademicYearScopedFilter;

@Entity
@EntityListeners(AcademicYearScopeGuardListener.class)
@Filter(name = AcademicYearScopedFilter.NAME, condition = "academic_year_id = :academicYearId")
@Table(name = "communication_events", indexes = {
        @Index(name = "idx_comm_evt_tenant_status_start", columnList = "tenant_id,status,event_start_at"),
        @Index(name = "idx_comm_evt_tenant_aud_start", columnList = "tenant_id,audience_scope,event_start_at"),
        @Index(name = "idx_comm_evt_tenant_publish_status", columnList = "tenant_id,publish_at,status")
})
public class CommunicationEvent extends BaseEntity implements AcademicYearScopedEntity {
    @Column(name = "academic_year_id", nullable = false)
    private Long academicYearId;
    @Override
    public Long getAcademicYearId() {
        return academicYearId;
    }

    @Override
    public void setAcademicYearId(Long academicYearId) {
        this.academicYearId = academicYearId;
    }

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "event_type", nullable = false, length = 40)
    private CommunicationEventType eventType;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "audience_scope", nullable = false, length = 20)
    private Enums.TargetAudience audienceScope;

    @Column(name = "target_class_id")
    private Long targetClassId;

    @Column(name = "target_section_id")
    private Long targetSectionId;

    @Column(name = "publish_at")
    private LocalDateTime publishAt;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "event_start_at", nullable = false)
    private LocalDateTime eventStartAt;

    @Column(name = "event_end_at")
    private LocalDateTime eventEndAt;

    @Column(nullable = false, length = 60)
    private String timezone;

    @Column(length = 200)
    private String location;

    @Column(name = "locale_code", nullable = false, length = 10)
    private String localeCode;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private CommunicationEventStatus status;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "reminder_1d_sent_at")
    private LocalDateTime reminder1dSentAt;

    @Column(name = "reminder_1h_sent_at")
    private LocalDateTime reminder1hSentAt;

    @Column(name = "published_campaign_id", length = 80)
    private String publishedCampaignId;

    @Column(name = "reminder_1d_campaign_id", length = 80)
    private String reminder1dCampaignId;

    @Column(name = "reminder_1h_campaign_id", length = 80)
    private String reminder1hCampaignId;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public CommunicationEventType getEventType() {
        return eventType;
    }

    public void setEventType(CommunicationEventType eventType) {
        this.eventType = eventType;
    }

    public Enums.TargetAudience getAudienceScope() {
        return audienceScope;
    }

    public void setAudienceScope(Enums.TargetAudience audienceScope) {
        this.audienceScope = audienceScope;
    }

    public Long getTargetClassId() {
        return targetClassId;
    }

    public void setTargetClassId(Long targetClassId) {
        this.targetClassId = targetClassId;
    }

    public Long getTargetSectionId() {
        return targetSectionId;
    }

    public void setTargetSectionId(Long targetSectionId) {
        this.targetSectionId = targetSectionId;
    }

    public LocalDateTime getPublishAt() {
        return publishAt;
    }

    public void setPublishAt(LocalDateTime publishAt) {
        this.publishAt = publishAt;
    }

    public LocalDateTime getEventStartAt() {
        return eventStartAt;
    }

    public void setEventStartAt(LocalDateTime eventStartAt) {
        this.eventStartAt = eventStartAt;
    }

    public LocalDateTime getEventEndAt() {
        return eventEndAt;
    }

    public void setEventEndAt(LocalDateTime eventEndAt) {
        this.eventEndAt = eventEndAt;
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(LocalDateTime publishedAt) {
        this.publishedAt = publishedAt;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getLocaleCode() {
        return localeCode;
    }

    public void setLocaleCode(String localeCode) {
        this.localeCode = localeCode;
    }

    public CommunicationEventStatus getStatus() {
        return status;
    }

    public void setStatus(CommunicationEventStatus status) {
        this.status = status;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public LocalDateTime getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(LocalDateTime cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public LocalDateTime getReminder1dSentAt() {
        return reminder1dSentAt;
    }

    public void setReminder1dSentAt(LocalDateTime reminder1dSentAt) {
        this.reminder1dSentAt = reminder1dSentAt;
    }

    public LocalDateTime getReminder1hSentAt() {
        return reminder1hSentAt;
    }

    public void setReminder1hSentAt(LocalDateTime reminder1hSentAt) {
        this.reminder1hSentAt = reminder1hSentAt;
    }

    public String getPublishedCampaignId() {
        return publishedCampaignId;
    }

    public void setPublishedCampaignId(String publishedCampaignId) {
        this.publishedCampaignId = publishedCampaignId;
    }

    public String getReminder1dCampaignId() {
        return reminder1dCampaignId;
    }

    public void setReminder1dCampaignId(String reminder1dCampaignId) {
        this.reminder1dCampaignId = reminder1dCampaignId;
    }

    public String getReminder1hCampaignId() {
        return reminder1hCampaignId;
    }

    public void setReminder1hCampaignId(String reminder1hCampaignId) {
        this.reminder1hCampaignId = reminder1hCampaignId;
    }
}
