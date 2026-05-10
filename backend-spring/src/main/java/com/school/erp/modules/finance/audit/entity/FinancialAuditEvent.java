package com.school.erp.modules.finance.audit.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(
        name = "financial_audit_events",
        indexes = {
                @Index(name = "idx_fin_audit_lookup", columnList = "tenant_id, module_name, entity_type, entity_id"),
                @Index(name = "idx_fin_audit_operation", columnList = "tenant_id, operation_key"),
                @Index(name = "idx_fin_audit_created", columnList = "tenant_id, created_at")
        }
)
public class FinancialAuditEvent extends BaseEntity {

    @Column(name = "module_name", nullable = false, length = 40)
    private String moduleName;

    @Column(name = "action_name", nullable = false, length = 64)
    private String actionName;

    @Column(name = "entity_type", nullable = false, length = 40)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "operation_key", length = 120)
    private String operationKey;

    @Column(name = "idempotency_key", length = 120)
    private String idempotencyKey;

    @Column(name = "from_state", length = 32)
    private String fromState;

    @Column(name = "to_state", length = 32)
    private String toState;

    @Column(name = "event_status", length = 32)
    private String eventStatus;

    @Column(name = "provider", length = 40)
    private String provider;

    @Column(name = "reference_id", length = 120)
    private String referenceId;

    @Column(name = "currency", length = 10)
    private String currency;

    @Column(name = "amount", precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "detail_json", columnDefinition = "TEXT")
    private String detailJson;

    public String getModuleName() { return moduleName; }
    public void setModuleName(String moduleName) { this.moduleName = moduleName; }
    public String getActionName() { return actionName; }
    public void setActionName(String actionName) { this.actionName = actionName; }
    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }
    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }
    public String getOperationKey() { return operationKey; }
    public void setOperationKey(String operationKey) { this.operationKey = operationKey; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
    public String getFromState() { return fromState; }
    public void setFromState(String fromState) { this.fromState = fromState; }
    public String getToState() { return toState; }
    public void setToState(String toState) { this.toState = toState; }
    public String getEventStatus() { return eventStatus; }
    public void setEventStatus(String eventStatus) { this.eventStatus = eventStatus; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getDetailJson() { return detailJson; }
    public void setDetailJson(String detailJson) { this.detailJson = detailJson; }
}
