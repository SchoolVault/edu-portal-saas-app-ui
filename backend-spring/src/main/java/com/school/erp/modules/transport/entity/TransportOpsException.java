package com.school.erp.modules.transport.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "transport_ops_exceptions", indexes = {
        @Index(name = "idx_transport_ops_exception_status", columnList = "tenant_id, status, severity"),
        @Index(name = "idx_transport_ops_exception_route", columnList = "tenant_id, route_id")
})
public class TransportOpsException extends BaseEntity {

    @Column(name = "exception_code", nullable = false, length = 64)
    private String exceptionCode;

    @Column(name = "severity", nullable = false, length = 24)
    private String severity;

    @Column(name = "status", nullable = false, length = 24)
    private String status = "OPEN";

    @Column(name = "route_id")
    private Long routeId;

    @Column(name = "vehicle_id")
    private Long vehicleId;

    @Column(name = "student_id")
    private Long studentId;

    @Column(name = "owner_user_id")
    private Long ownerUserId;

    @Column(name = "escalation_level")
    private Integer escalationLevel = 0;

    @Column(name = "sla_due_at")
    private Instant slaDueAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "resolution_notes", length = 1000)
    private String resolutionNotes;

    @Column(name = "event_occurred_at", nullable = false)
    private Instant eventOccurredAt = Instant.now();

    public String getExceptionCode() {
        return exceptionCode;
    }

    public void setExceptionCode(String exceptionCode) {
        this.exceptionCode = exceptionCode;
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

    public Long getRouteId() {
        return routeId;
    }

    public void setRouteId(Long routeId) {
        this.routeId = routeId;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public Long getOwnerUserId() {
        return ownerUserId;
    }

    public void setOwnerUserId(Long ownerUserId) {
        this.ownerUserId = ownerUserId;
    }

    public Integer getEscalationLevel() {
        return escalationLevel;
    }

    public void setEscalationLevel(Integer escalationLevel) {
        this.escalationLevel = escalationLevel;
    }

    public Instant getSlaDueAt() {
        return slaDueAt;
    }

    public void setSlaDueAt(Instant slaDueAt) {
        this.slaDueAt = slaDueAt;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(Instant resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public String getResolutionNotes() {
        return resolutionNotes;
    }

    public void setResolutionNotes(String resolutionNotes) {
        this.resolutionNotes = resolutionNotes;
    }

    public Instant getEventOccurredAt() {
        return eventOccurredAt;
    }

    public void setEventOccurredAt(Instant eventOccurredAt) {
        this.eventOccurredAt = eventOccurredAt;
    }
}
