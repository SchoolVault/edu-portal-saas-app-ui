package com.school.erp.modules.payroll.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
        name = "payroll_payout_webhook_events",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_payroll_webhook_provider_hash", columnNames = {"provider", "payload_sha256"}),
                @UniqueConstraint(name = "uk_payroll_webhook_provider_event", columnNames = {"provider", "external_event_id"})
        })
public class PayrollPayoutWebhookEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 32)
    private String provider;

    @Column(name = "payload_sha256", nullable = false, length = 64)
    private String payloadSha256;

    @Column(name = "external_event_id", length = 128)
    private String externalEventId;

    @Column(name = "reference_id", length = 120)
    private String referenceId;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(length = 512)
    private String detail;

    @Lob
    @Column(name = "raw_body", columnDefinition = "MEDIUMTEXT")
    private String rawBody;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "processed_at")
    private Instant processedAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Long getId() { return id; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getPayloadSha256() { return payloadSha256; }
    public void setPayloadSha256(String payloadSha256) { this.payloadSha256 = payloadSha256; }
    public String getExternalEventId() { return externalEventId; }
    public void setExternalEventId(String externalEventId) { this.externalEventId = externalEventId; }
    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }
    public String getRawBody() { return rawBody; }
    public void setRawBody(String rawBody) { this.rawBody = rawBody; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getProcessedAt() { return processedAt; }
    public void setProcessedAt(Instant processedAt) { this.processedAt = processedAt; }
}
