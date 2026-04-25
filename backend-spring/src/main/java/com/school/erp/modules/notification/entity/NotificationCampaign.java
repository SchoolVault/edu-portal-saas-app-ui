package com.school.erp.modules.notification.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "notification_campaign",
        indexes = {
                @Index(name = "idx_nc_tenant_created", columnList = "tenant_id, created_at"),
                @Index(name = "idx_nc_tenant_campaign", columnList = "tenant_id, campaign_id")
        })
public class NotificationCampaign extends BaseEntity {
    @Column(name = "campaign_id", nullable = false, length = 80)
    private String campaignId;
    @Column(nullable = false, length = 200)
    private String title;
    @Column(name = "event_type", nullable = false, length = 80)
    private String eventType;
    @Column(name = "target_audience", nullable = false, length = 20)
    private String targetAudience;
    @Column(name = "target_class_id")
    private Long targetClassId;
    @Column(name = "target_section_id")
    private Long targetSectionId;
    @Column(name = "channels_csv", nullable = false, length = 200)
    private String channelsCsv;
    @Column(name = "locale_code", length = 10)
    private String localeCode;
    @Column(nullable = false, length = 20)
    private String status;
    @Column(name = "recipient_count", nullable = false)
    private int recipientCount;
    @Column(name = "queued_count", nullable = false)
    private int queuedCount;
    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    public String getCampaignId() { return campaignId; }
    public void setCampaignId(String campaignId) { this.campaignId = campaignId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getTargetAudience() { return targetAudience; }
    public void setTargetAudience(String targetAudience) { this.targetAudience = targetAudience; }
    public Long getTargetClassId() { return targetClassId; }
    public void setTargetClassId(Long targetClassId) { this.targetClassId = targetClassId; }
    public Long getTargetSectionId() { return targetSectionId; }
    public void setTargetSectionId(Long targetSectionId) { this.targetSectionId = targetSectionId; }
    public String getChannelsCsv() { return channelsCsv; }
    public void setChannelsCsv(String channelsCsv) { this.channelsCsv = channelsCsv; }
    public String getLocaleCode() { return localeCode; }
    public void setLocaleCode(String localeCode) { this.localeCode = localeCode; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getRecipientCount() { return recipientCount; }
    public void setRecipientCount(int recipientCount) { this.recipientCount = recipientCount; }
    public int getQueuedCount() { return queuedCount; }
    public void setQueuedCount(int queuedCount) { this.queuedCount = queuedCount; }
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }
}
