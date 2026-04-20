package com.school.erp.modules.exams.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(name = "exam_event_logs", indexes = {
        @Index(name = "idx_exam_event_lookup", columnList = "tenant_id, exam_id, event_type, created_at, is_deleted")
})
public class ExamEventLog extends BaseEntity {
    @Column(name = "exam_id", nullable = false)
    private Long examId;
    @Column(name = "event_type", nullable = false, length = 60)
    private String eventType;
    @Column(name = "actor_user_id")
    private Long actorUserId;
    @Column(name = "actor_role", length = 40)
    private String actorRole;
    @Column(name = "payload_json", columnDefinition = "json")
    private String payloadJson;

    public Long getExamId() { return examId; }
    public void setExamId(Long examId) { this.examId = examId; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public Long getActorUserId() { return actorUserId; }
    public void setActorUserId(Long actorUserId) { this.actorUserId = actorUserId; }
    public String getActorRole() { return actorRole; }
    public void setActorRole(String actorRole) { this.actorRole = actorRole; }
    public String getPayloadJson() { return payloadJson; }
    public void setPayloadJson(String payloadJson) { this.payloadJson = payloadJson; }
}
