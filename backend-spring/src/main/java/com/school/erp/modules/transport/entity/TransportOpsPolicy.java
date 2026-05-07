package com.school.erp.modules.transport.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(name = "transport_ops_policies", indexes = {
        @Index(name = "idx_transport_ops_policy_lookup", columnList = "tenant_id, exception_code")
})
public class TransportOpsPolicy extends BaseEntity {

    @Column(name = "exception_code", nullable = false, length = 64)
    private String exceptionCode;

    @Column(name = "severity", nullable = false, length = 24)
    private String severity;

    @Column(name = "sla_minutes", nullable = false)
    private Integer slaMinutes;

    @Column(name = "escalation_after_minutes", nullable = false)
    private Integer escalationAfterMinutes;

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

    public Integer getSlaMinutes() {
        return slaMinutes;
    }

    public void setSlaMinutes(Integer slaMinutes) {
        this.slaMinutes = slaMinutes;
    }

    public Integer getEscalationAfterMinutes() {
        return escalationAfterMinutes;
    }

    public void setEscalationAfterMinutes(Integer escalationAfterMinutes) {
        this.escalationAfterMinutes = escalationAfterMinutes;
    }
}
