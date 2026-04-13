-- Squashed Flyway baseline (part 10/10): fee_attempt_indexes
-- Built by scripts/build_squashed_flyway_migrations.py — do not edit by hand; regenerate from legacy migrations.

-- >>> Legacy V32: V32__outbox_salary_audit_columns.sql
-- Align notification_outbox and salary_disbursement_attempts with BaseEntity (created_by, updated_by).
-- V28 created these tables without audit user columns; Hibernate schema validation in prod requires them.

ALTER TABLE notification_outbox
    ADD COLUMN created_by VARCHAR(100) NULL AFTER updated_at,
    ADD COLUMN updated_by VARCHAR(100) NULL AFTER created_by;

ALTER TABLE salary_disbursement_attempts
    ADD COLUMN created_by VARCHAR(100) NULL AFTER updated_at,
    ADD COLUMN updated_by VARCHAR(100) NULL AFTER created_by;

-- >>> Legacy V33: V33__payment_webhook_events.sql
-- Idempotent storage for payment provider webhooks (Razorpay, etc.)

CREATE TABLE payment_webhook_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(64),
    provider VARCHAR(32) NOT NULL,
    payload_sha256 VARCHAR(64) NOT NULL,
    external_event_id VARCHAR(255),
    status VARCHAR(32) NOT NULL,
    http_status INT,
    detail VARCHAR(512),
    raw_body MEDIUMTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    UNIQUE KEY uk_provider_payload_hash (provider, payload_sha256),
    INDEX idx_pwe_tenant_created (tenant_id, created_at),
    INDEX idx_pwe_provider_event (provider, external_event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- >>> Legacy V34: V34__fee_payment_attempt_provider_order_index.sql
-- Speed webhook + reconciliation lookups by gateway order id
CREATE INDEX idx_fpa_provider_order ON fee_payment_attempts (provider, provider_order_id);
