package com.school.erp.modules.exams.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "exam_notification_jobs", indexes = {
        @Index(name = "idx_exam_notification_job", columnList = "tenant_id, status, next_retry_at, is_deleted")
})
public class ExamNotificationJob extends BaseEntity {
    @Column(name = "exam_id", nullable = false)
    private Long examId;
    @Column(name = "event_type", nullable = false, length = 60)
    private String eventType;
    @Column(name = "target_role", nullable = false, length = 40)
    private String targetRole;
    @Column(name = "locale_code", nullable = false, length = 10)
    private String localeCode = "en";
    @Column(nullable = false, length = 30)
    private String status = "PENDING";
    @Column(nullable = false)
    private Integer attempts = 0;
    @Column(name = "max_attempts", nullable = false)
    private Integer maxAttempts = 5;
    @Column(name = "next_retry_at")
    private LocalDateTime nextRetryAt;
    @Column(name = "payload_json", columnDefinition = "json")
    private String payloadJson;
    @Column(name = "last_error", length = 500)
    private String lastError;

    public Long getExamId() { return examId; }
    public void setExamId(Long examId) { this.examId = examId; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }
    public String getLocaleCode() { return localeCode; }
    public void setLocaleCode(String localeCode) { this.localeCode = localeCode; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getAttempts() { return attempts; }
    public void setAttempts(Integer attempts) { this.attempts = attempts; }
    public Integer getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(Integer maxAttempts) { this.maxAttempts = maxAttempts; }
    public LocalDateTime getNextRetryAt() { return nextRetryAt; }
    public void setNextRetryAt(LocalDateTime nextRetryAt) { this.nextRetryAt = nextRetryAt; }
    public String getPayloadJson() { return payloadJson; }
    public void setPayloadJson(String payloadJson) { this.payloadJson = payloadJson; }
    public String getLastError() { return lastError; }
    public void setLastError(String lastError) { this.lastError = lastError; }
}
