package com.school.erp.modules.exams.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "parent_exam_notification_state",
        indexes = {
                @Index(name = "idx_pens_tenant_user_unread", columnList = "tenant_id,user_id,last_read_at,is_deleted"),
                @Index(name = "idx_pens_tenant_exam", columnList = "tenant_id,exam_id,is_deleted")
        })
public class ParentExamNotificationState extends BaseEntity {
    @Column(name = "user_id", nullable = false)
    private Long userId;
    @Column(name = "exam_id", nullable = false)
    private Long examId;
    @Column(name = "event_type", nullable = false, length = 64)
    private String eventType;
    @Column(name = "last_notified_at", nullable = false)
    private LocalDateTime lastNotifiedAt;
    @Column(name = "last_read_at")
    private LocalDateTime lastReadAt;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getExamId() { return examId; }
    public void setExamId(Long examId) { this.examId = examId; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public LocalDateTime getLastNotifiedAt() { return lastNotifiedAt; }
    public void setLastNotifiedAt(LocalDateTime lastNotifiedAt) { this.lastNotifiedAt = lastNotifiedAt; }
    public LocalDateTime getLastReadAt() { return lastReadAt; }
    public void setLastReadAt(LocalDateTime lastReadAt) { this.lastReadAt = lastReadAt; }
}
