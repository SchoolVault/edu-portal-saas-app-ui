package com.school.erp.modules.exams.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(
        name = "parent_exam_notification_preference",
        indexes = {
                @Index(name = "idx_penp_tenant_user", columnList = "tenant_id,user_id,is_deleted")
        })
public class ParentExamNotificationPreference extends BaseEntity {
    @Column(name = "user_id", nullable = false)
    private Long userId;
    @Column(name = "in_app_enabled", nullable = false)
    private Boolean inAppEnabled = true;
    @Column(name = "sms_enabled", nullable = false)
    private Boolean smsEnabled = true;
    @Column(name = "email_enabled", nullable = false)
    private Boolean emailEnabled = true;
    @Column(name = "digest_enabled", nullable = false)
    private Boolean digestEnabled = false;
    @Column(name = "quiet_hours_start", length = 5)
    private String quietHoursStart;
    @Column(name = "quiet_hours_end", length = 5)
    private String quietHoursEnd;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Boolean getInAppEnabled() { return inAppEnabled; }
    public void setInAppEnabled(Boolean inAppEnabled) { this.inAppEnabled = inAppEnabled; }
    public Boolean getSmsEnabled() { return smsEnabled; }
    public void setSmsEnabled(Boolean smsEnabled) { this.smsEnabled = smsEnabled; }
    public Boolean getEmailEnabled() { return emailEnabled; }
    public void setEmailEnabled(Boolean emailEnabled) { this.emailEnabled = emailEnabled; }
    public Boolean getDigestEnabled() { return digestEnabled; }
    public void setDigestEnabled(Boolean digestEnabled) { this.digestEnabled = digestEnabled; }
    public String getQuietHoursStart() { return quietHoursStart; }
    public void setQuietHoursStart(String quietHoursStart) { this.quietHoursStart = quietHoursStart; }
    public String getQuietHoursEnd() { return quietHoursEnd; }
    public void setQuietHoursEnd(String quietHoursEnd) { this.quietHoursEnd = quietHoursEnd; }
}
