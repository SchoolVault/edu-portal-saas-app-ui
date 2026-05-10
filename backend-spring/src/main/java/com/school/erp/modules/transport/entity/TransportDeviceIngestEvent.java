package com.school.erp.modules.transport.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "transport_device_ingest_events", indexes = {
        @Index(name = "idx_transport_ingest_tenant_key", columnList = "tenant_id, idempotency_key"),
        @Index(name = "idx_transport_ingest_status", columnList = "tenant_id, processing_status")
})
public class TransportDeviceIngestEvent extends BaseEntity {

    @Column(name = "source_adapter", nullable = false, length = 64)
    private String sourceAdapter;

    @Column(name = "event_type", nullable = false, length = 64)
    private String eventType;

    @Column(name = "idempotency_key", nullable = false, length = 128)
    private String idempotencyKey;

    @Column(name = "vehicle_id")
    private Long vehicleId;

    @Column(name = "route_id")
    private Long routeId;

    @Column(name = "student_id")
    private Long studentId;

    @Column(name = "latitude")
    private java.math.BigDecimal latitude;

    @Column(name = "longitude")
    private java.math.BigDecimal longitude;

    @Column(name = "payload_json", columnDefinition = "TEXT")
    private String payloadJson;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt = Instant.now();

    @Column(name = "processing_status", nullable = false, length = 32)
    private String processingStatus = "RECEIVED";

    @Column(name = "failure_reason", length = 512)
    private String failureReason;

    @Column(name = "retry_count")
    private Integer retryCount = 0;

    public String getSourceAdapter() {
        return sourceAdapter;
    }

    public void setSourceAdapter(String sourceAdapter) {
        this.sourceAdapter = sourceAdapter;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public Long getRouteId() {
        return routeId;
    }

    public void setRouteId(Long routeId) {
        this.routeId = routeId;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public java.math.BigDecimal getLatitude() {
        return latitude;
    }

    public void setLatitude(java.math.BigDecimal latitude) {
        this.latitude = latitude;
    }

    public java.math.BigDecimal getLongitude() {
        return longitude;
    }

    public void setLongitude(java.math.BigDecimal longitude) {
        this.longitude = longitude;
    }

    public String getPayloadJson() {
        return payloadJson;
    }

    public void setPayloadJson(String payloadJson) {
        this.payloadJson = payloadJson;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }

    public void setOccurredAt(Instant occurredAt) {
        this.occurredAt = occurredAt;
    }

    public String getProcessingStatus() {
        return processingStatus;
    }

    public void setProcessingStatus(String processingStatus) {
        this.processingStatus = processingStatus;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }

    public Integer getRetryCount() {
        return retryCount;
    }

    public void setRetryCount(Integer retryCount) {
        this.retryCount = retryCount;
    }
}
