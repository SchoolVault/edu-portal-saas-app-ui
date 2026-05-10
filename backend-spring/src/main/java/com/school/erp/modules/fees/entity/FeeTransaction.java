package com.school.erp.modules.fees.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.entity.AcademicYearScopedEntity;
import com.school.erp.common.entity.AcademicYearScopeGuardListener;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import org.hibernate.annotations.Filter;
import com.school.erp.tenant.hibernate.AcademicYearScopedFilter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@EntityListeners(AcademicYearScopeGuardListener.class)
@Filter(name = AcademicYearScopedFilter.NAME, condition = "academic_year_id = :academicYearId")
@Table(
        name = "fee_transactions",
        indexes = {
                @Index(name = "idx_fee_txn_payment", columnList = "tenant_id, fee_payment_id, created_at"),
                @Index(name = "idx_fee_txn_attempt", columnList = "tenant_id, attempt_id"),
                @Index(name = "idx_fee_txn_event", columnList = "tenant_id, event_type, created_at")
        }
)
public class FeeTransaction extends BaseEntity implements AcademicYearScopedEntity {

    @Column(name = "academic_year_id")
    private Long academicYearId;

    @Column(name = "fee_payment_id", nullable = false)
    private Long feePaymentId;

    @Column(name = "attempt_id")
    private Long attemptId;

    @Column(name = "event_type", nullable = false, length = 40)
    private String eventType;

    @Column(name = "event_status", length = 32)
    private String eventStatus;

    @Column(name = "amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", length = 10)
    private String currency;

    @Column(name = "provider", length = 40)
    private String provider;

    @Column(name = "provider_payment_id", length = 120)
    private String providerPaymentId;

    @Column(name = "reference_id", length = 120)
    private String referenceId;

    @Column(name = "operation_key", length = 120)
    private String operationKey;

    @Column(name = "note", length = 400)
    private String note;

    @Column(name = "metadata_json", columnDefinition = "TEXT")
    private String metadataJson;

    @Column(name = "occurred_at")
    private LocalDateTime occurredAt;

    @Override
    public Long getAcademicYearId() { return academicYearId; }
    @Override
    public void setAcademicYearId(Long academicYearId) { this.academicYearId = academicYearId; }

    public Long getFeePaymentId() { return feePaymentId; }
    public void setFeePaymentId(Long feePaymentId) { this.feePaymentId = feePaymentId; }
    public Long getAttemptId() { return attemptId; }
    public void setAttemptId(Long attemptId) { this.attemptId = attemptId; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getEventStatus() { return eventStatus; }
    public void setEventStatus(String eventStatus) { this.eventStatus = eventStatus; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getProviderPaymentId() { return providerPaymentId; }
    public void setProviderPaymentId(String providerPaymentId) { this.providerPaymentId = providerPaymentId; }
    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }
    public String getOperationKey() { return operationKey; }
    public void setOperationKey(String operationKey) { this.operationKey = operationKey; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public String getMetadataJson() { return metadataJson; }
    public void setMetadataJson(String metadataJson) { this.metadataJson = metadataJson; }
    public LocalDateTime getOccurredAt() { return occurredAt; }
    public void setOccurredAt(LocalDateTime occurredAt) { this.occurredAt = occurredAt; }
}
