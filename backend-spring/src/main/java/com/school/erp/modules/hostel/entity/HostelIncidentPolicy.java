package com.school.erp.modules.hostel.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(name = "hostel_incident_policies", indexes = {
        @Index(name = "idx_hip_tenant_incident_type", columnList = "tenant_id, incident_type")
})
public class HostelIncidentPolicy extends BaseEntity {
    @Column(name = "incident_type", nullable = false, length = 60)
    private String incidentType;

    @Column(name = "severity", nullable = false, length = 20)
    private String severity;

    @Column(name = "sla_minutes", nullable = false)
    private Integer slaMinutes;

    @Column(name = "escalation_after_minutes", nullable = false)
    private Integer escalationAfterMinutes;

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
