package com.school.erp.modules.notification.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "notification_outbox",
        indexes = {
                @Index(name = "idx_no_tenant_status_created", columnList = "tenant_id, status, created_at"),
                @Index(name = "idx_no_tenant_event", columnList = "tenant_id, event_type"),
                @Index(name = "idx_no_tenant_corr", columnList = "tenant_id, correlation_id")
        })
public class NotificationOutbox extends BaseEntity {

    @Column(name = "event_type", nullable = false, length = 64)
    private String eventType;

    @Column(nullable = false, length = 20)
    private String channel;

    @Column(name = "recipient_user_id")
    private Long recipientUserId;

    @Column(name = "recipient_phone_e164", length = 24)
    private String recipientPhoneE164;

    @Column(name = "recipient_email", length = 150)
    private String recipientEmail;

    @Column(length = 200)
    private String subject;

    @Column(name = "body_text", nullable = false, columnDefinition = "TEXT")
    private String bodyText;

    @Column(name = "body_html", columnDefinition = "LONGTEXT")
    private String bodyHtml;

    @Column(name = "dedupe_key", length = 200)
    private String dedupeKey;

    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(nullable = false)
    private int attempts = 0;

    @Column(name = "last_error", length = 500)
    private String lastError;

    @Column(name = "correlation_id", length = 64)
    private String correlationId;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "next_retry_at")
    private LocalDateTime nextRetryAt;

    @Column(name = "provider_message_id", length = 120)
    private String providerMessageId;

    @Column(name = "provider_status", length = 40)
    private String providerStatus;

    @Column(name = "provider_error_code", length = 80)
    private String providerErrorCode;

    @Column(name = "dead_lettered_at")
    private LocalDateTime deadLetteredAt;

    @Column(name = "channel_cost_minor")
    private Integer channelCostMinor;

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getChannel() {
        return channel;
    }

    public void setChannel(String channel) {
        this.channel = channel;
    }

    public Long getRecipientUserId() {
        return recipientUserId;
    }

    public void setRecipientUserId(Long recipientUserId) {
        this.recipientUserId = recipientUserId;
    }

    public String getRecipientPhoneE164() {
        return recipientPhoneE164;
    }

    public void setRecipientPhoneE164(String recipientPhoneE164) {
        this.recipientPhoneE164 = recipientPhoneE164;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }

    public String getBodyText() {
        return bodyText;
    }

    public void setBodyText(String bodyText) {
        this.bodyText = bodyText;
    }

    public String getBodyHtml() {
        return bodyHtml;
    }

    public void setBodyHtml(String bodyHtml) {
        this.bodyHtml = bodyHtml;
    }

    public String getDedupeKey() {
        return dedupeKey;
    }

    public void setDedupeKey(String dedupeKey) {
        this.dedupeKey = dedupeKey;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getAttempts() {
        return attempts;
    }

    public void setAttempts(int attempts) {
        this.attempts = attempts;
    }

    public String getLastError() {
        return lastError;
    }

    public void setLastError(String lastError) {
        this.lastError = lastError;
    }

    public String getCorrelationId() {
        return correlationId;
    }

    public void setCorrelationId(String correlationId) {
        this.correlationId = correlationId;
    }

    public LocalDateTime getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(LocalDateTime processedAt) {
        this.processedAt = processedAt;
    }

    public LocalDateTime getNextRetryAt() {
        return nextRetryAt;
    }

    public void setNextRetryAt(LocalDateTime nextRetryAt) {
        this.nextRetryAt = nextRetryAt;
    }

    public String getProviderMessageId() {
        return providerMessageId;
    }

    public void setProviderMessageId(String providerMessageId) {
        this.providerMessageId = providerMessageId;
    }

    public String getProviderStatus() {
        return providerStatus;
    }

    public void setProviderStatus(String providerStatus) {
        this.providerStatus = providerStatus;
    }

    public String getProviderErrorCode() {
        return providerErrorCode;
    }

    public void setProviderErrorCode(String providerErrorCode) {
        this.providerErrorCode = providerErrorCode;
    }

    public LocalDateTime getDeadLetteredAt() {
        return deadLetteredAt;
    }

    public void setDeadLetteredAt(LocalDateTime deadLetteredAt) {
        this.deadLetteredAt = deadLetteredAt;
    }

    public Integer getChannelCostMinor() {
        return channelCostMinor;
    }

    public void setChannelCostMinor(Integer channelCostMinor) {
        this.channelCostMinor = channelCostMinor;
    }
}
