package com.school.erp.modules.hostel.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "hostel_incident_logs", indexes = {
        @Index(name = "idx_hil_tenant_severity", columnList = "tenant_id, severity"),
        @Index(name = "idx_hil_tenant_student", columnList = "tenant_id, student_id"),
        @Index(name = "idx_hil_tenant_status", columnList = "tenant_id, status")
})
public class HostelIncidentLog extends BaseEntity {
    @Column(name = "student_id")
    private Long studentId;
    @Column(name = "student_name", length = 200)
    private String studentName;
    @Column(name = "incident_type", length = 60)
    private String incidentType;
    /** LOW, MEDIUM, HIGH, CRITICAL */
    @Column(length = 20)
    private String severity;
    /** OPEN, ESCALATED, RESOLVED */
    @Column(length = 20)
    private String status;
    @Column(length = 600)
    private String summary;
    @Column(name = "occurred_at")
    private LocalDateTime occurredAt;
    @Column(name = "escalated_at")
    private LocalDateTime escalatedAt;
    @Column(name = "escalation_level", length = 30)
    private String escalationLevel;
    @Column(name = "resolution_note", length = 500)
    private String resolutionNote;
    @Column(name = "resolution_reason", length = 80)
    private String resolutionReason;
    @Column(name = "sla_due_at")
    private LocalDateTime slaDueAt;

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getIncidentType() {
        return incidentType;
    }

    public void setIncidentType(String incidentType) {
        this.incidentType = incidentType;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }

    public void setOccurredAt(LocalDateTime occurredAt) {
        this.occurredAt = occurredAt;
    }

    public LocalDateTime getEscalatedAt() {
        return escalatedAt;
    }

    public void setEscalatedAt(LocalDateTime escalatedAt) {
        this.escalatedAt = escalatedAt;
    }

    public String getEscalationLevel() {
        return escalationLevel;
    }

    public void setEscalationLevel(String escalationLevel) {
        this.escalationLevel = escalationLevel;
    }

    public String getResolutionNote() {
        return resolutionNote;
    }

    public void setResolutionNote(String resolutionNote) {
        this.resolutionNote = resolutionNote;
    }

    public String getResolutionReason() {
        return resolutionReason;
    }

    public void setResolutionReason(String resolutionReason) {
        this.resolutionReason = resolutionReason;
    }

    public LocalDateTime getSlaDueAt() {
        return slaDueAt;
    }

    public void setSlaDueAt(LocalDateTime slaDueAt) {
        this.slaDueAt = slaDueAt;
    }
}
