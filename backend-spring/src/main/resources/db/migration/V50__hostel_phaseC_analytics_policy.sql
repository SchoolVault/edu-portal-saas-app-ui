-- Hostel Phase C:
-- Tenant policy table for incident SLA/escalation with index-safe lookup.

CREATE TABLE IF NOT EXISTS hostel_incident_policies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at DATETIME NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),

    incident_type VARCHAR(60) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    sla_minutes INT NOT NULL,
    escalation_after_minutes INT NOT NULL,

    UNIQUE KEY uk_hip_tenant_incident_type (tenant_id, incident_type),
    INDEX idx_hip_tenant_incident_type (tenant_id, incident_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
