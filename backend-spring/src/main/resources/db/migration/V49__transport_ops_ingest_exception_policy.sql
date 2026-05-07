-- Transport Phase B hardening:
-- - Device ingest event ledger (idempotent ingest + DLQ handling)
-- - Ops exception workflow queue (SLA/escalation tracking)
-- - Tenant policy table (exception-specific SLA + escalation overrides)

CREATE TABLE IF NOT EXISTS transport_device_ingest_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at DATETIME NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),

    source_adapter VARCHAR(64) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    idempotency_key VARCHAR(128) NOT NULL,
    vehicle_id BIGINT NULL,
    route_id BIGINT NULL,
    student_id BIGINT NULL,
    latitude DECIMAL(10, 7) NULL,
    longitude DECIMAL(10, 7) NULL,
    payload_json TEXT NULL,
    occurred_at DATETIME NOT NULL,
    processing_status VARCHAR(32) NOT NULL,
    failure_reason VARCHAR(512) NULL,
    retry_count INT NULL DEFAULT 0,

    INDEX idx_transport_ingest_tenant_key (tenant_id, idempotency_key),
    INDEX idx_transport_ingest_status (tenant_id, processing_status),
    INDEX idx_transport_ingest_occurred (tenant_id, occurred_at),
    INDEX idx_transport_ingest_vehicle (tenant_id, vehicle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS transport_ops_exceptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at DATETIME NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),

    exception_code VARCHAR(64) NOT NULL,
    severity VARCHAR(24) NOT NULL,
    status VARCHAR(24) NOT NULL,
    route_id BIGINT NULL,
    vehicle_id BIGINT NULL,
    student_id BIGINT NULL,
    owner_user_id BIGINT NULL,
    escalation_level INT NULL DEFAULT 0,
    sla_due_at DATETIME NULL,
    resolved_at DATETIME NULL,
    resolution_notes VARCHAR(1000) NULL,
    event_occurred_at DATETIME NOT NULL,

    INDEX idx_transport_ops_exception_status (tenant_id, status, severity),
    INDEX idx_transport_ops_exception_route (tenant_id, route_id),
    INDEX idx_transport_ops_exception_sla (tenant_id, status, sla_due_at),
    INDEX idx_transport_ops_exception_event_time (tenant_id, event_occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS transport_ops_policies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at DATETIME NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),

    exception_code VARCHAR(64) NOT NULL,
    severity VARCHAR(24) NOT NULL,
    sla_minutes INT NOT NULL,
    escalation_after_minutes INT NOT NULL,

    INDEX idx_transport_ops_policy_lookup (tenant_id, exception_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
