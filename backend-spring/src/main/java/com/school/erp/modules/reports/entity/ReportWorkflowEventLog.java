package com.school.erp.modules.reports.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "report_workflow_event_logs", indexes = {
        @Index(name = "idx_report_workflow_job", columnList = "tenant_id, report_job_id, occurred_at, is_deleted")
})
public class ReportWorkflowEventLog extends BaseEntity {
    @Column(name = "report_job_id", nullable = false)
    private Long reportJobId;
    @Column(name = "actor_user_id")
    private Long actorUserId;
    @Column(name = "actor_role", length = 40)
    private String actorRole;
    @Column(name = "event_code", nullable = false, length = 50)
    private String eventCode;
    @Column(name = "from_state", length = 30)
    private String fromState;
    @Column(name = "to_state", length = 30)
    private String toState;
    @Column(length = 500)
    private String note;
    @Column(name = "event_meta_json", columnDefinition = "json")
    private String eventMetaJson;
    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;

    public Long getReportJobId() { return reportJobId; }
    public void setReportJobId(Long reportJobId) { this.reportJobId = reportJobId; }
    public Long getActorUserId() { return actorUserId; }
    public void setActorUserId(Long actorUserId) { this.actorUserId = actorUserId; }
    public String getActorRole() { return actorRole; }
    public void setActorRole(String actorRole) { this.actorRole = actorRole; }
    public String getEventCode() { return eventCode; }
    public void setEventCode(String eventCode) { this.eventCode = eventCode; }
    public String getFromState() { return fromState; }
    public void setFromState(String fromState) { this.fromState = fromState; }
    public String getToState() { return toState; }
    public void setToState(String toState) { this.toState = toState; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public String getEventMetaJson() { return eventMetaJson; }
    public void setEventMetaJson(String eventMetaJson) { this.eventMetaJson = eventMetaJson; }
    public LocalDateTime getOccurredAt() { return occurredAt; }
    public void setOccurredAt(LocalDateTime occurredAt) { this.occurredAt = occurredAt; }
}
