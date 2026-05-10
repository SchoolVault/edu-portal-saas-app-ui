-- Fresh hostel module baseline for clean database bootstraps.
SET @hr_has_occupancy_status := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'hostel_rooms'
      AND column_name = 'occupancy_status'
);

SET @hr_ddl := IF(
    @hr_has_occupancy_status = 0,
    'ALTER TABLE hostel_rooms ADD COLUMN occupancy_status VARCHAR(30) NULL AFTER room_type',
    'SELECT 1'
);

PREPARE stmt_hr FROM @hr_ddl;
EXECUTE stmt_hr;
DEALLOCATE PREPARE stmt_hr;

CREATE TABLE IF NOT EXISTS hostel_allocations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    room_id BIGINT NOT NULL,
    room_number VARCHAR(20),
    student_id BIGINT NOT NULL,
    student_name VARCHAR(200),
    from_date DATE,
    to_date DATE,
    status VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_ha_student (tenant_id, student_id),
    INDEX idx_ha_room (tenant_id, room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS hostel_billing_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    student_id BIGINT NOT NULL,
    student_name VARCHAR(200),
    fee_structure_id BIGINT NOT NULL,
    billing_cadence VARCHAR(20),
    deposit_amount DECIMAL(12,2),
    mess_charge_amount DECIMAL(12,2),
    auto_invoice_enabled BOOLEAN DEFAULT TRUE,
    last_invoice_date DATE,
    next_due_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_hbp_tenant_student (tenant_id, student_id),
    INDEX idx_hbp_tenant_due (tenant_id, next_due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS hostel_billing_run_ledger (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    idempotency_key VARCHAR(120),
    run_ref VARCHAR(120),
    due_date DATE,
    status VARCHAR(20),
    queued_profiles INT,
    note VARCHAR(300),
    completed_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_hbrl_tenant_key (tenant_id, idempotency_key),
    INDEX idx_hbrl_tenant_due (tenant_id, due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS hostel_booking_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    student_id BIGINT NOT NULL,
    student_name VARCHAR(200),
    parent_user_id BIGINT,
    preferred_hostel_id BIGINT,
    preferred_room_type VARCHAR(40),
    status VARCHAR(20),
    request_note VARCHAR(400),
    decision_note VARCHAR(400),
    approved_allocation_id BIGINT,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_hbq_tenant_status (tenant_id, status),
    INDEX idx_hbq_tenant_student (tenant_id, student_id),
    INDEX idx_hbq_tenant_parent (tenant_id, parent_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS hostel_gate_pass_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    student_id BIGINT NOT NULL,
    student_name VARCHAR(200),
    request_type VARCHAR(30),
    status VARCHAR(20),
    reason VARCHAR(400),
    out_at TIMESTAMP NULL,
    expected_in_at TIMESTAMP NULL,
    actual_in_at TIMESTAMP NULL,
    approved_by_user_id BIGINT,
    approved_at TIMESTAMP NULL,
    approval_note VARCHAR(300),
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_hgpr_tenant_status (tenant_id, status),
    INDEX idx_hgpr_tenant_student (tenant_id, student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS hostel_visitor_entries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    student_id BIGINT NOT NULL,
    student_name VARCHAR(200),
    visitor_name VARCHAR(200),
    relation_label VARCHAR(80),
    visitor_phone VARCHAR(30),
    purpose VARCHAR(250),
    status VARCHAR(20),
    check_in_at TIMESTAMP NULL,
    check_out_at TIMESTAMP NULL,
    approved_by_user_id BIGINT,
    approved_at TIMESTAMP NULL,
    approval_note VARCHAR(300),
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_hve_tenant_status (tenant_id, status),
    INDEX idx_hve_tenant_student (tenant_id, student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS hostel_incident_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    student_id BIGINT,
    student_name VARCHAR(200),
    incident_type VARCHAR(60),
    severity VARCHAR(20),
    status VARCHAR(20),
    summary VARCHAR(600),
    occurred_at TIMESTAMP NULL,
    escalated_at TIMESTAMP NULL,
    escalation_level VARCHAR(30),
    resolution_note VARCHAR(500),
    resolution_reason VARCHAR(80),
    sla_due_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_hil_tenant_severity (tenant_id, severity),
    INDEX idx_hil_tenant_student (tenant_id, student_id),
    INDEX idx_hil_tenant_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS hostel_audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    action_code VARCHAR(80),
    entity_type VARCHAR(50),
    entity_id BIGINT,
    actor_user_id BIGINT,
    actor_role VARCHAR(40),
    actor_name VARCHAR(200),
    change_summary VARCHAR(500),
    diff_json TEXT,
    request_ip VARCHAR(80),
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_hal_tenant_action (tenant_id, action_code),
    INDEX idx_hal_tenant_actor (tenant_id, actor_user_id),
    INDEX idx_hal_tenant_entity (tenant_id, entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
