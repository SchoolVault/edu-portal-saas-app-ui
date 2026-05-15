CREATE TABLE IF NOT EXISTS parent_exam_notification_state (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(64) NOT NULL,
    user_id BIGINT NOT NULL,
    exam_id BIGINT NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    last_notified_at DATETIME NOT NULL,
    last_read_at DATETIME NULL,
    is_deleted BIT(1) NOT NULL DEFAULT b'0',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_pens_tenant_user_exam_event (tenant_id, user_id, exam_id, event_type, is_deleted),
    KEY idx_pens_tenant_user_unread (tenant_id, user_id, last_read_at, is_deleted),
    KEY idx_pens_tenant_exam (tenant_id, exam_id, is_deleted)
);

CREATE TABLE IF NOT EXISTS parent_exam_notification_preference (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(64) NOT NULL,
    user_id BIGINT NOT NULL,
    in_app_enabled BIT(1) NOT NULL DEFAULT b'1',
    sms_enabled BIT(1) NOT NULL DEFAULT b'1',
    email_enabled BIT(1) NOT NULL DEFAULT b'1',
    digest_enabled BIT(1) NOT NULL DEFAULT b'0',
    quiet_hours_start VARCHAR(5) NULL,
    quiet_hours_end VARCHAR(5) NULL,
    is_deleted BIT(1) NOT NULL DEFAULT b'0',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_penp_tenant_user (tenant_id, user_id, is_deleted),
    KEY idx_penp_tenant_user (tenant_id, user_id, is_deleted)
);
