-- =============================================================================
-- Flyway V8 — Salary disbursement, payment webhooks, and fee attempt indexes
--
-- Salary/outbox/payment audit tables and fee payment attempt indexing (old V9 + V10).
-- =============================================================================

-- -------------------------------------------------------------------------
-- Legacy source: V9__salary_outbox_payment_webhook.sql
-- Salary, outbox, payment webhook (old V9).
-- -------------------------------------------------------------------------

-- >>> Legacy V29: V29__import_export_jobs.sql
-- Async bulk import jobs (ZIP/CSV) with per-row outcomes for admin retry and auditing.

CREATE TABLE IF NOT EXISTS import_jobs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    created_by_user_id BIGINT,
    job_type VARCHAR(40) NOT NULL,
    status VARCHAR(24) NOT NULL,
    original_filename VARCHAR(512),
    total_rows INT NOT NULL DEFAULT 0,
    success_count INT NOT NULL DEFAULT 0,
    fail_count INT NOT NULL DEFAULT 0,
    started_at TIMESTAMP NULL,
    finished_at TIMESTAMP NULL,
    summary_message VARCHAR(4000),
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_import_jobs_tenant_created (tenant_id, created_at DESC),
    INDEX idx_import_jobs_status (tenant_id, status)
);

CREATE TABLE IF NOT EXISTS import_job_lines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    job_id BIGINT NOT NULL,
    line_index INT NOT NULL,
    status VARCHAR(24) NOT NULL,
    payload_json MEDIUMTEXT,
    error_message VARCHAR(4000),
    entity_type VARCHAR(40),
    entity_id BIGINT,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT fk_import_job_lines_job FOREIGN KEY (job_id) REFERENCES import_jobs (id) ON DELETE CASCADE,
    INDEX idx_import_job_lines_job (job_id, line_index)
);

-- >>> Legacy V30: V30__demo_import_jobs_seed.sql
-- Sample completed import job for St. Xavier's demo workspace (UI parity for import/export screen).
SET @stx := 'tenant_stxaviers_heritage_k7m2n9p4';

INSERT INTO import_jobs (tenant_id, created_by_user_id, job_type, status, original_filename, total_rows, success_count, fail_count,
                         started_at, finished_at, summary_message, is_active, is_deleted, created_at, updated_at)
SELECT @stx, NULL, 'STUDENTS', 'COMPLETED', 'admissions-batch-2026-demo.zip', 3, 2, 1,
       NOW() - INTERVAL 2 HOUR, NOW() - INTERVAL 2 HOUR + INTERVAL 3 MINUTE,
       'Processed 3 row(s): 2 succeeded, 1 failed.', TRUE, FALSE, NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM tenant_configs tc WHERE tc.tenant_id = @stx)
  AND NOT EXISTS (SELECT 1 FROM import_jobs j WHERE j.tenant_id = @stx AND j.original_filename = 'admissions-batch-2026-demo.zip');

SET @ij := (SELECT id FROM import_jobs WHERE tenant_id = @stx AND original_filename = 'admissions-batch-2026-demo.zip' ORDER BY id DESC LIMIT 1);

INSERT INTO import_job_lines (tenant_id, job_id, line_index, status, payload_json, error_message, entity_type, entity_id, is_active, is_deleted, created_at, updated_at)
SELECT @stx, @ij, 0, 'SUCCESS',
       '{"firstname":"Aarav","lastname":"Mehta","classid":"1","sectionid":"","admissionnumber":"DEMO-IMP-001","parentemail":"demo.parent1@example.com"}',
       NULL, 'STUDENT', NULL, TRUE, FALSE, NOW(), NOW()
WHERE @ij IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM import_job_lines l WHERE l.job_id = @ij AND l.line_index = 0);

INSERT INTO import_job_lines (tenant_id, job_id, line_index, status, payload_json, error_message, entity_type, entity_id, is_active, is_deleted, created_at, updated_at)
SELECT @stx, @ij, 1, 'FAILED',
       '{"firstname":"","lastname":"BrokenRow","classid":"1"}',
       'Missing required column: firstname', NULL, NULL, TRUE, FALSE, NOW(), NOW()
WHERE @ij IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM import_job_lines l WHERE l.job_id = @ij AND l.line_index = 1);

