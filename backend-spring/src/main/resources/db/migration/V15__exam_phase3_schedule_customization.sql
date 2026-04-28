-- V15 domain foundation bundle:
-- Exam Phase 3 schedule customization + reports reliability modules.

ALTER TABLE exam_schedule_slot
    ADD COLUMN paper_type VARCHAR(80) NULL AFTER subject_name,
    ADD COLUMN invigilator_name VARCHAR(160) NULL AFTER paper_type;

-- ---------------------------------------------------------------------------
-- Module blocks in this migration are grouped by responsibility.
-- ---------------------------------------------------------------------------

-- Exam template and publication foundation
CREATE TABLE exam_templates (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    is_deleted TINYINT(1) DEFAULT 0,
    deleted_at DATETIME(6) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    name VARCHAR(140) NOT NULL,
    board_type VARCHAR(40) NOT NULL,
    class_band VARCHAR(50) NULL,
    default_marking_scheme VARCHAR(40) NULL,
    rules_json JSON NULL,
    UNIQUE KEY uk_exam_template_name (tenant_id, name, is_deleted),
    KEY idx_exam_template_lookup (tenant_id, board_type, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE exam_template_components (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    is_deleted TINYINT(1) DEFAULT 0,
    deleted_at DATETIME(6) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    template_id BIGINT NOT NULL,
    component_code VARCHAR(60) NOT NULL,
    component_label VARCHAR(120) NOT NULL,
    max_marks DECIMAL(8,2) NOT NULL,
    weightage_pct DECIMAL(6,2) NOT NULL DEFAULT 0,
    is_optional TINYINT(1) NOT NULL DEFAULT 0,
    rule_json JSON NULL,
    KEY idx_exam_template_component_lookup (tenant_id, template_id, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE exam_publication_snapshots (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    is_deleted TINYINT(1) DEFAULT 0,
    deleted_at DATETIME(6) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    exam_id BIGINT NOT NULL,
    version_no INT NOT NULL,
    snapshot_type VARCHAR(40) NOT NULL,
    snapshot_json JSON NOT NULL,
    note VARCHAR(500) NULL,
    published_by_user_id BIGINT NULL,
    published_at DATETIME(6) NOT NULL,
    UNIQUE KEY uk_exam_snapshot_version (tenant_id, exam_id, version_no, is_deleted),
    KEY idx_exam_snapshot_lookup (tenant_id, exam_id, published_at, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE exam_event_logs (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    is_deleted TINYINT(1) DEFAULT 0,
    deleted_at DATETIME(6) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    exam_id BIGINT NOT NULL,
    event_type VARCHAR(60) NOT NULL,
    actor_user_id BIGINT NULL,
    actor_role VARCHAR(40) NULL,
    payload_json JSON NULL,
    KEY idx_exam_event_lookup (tenant_id, exam_id, event_type, created_at, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE exam_notification_jobs (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    is_deleted TINYINT(1) DEFAULT 0,
    deleted_at DATETIME(6) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    exam_id BIGINT NOT NULL,
    event_type VARCHAR(60) NOT NULL,
    target_role VARCHAR(40) NOT NULL,
    locale_code VARCHAR(10) NOT NULL DEFAULT 'en',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    next_retry_at DATETIME(6) NULL,
    payload_json JSON NULL,
    last_error VARCHAR(500) NULL,
    KEY idx_exam_notification_job (tenant_id, status, next_retry_at, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE exam_bulk_operation_logs (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    is_deleted TINYINT(1) DEFAULT 0,
    deleted_at DATETIME(6) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    operation_type VARCHAR(60) NOT NULL,
    request_id VARCHAR(120) NOT NULL,
    exam_id BIGINT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    response_json JSON NULL,
    UNIQUE KEY uk_exam_bulk_request (tenant_id, operation_type, request_id, is_deleted),
    KEY idx_exam_bulk_lookup (tenant_id, operation_type, created_at, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Report templates and generation jobs
CREATE TABLE report_templates (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    is_deleted TINYINT(1) DEFAULT 0,
    deleted_at DATETIME(6) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    template_code VARCHAR(80) NOT NULL,
    name VARCHAR(140) NOT NULL,
    report_type VARCHAR(60) NOT NULL,
    default_format VARCHAR(20) NOT NULL DEFAULT 'PDF',
    layout_config_json JSON NULL,
    filter_schema_json JSON NULL,
    is_system_template TINYINT(1) NOT NULL DEFAULT 0,
    UNIQUE KEY uk_report_template_code (tenant_id, template_code, is_deleted),
    KEY idx_report_template_lookup (tenant_id, report_type, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE report_generation_jobs (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    is_deleted TINYINT(1) DEFAULT 0,
    deleted_at DATETIME(6) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    request_id VARCHAR(120) NOT NULL,
    template_id BIGINT NULL,
    report_type VARCHAR(60) NOT NULL,
    format VARCHAR(20) NOT NULL,
    filter_json JSON NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    file_name VARCHAR(180) NULL,
    content_type VARCHAR(100) NULL,
    content_size_bytes BIGINT NULL,
    file_content LONGBLOB NULL,
    last_error VARCHAR(500) NULL,
    generated_at DATETIME(6) NULL,
    UNIQUE KEY uk_report_job_request (tenant_id, request_id, is_deleted),
    KEY idx_report_job_lookup (tenant_id, report_type, created_at, is_deleted),
    KEY idx_report_job_status (tenant_id, status, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Report orchestration and sharing
ALTER TABLE report_templates
    ADD COLUMN pack_code VARCHAR(40) NULL AFTER default_format;

ALTER TABLE report_generation_jobs
    ADD COLUMN attempts INT NOT NULL DEFAULT 0 AFTER last_error,
    ADD COLUMN max_attempts INT NOT NULL DEFAULT 3 AFTER attempts,
    ADD COLUMN schedule_at DATETIME(6) NULL AFTER max_attempts,
    ADD COLUMN next_retry_at DATETIME(6) NULL AFTER schedule_at,
    ADD COLUMN share_config_json JSON NULL AFTER next_retry_at;

CREATE INDEX idx_report_job_due_schedule ON report_generation_jobs (status, schedule_at, is_deleted);
CREATE INDEX idx_report_job_due_retry ON report_generation_jobs (status, next_retry_at, is_deleted);

CREATE TABLE report_notification_templates (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    is_deleted TINYINT(1) DEFAULT 0,
    deleted_at DATETIME(6) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    template_code VARCHAR(80) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    target_role VARCHAR(40) NOT NULL,
    locale_code VARCHAR(10) NOT NULL,
    title_template VARCHAR(200) NOT NULL,
    message_template VARCHAR(800) NOT NULL,
    UNIQUE KEY uk_report_notify_tpl (tenant_id, template_code, channel, target_role, locale_code, is_deleted),
    KEY idx_report_notification_template (tenant_id, template_code, target_role, locale_code, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE report_share_dispatches (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    is_deleted TINYINT(1) DEFAULT 0,
    deleted_at DATETIME(6) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    report_job_id BIGINT NOT NULL,
    channel VARCHAR(20) NOT NULL,
    target_role VARCHAR(40) NOT NULL,
    locale_code VARCHAR(10) NOT NULL,
    template_code VARCHAR(80) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    next_retry_at DATETIME(6) NULL,
    delivered_count INT NULL DEFAULT 0,
    last_error VARCHAR(500) NULL,
    KEY idx_report_share_dispatch (tenant_id, status, next_retry_at, is_deleted),
    KEY idx_report_share_job (tenant_id, report_job_id, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Report publication snapshots and analytics
ALTER TABLE report_generation_jobs
    ADD COLUMN workflow_state VARCHAR(30) NOT NULL DEFAULT 'DRAFT' AFTER status,
    ADD COLUMN workflow_note VARCHAR(500) NULL AFTER workflow_state,
    ADD COLUMN approved_at DATETIME(6) NULL AFTER generated_at,
    ADD COLUMN published_at DATETIME(6) NULL AFTER approved_at;

CREATE INDEX idx_report_job_workflow ON report_generation_jobs (tenant_id, workflow_state, is_deleted);

CREATE TABLE report_publication_snapshots (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    is_deleted TINYINT(1) DEFAULT 0,
    deleted_at DATETIME(6) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    report_job_id BIGINT NOT NULL,
    version_no INT NOT NULL,
    snapshot_type VARCHAR(30) NOT NULL,
    snapshot_json JSON NOT NULL,
    note VARCHAR(500) NULL,
    published_at DATETIME(6) NOT NULL,
    UNIQUE KEY uk_report_snapshot_version (tenant_id, report_job_id, version_no, is_deleted),
    KEY idx_report_snapshot_job (tenant_id, report_job_id, version_no, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Report workflow guardrails and event logs
ALTER TABLE report_generation_jobs
    ADD COLUMN creator_user_id BIGINT NULL AFTER workflow_note,
    ADD COLUMN approver_user_id BIGINT NULL AFTER creator_user_id,
    ADD COLUMN publisher_user_id BIGINT NULL AFTER approver_user_id;

CREATE INDEX idx_report_job_creator ON report_generation_jobs (tenant_id, creator_user_id, is_deleted);

CREATE TABLE report_workflow_event_logs (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    is_deleted TINYINT(1) DEFAULT 0,
    deleted_at DATETIME(6) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    report_job_id BIGINT NOT NULL,
    actor_user_id BIGINT NULL,
    actor_role VARCHAR(40) NULL,
    event_code VARCHAR(50) NOT NULL,
    from_state VARCHAR(30) NULL,
    to_state VARCHAR(30) NULL,
    note VARCHAR(500) NULL,
    event_meta_json JSON NULL,
    occurred_at DATETIME(6) NOT NULL,
    KEY idx_report_workflow_job (tenant_id, report_job_id, occurred_at, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE report_analytics_pack_configs (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    is_deleted TINYINT(1) DEFAULT 0,
    deleted_at DATETIME(6) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    pack_code VARCHAR(30) NOT NULL,
    config_json JSON NOT NULL,
    formula_json JSON NOT NULL,
    UNIQUE KEY uk_report_analytics_pack (tenant_id, pack_code, is_deleted),
    KEY idx_report_analytics_pack (tenant_id, pack_code, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Report idempotency and concurrency safety
ALTER TABLE report_generation_jobs
    ADD COLUMN last_approve_idempotency_key VARCHAR(120) NULL AFTER publisher_user_id,
    ADD COLUMN last_publish_idempotency_key VARCHAR(120) NULL AFTER last_approve_idempotency_key;

CREATE INDEX idx_report_job_approve_idem ON report_generation_jobs (tenant_id, last_approve_idempotency_key, is_deleted);
CREATE INDEX idx_report_job_publish_idem ON report_generation_jobs (tenant_id, last_publish_idempotency_key, is_deleted);

-- Student-section consistency reconciliation
CREATE TEMPORARY TABLE tmp_first_section_per_class (
    tenant_id VARCHAR(50) NOT NULL,
    class_id BIGINT NOT NULL,
    first_section_id BIGINT NOT NULL,
    PRIMARY KEY (tenant_id, class_id)
);

INSERT INTO tmp_first_section_per_class (tenant_id, class_id, first_section_id)
SELECT
    s.tenant_id,
    s.class_id,
    MIN(s.id) AS first_section_id
FROM sections s
WHERE s.is_deleted = 0
GROUP BY s.tenant_id, s.class_id;

UPDATE students st
JOIN tmp_first_section_per_class fs
  ON st.tenant_id = fs.tenant_id
 AND st.class_id = fs.class_id
SET st.section_id = fs.first_section_id,
    st.updated_at = NOW()
WHERE st.is_deleted = 0
  AND (st.section_id IS NULL OR st.section_id = 0);

DROP TEMPORARY TABLE tmp_first_section_per_class;

UPDATE sections sec
LEFT JOIN (
    SELECT
        s.id AS section_id,
        COUNT(st.id) AS active_count
    FROM sections s
    LEFT JOIN students st
      ON st.tenant_id = s.tenant_id
     AND st.class_id = s.class_id
     AND st.section_id = s.id
     AND st.is_deleted = 0
     AND st.status = 'ACTIVE'
    WHERE s.is_deleted = 0
    GROUP BY s.id
) src ON src.section_id = sec.id
SET sec.student_count = COALESCE(src.active_count, 0),
    sec.updated_at = NOW()
WHERE sec.is_deleted = 0;

-- Notification outbox delivery reliability
CREATE TABLE IF NOT EXISTS notification_outbox (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    is_deleted BIT(1) NOT NULL DEFAULT b'0',
    deleted_at DATETIME NULL,
    deleted_by BIGINT NULL,
    event_type VARCHAR(64) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    recipient_user_id BIGINT NULL,
    recipient_phone_e164 VARCHAR(24) NULL,
    subject VARCHAR(200) NULL,
    body_text TEXT NOT NULL,
    dedupe_key VARCHAR(200) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    attempts INT NOT NULL DEFAULT 0,
    last_error VARCHAR(500) NULL,
    correlation_id VARCHAR(64) NULL
);

SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'notification_outbox'
      AND COLUMN_NAME = 'next_retry_at'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE notification_outbox ADD COLUMN next_retry_at DATETIME NULL',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Report job storage metadata (binary storage abstraction).
ALTER TABLE report_generation_jobs
  ADD COLUMN storage_provider VARCHAR(40) NULL AFTER content_size_bytes,
  ADD COLUMN file_storage_path VARCHAR(500) NULL AFTER storage_provider;

CREATE UNIQUE INDEX ux_report_job_request_id
  ON report_generation_jobs (tenant_id, request_id, is_deleted);

-- Normalize boolean flags to BIT(1) so Hibernate schema validation remains consistent.
ALTER TABLE leave_entitlement_policies
    MODIFY COLUMN is_active BIT(1) DEFAULT b'1',
    MODIFY COLUMN is_deleted BIT(1) DEFAULT b'0';

ALTER TABLE exam_templates
    MODIFY COLUMN is_active BIT(1) DEFAULT b'1',
    MODIFY COLUMN is_deleted BIT(1) DEFAULT b'0';

ALTER TABLE exam_template_components
    MODIFY COLUMN is_active BIT(1) DEFAULT b'1',
    MODIFY COLUMN is_deleted BIT(1) DEFAULT b'0',
    MODIFY COLUMN is_optional BIT(1) NOT NULL DEFAULT b'0';

ALTER TABLE exam_publication_snapshots
    MODIFY COLUMN is_active BIT(1) DEFAULT b'1',
    MODIFY COLUMN is_deleted BIT(1) DEFAULT b'0';

ALTER TABLE exam_event_logs
    MODIFY COLUMN is_active BIT(1) DEFAULT b'1',
    MODIFY COLUMN is_deleted BIT(1) DEFAULT b'0';

ALTER TABLE exam_notification_jobs
    MODIFY COLUMN is_active BIT(1) DEFAULT b'1',
    MODIFY COLUMN is_deleted BIT(1) DEFAULT b'0';

ALTER TABLE exam_bulk_operation_logs
    MODIFY COLUMN is_active BIT(1) DEFAULT b'1',
    MODIFY COLUMN is_deleted BIT(1) DEFAULT b'0';

ALTER TABLE report_templates
    MODIFY COLUMN is_active BIT(1) DEFAULT b'1',
    MODIFY COLUMN is_deleted BIT(1) DEFAULT b'0',
    MODIFY COLUMN is_system_template BIT(1) NOT NULL DEFAULT b'0';

ALTER TABLE report_generation_jobs
    MODIFY COLUMN is_active BIT(1) DEFAULT b'1',
    MODIFY COLUMN is_deleted BIT(1) DEFAULT b'0';

ALTER TABLE report_notification_templates
    MODIFY COLUMN is_active BIT(1) DEFAULT b'1',
    MODIFY COLUMN is_deleted BIT(1) DEFAULT b'0';

ALTER TABLE report_share_dispatches
    MODIFY COLUMN is_active BIT(1) DEFAULT b'1',
    MODIFY COLUMN is_deleted BIT(1) DEFAULT b'0';

ALTER TABLE report_publication_snapshots
    MODIFY COLUMN is_active BIT(1) DEFAULT b'1',
    MODIFY COLUMN is_deleted BIT(1) DEFAULT b'0';

ALTER TABLE report_workflow_event_logs
    MODIFY COLUMN is_active BIT(1) DEFAULT b'1',
    MODIFY COLUMN is_deleted BIT(1) DEFAULT b'0';

ALTER TABLE report_analytics_pack_configs
    MODIFY COLUMN is_active BIT(1) DEFAULT b'1',
    MODIFY COLUMN is_deleted BIT(1) DEFAULT b'0';

SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'notification_outbox'
      AND COLUMN_NAME = 'provider_message_id'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE notification_outbox ADD COLUMN provider_message_id VARCHAR(120) NULL',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'notification_outbox'
      AND COLUMN_NAME = 'provider_status'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE notification_outbox ADD COLUMN provider_status VARCHAR(40) NULL',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'notification_outbox'
      AND COLUMN_NAME = 'provider_error_code'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE notification_outbox ADD COLUMN provider_error_code VARCHAR(80) NULL',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'notification_outbox'
      AND COLUMN_NAME = 'dead_lettered_at'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE notification_outbox ADD COLUMN dead_lettered_at DATETIME NULL',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'notification_outbox'
      AND COLUMN_NAME = 'channel_cost_minor'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE notification_outbox ADD COLUMN channel_cost_minor INT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'notification_outbox'
      AND COLUMN_NAME = 'recipient_email'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE notification_outbox ADD COLUMN recipient_email VARCHAR(150) NULL AFTER recipient_phone_e164',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'notification_outbox'
      AND COLUMN_NAME = 'body_html'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE notification_outbox ADD COLUMN body_html LONGTEXT NULL AFTER body_text',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'notification_outbox'
      AND INDEX_NAME = 'idx_no_tenant_channel_status_created'
);
SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX idx_no_tenant_channel_status_created ON notification_outbox (tenant_id, channel, status, created_at)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
