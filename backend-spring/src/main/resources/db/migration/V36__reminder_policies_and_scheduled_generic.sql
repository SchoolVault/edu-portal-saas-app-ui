-- Tenant-configurable reminder rules + scheduled generic reminders (announcement-style).
-- Superseded by feature-flag fee automation; tables removed in V37.

CREATE TABLE reminder_tenant_policy (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    config_json TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    UNIQUE KEY uq_rtp_tenant (tenant_id),
    INDEX idx_rtp_tenant_enabled (tenant_id, enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE scheduled_generic_reminder (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body_text TEXT NOT NULL,
    audience_json VARCHAR(500) NOT NULL,
    scheduled_at TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    correlation_id VARCHAR(64) NULL,
    created_by_user_id BIGINT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_sgr_tenant_status_due (tenant_id, status, scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