INSERT INTO import_job_lines (tenant_id, job_id, line_index, status, payload_json, error_message, entity_type, entity_id, is_active, is_deleted, created_at, updated_at)
SELECT @stx, @ij, 2, 'SUCCESS',
       '{"firstname":"Diya","lastname":"Ghosh","classid":"1","admissionnumber":"DEMO-IMP-002","parentemail":"demo.parent2@example.com"}',
       NULL, 'STUDENT', NULL, TRUE, FALSE, NOW(), NOW()
WHERE @ij IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM import_job_lines l WHERE l.job_id = @ij AND l.line_index = 2);

-- >>> Legacy V31: V31__demo_import_jobs_t1.sql
-- Import/export demo jobs for default Flyway tenant `t1` (admin@school.com) — UI always has sample jobs in QA / local without Java demo seed.
SET @t1 := 't1';
SET @t1_class := (SELECT CAST(id AS CHAR) FROM school_classes WHERE tenant_id = @t1 AND (is_deleted IS NULL OR is_deleted = FALSE) ORDER BY id LIMIT 1);

INSERT INTO import_jobs (tenant_id, created_by_user_id, job_type, status, original_filename, total_rows, success_count, fail_count,
                         started_at, finished_at, summary_message, is_active, is_deleted, created_at, updated_at)
SELECT @t1, (SELECT id FROM users WHERE tenant_id = @t1 AND email = 'admin@school.com' AND (is_deleted IS NULL OR is_deleted = FALSE) LIMIT 1),
       'STUDENTS', 'COMPLETED', 't1-admissions-demo.zip', 2, 1, 1,
       NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY + INTERVAL 5 MINUTE,
       'Processed 2 row(s): 1 succeeded, 1 failed.', TRUE, FALSE, NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM tenant_configs tc WHERE tc.tenant_id = @t1)
  AND NOT EXISTS (SELECT 1 FROM import_jobs j WHERE j.tenant_id = @t1 AND j.original_filename = 't1-admissions-demo.zip');

SET @ij_t1 := (SELECT id FROM import_jobs WHERE tenant_id = @t1 AND original_filename = 't1-admissions-demo.zip' ORDER BY id DESC LIMIT 1);

INSERT INTO import_job_lines (tenant_id, job_id, line_index, status, payload_json, error_message, entity_type, entity_id, is_active, is_deleted, created_at, updated_at)
SELECT @t1, @ij_t1, 0, 'SUCCESS',
       CONCAT('{"firstname":"Jordan","lastname":"Lee","classid":"', IFNULL(@t1_class, '1'), '","admissionnumber":"T1-DEMO-IMP-01","parentemail":"parent@school.com"}'),
       NULL, 'STUDENT', NULL, TRUE, FALSE, NOW(), NOW()
WHERE @ij_t1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM import_job_lines l WHERE l.job_id = @ij_t1 AND l.line_index = 0);

INSERT INTO import_job_lines (tenant_id, job_id, line_index, status, payload_json, error_message, entity_type, entity_id, is_active, is_deleted, created_at, updated_at)
SELECT @t1, @ij_t1, 1, 'FAILED',
       '{"firstname":"","lastname":"BadRow","classid":"1"}',
       'Missing required column: firstname', NULL, NULL, TRUE, FALSE, NOW(), NOW()
WHERE @ij_t1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM import_job_lines l WHERE l.job_id = @ij_t1 AND l.line_index = 1);

INSERT INTO import_jobs (tenant_id, created_by_user_id, job_type, status, original_filename, total_rows, success_count, fail_count,
                         started_at, finished_at, summary_message, is_active, is_deleted, created_at, updated_at)
SELECT @t1, (SELECT id FROM users WHERE tenant_id = @t1 AND email = 'admin@school.com' AND (is_deleted IS NULL OR is_deleted = FALSE) LIMIT 1),
       'TEACHERS', 'QUEUED', 't1-faculty-pending-demo.zip', 0, 0, 0,
       NULL, NULL, NULL, TRUE, FALSE, NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM tenant_configs tc WHERE tc.tenant_id = @t1)
  AND NOT EXISTS (SELECT 1 FROM import_jobs j WHERE j.tenant_id = @t1 AND j.original_filename = 't1-faculty-pending-demo.zip');

-- -------------------------------------------------------------------------
-- Legacy source: V10__fee_attempt_indexes.sql
-- Fee attempt indexes (old V10).
-- -------------------------------------------------------------------------

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
