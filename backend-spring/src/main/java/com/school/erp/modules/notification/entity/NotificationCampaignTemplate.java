package com.school.erp.modules.notification.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(
        name = "notification_campaign_template",
        indexes = {
                @Index(name = "idx_nct_tenant_key", columnList = "tenant_id, event_type, channel, locale_code"),
                @Index(name = "idx_nct_tenant_status", columnList = "tenant_id, status")
        })
public class NotificationCampaignTemplate extends BaseEntity {
    @Column(name = "event_type", nullable = false, length = 80)
    private String eventType;
    @Column(nullable = false, length = 20)
    private String channel;
    @Column(name = "locale_code", nullable = false, length = 10)
    private String localeCode;
    @Column(name = "template_body", nullable = false, length = 2000)
    private String templateBody;
    @Column(name = "dlt_template_id", length = 120)
    private String dltTemplateId;
    @Column(nullable = false, length = 20)
    private String status;

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }
    public String getLocaleCode() { return localeCode; }
    public void setLocaleCode(String localeCode) { this.localeCode = localeCode; }
    public String getTemplateBody() { return templateBody; }
    public void setTemplateBody(String templateBody) { this.templateBody = templateBody; }
    public String getDltTemplateId() { return dltTemplateId; }
    public void setDltTemplateId(String dltTemplateId) { this.dltTemplateId = dltTemplateId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
