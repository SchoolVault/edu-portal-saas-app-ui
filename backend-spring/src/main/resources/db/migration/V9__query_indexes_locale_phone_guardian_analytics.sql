-- =============================================================================
-- Flyway V9 — Query tuning, user locale, phone auth, guardian integrity, analytics stub
--
-- Performance indexes, preferred_locale, list paging indexes, phone/identity auth,
-- guardian FK integrity, warehouse stub (old V11–V15 + V17; no legacy V16).
-- =============================================================================

-- -------------------------------------------------------------------------
-- Legacy source: V11__query_performance_indexes.sql
-- Query performance indexes (old V11).
-- -------------------------------------------------------------------------

-- High-traffic lookup patterns: tenant + soft-delete, fees, parents, notifications, checkout.
-- Additive Flyway version; runs once per database (duplicate index names would fail on re-apply).

-- ========== Core tenant + is_deleted (list / filter by active rows) ==========
CREATE INDEX idx_users_tenant_deleted ON users (tenant_id, is_deleted);
CREATE INDEX idx_users_tenant_role_deleted ON users (tenant_id, role, is_deleted);

CREATE INDEX idx_students_tenant_deleted ON students (tenant_id, is_deleted);
CREATE INDEX idx_students_parent_deleted ON students (tenant_id, parent_id, is_deleted);
CREATE INDEX idx_students_class_deleted ON students (tenant_id, class_id, is_deleted);
CREATE INDEX idx_students_section_deleted ON students (tenant_id, class_id, section_id, is_deleted);

CREATE INDEX idx_teachers_tenant_deleted ON teachers (tenant_id, is_deleted);
CREATE INDEX idx_teachers_user_deleted ON teachers (tenant_id, user_id, is_deleted);

CREATE INDEX idx_academic_years_tenant_deleted ON academic_years (tenant_id, is_deleted);
CREATE INDEX idx_school_classes_tenant_deleted ON school_classes (tenant_id, is_deleted);
CREATE INDEX idx_sections_tenant_class_deleted ON sections (tenant_id, class_id, is_deleted);

-- ========== Fees (bulk assign, reminders, parent portal) ==========
CREATE INDEX idx_fee_structures_tenant_deleted ON fee_structures (tenant_id, is_deleted);
CREATE INDEX idx_fee_structures_class_deleted ON fee_structures (tenant_id, class_id, is_deleted);

CREATE INDEX idx_fee_components_structure ON fee_components (tenant_id, fee_structure_id, is_deleted);

CREATE INDEX idx_fee_payments_tenant_deleted ON fee_payments (tenant_id, is_deleted);
CREATE INDEX idx_fee_payments_tenant_status_deleted ON fee_payments (tenant_id, status, is_deleted);
CREATE INDEX idx_fee_payments_student_deleted ON fee_payments (tenant_id, student_id, is_deleted);
-- One issued receipt per tenant (multiple NULL receipt_number allowed in MySQL)
CREATE UNIQUE INDEX uq_fee_payment_tenant_receipt ON fee_payments (tenant_id, receipt_number);
-- Bulk duplicate check + reminder scans (leading columns match WHERE tenant + deleted + structure + due)
CREATE INDEX idx_fee_payments_obligation_lookup ON fee_payments (tenant_id, is_deleted, fee_structure_id, due_date, student_id);

-- ========== Fee checkout / webhooks ==========
CREATE INDEX idx_fpa_checkout ON fee_payment_attempts (tenant_id, checkout_token, is_deleted);
CREATE INDEX idx_fpa_tenant_provider_order ON fee_payment_attempts (tenant_id, provider, provider_order_id, is_deleted);
CREATE INDEX idx_fpa_tenant_provider_payment ON fee_payment_attempts (tenant_id, provider, provider_payment_id, is_deleted);
CREATE INDEX idx_fpa_parent_user ON fee_payment_attempts (tenant_id, parent_user_id, is_deleted);

-- ========== Notifications (in-app inbox) ==========
CREATE INDEX idx_notifications_inbox ON notifications (tenant_id, user_id, is_deleted, is_read);
CREATE INDEX idx_notifications_id_lookup ON notifications (tenant_id, user_id, id, is_deleted);

-- ========== Chat (inbox / participants) ==========
CREATE INDEX idx_chat_conv_tenant_deleted ON chat_conversations (tenant_id, is_deleted);
CREATE INDEX idx_chat_participant_conv_deleted ON chat_participants (tenant_id, conversation_id, is_deleted);
CREATE INDEX idx_chat_participant_user_deleted ON chat_participants (tenant_id, user_id, is_deleted);
-- chat_messages already has idx_chat_msg_conv (tenant_id, conversation_id, id) in V2

-- ========== Documents, attendance, marks, exams ==========
CREATE INDEX idx_documents_tenant_deleted ON documents (tenant_id, is_deleted);
CREATE INDEX idx_attendance_tenant_deleted ON attendance_records (tenant_id, is_deleted);
CREATE INDEX idx_marks_tenant_deleted ON mark_records (tenant_id, is_deleted);
CREATE INDEX idx_exams_tenant_deleted ON exams (tenant_id, is_deleted);
CREATE INDEX idx_timetable_tenant_deleted ON timetable_entries (tenant_id, is_deleted);

-- ========== Library / transport / announcements ==========
CREATE INDEX idx_books_tenant_deleted ON books (tenant_id, is_deleted);
CREATE INDEX idx_book_issues_tenant_deleted ON book_issues (tenant_id, is_deleted);
CREATE INDEX idx_transport_routes_tenant_deleted ON transport_routes (tenant_id, is_deleted);
CREATE INDEX idx_route_stops_route ON route_stops (tenant_id, route_id, is_deleted);
CREATE INDEX idx_announcements_tenant_deleted ON announcements (tenant_id, is_deleted);

-- ========== Payslips / salary / hostel ==========
CREATE INDEX idx_payslips_tenant_deleted ON payslips (tenant_id, is_deleted);
CREATE INDEX idx_hostel_rooms_tenant_deleted ON hostel_rooms (tenant_id, is_deleted);
CREATE INDEX idx_hostel_alloc_tenant_deleted ON hostel_allocations (tenant_id, is_deleted);

-- ========== Import jobs (admin) ==========
CREATE INDEX idx_import_jobs_tenant_deleted ON import_jobs (tenant_id, is_deleted);

-- ========== Outbox, guardians, leave, assignments, legacy messaging ==========
CREATE INDEX idx_notification_outbox_worker ON notification_outbox (tenant_id, status, is_deleted, created_at);
CREATE INDEX idx_salary_disb_attempts_status ON salary_disbursement_attempts (tenant_id, status, is_deleted);

CREATE INDEX idx_guardians_tenant_deleted ON guardians (tenant_id, is_deleted);
CREATE INDEX idx_sgm_student_deleted ON student_guardian_mappings (tenant_id, student_id, is_deleted);
CREATE INDEX idx_sgm_guardian_deleted ON student_guardian_mappings (tenant_id, guardian_id, is_deleted);

CREATE INDEX idx_cta_tenant_deleted ON class_teacher_assignments (tenant_id, is_deleted);
CREATE INDEX idx_sta_tenant_deleted ON subject_teacher_assignments (tenant_id, is_deleted);

CREATE INDEX idx_leave_tenant_status_deleted ON leave_requests (tenant_id, status, is_deleted);

CREATE INDEX idx_fee_reminder_tenant_status_deleted ON fee_reminder_queue (tenant_id, status, is_deleted);

CREATE INDEX idx_ops_staff_tenant_deleted ON operational_staff (tenant_id, is_deleted);

CREATE INDEX idx_student_transport_tenant_deleted ON student_transport_mapping (tenant_id, is_deleted);

CREATE INDEX idx_messages_tenant_deleted ON messages (tenant_id, is_deleted);
CREATE INDEX idx_refresh_tokens_user_deleted ON refresh_tokens (tenant_id, user_id, is_deleted);

CREATE INDEX idx_import_job_lines_tenant_deleted ON import_job_lines (tenant_id, job_id, is_deleted);

CREATE INDEX idx_hostels_tenant_deleted ON hostels (tenant_id, is_deleted);

-- -------------------------------------------------------------------------
-- Legacy source: V12__user_preferred_locale.sql
-- User preferred locale (old V12).
-- -------------------------------------------------------------------------

-- Per-user UI language (BCP 47 language tag, typically en / hi; extensible).
ALTER TABLE users
    ADD COLUMN preferred_locale VARCHAR(16) NOT NULL DEFAULT 'en' COMMENT 'Interface language (e.g. en, hi)' AFTER avatar;

-- -------------------------------------------------------------------------
-- Legacy source: V13__list_paging_query_indexes.sql
-- List paging indexes (old V13).
-- -------------------------------------------------------------------------

-- Supporting indexes for newly exposed paged list APIs (tenant + sort / filter columns).

CREATE INDEX idx_exams_tenant_deleted_start ON exams (tenant_id, is_deleted, start_date);
CREATE INDEX idx_exams_tenant_deleted_status ON exams (tenant_id, is_deleted, status);

CREATE INDEX idx_payslips_tenant_period ON payslips (tenant_id, is_deleted, year, payroll_month);
CREATE INDEX idx_payslips_tenant_teacher_period ON payslips (tenant_id, teacher_id, is_deleted, year, payroll_month);

CREATE INDEX idx_transport_routes_tenant_name ON transport_routes (tenant_id, is_deleted, name);

CREATE INDEX idx_visitor_logs_checkin ON visitor_logs (tenant_id, is_deleted, check_in_at);
CREATE INDEX idx_gate_passes_valid_from ON gate_passes (tenant_id, is_deleted, valid_from);
CREATE INDEX idx_inventory_items_name ON inventory_items (tenant_id, is_deleted, name);

CREATE INDEX idx_notifications_inbox_created ON notifications (tenant_id, user_id, is_deleted, created_at);

CREATE INDEX idx_tenant_configs_school_lookup ON tenant_configs (is_deleted, school_name, school_code);

CREATE INDEX idx_salary_structures_tenant_teacher ON salary_structures (tenant_id, is_deleted, teacher_name);

-- -------------------------------------------------------------------------
-- Legacy source: V14__phone_auth_identity_system.sql
-- Phone auth / identity (old V14).
-- -------------------------------------------------------------------------

-- V14: Phone-primary auth + OTP (extends V1–V13). Reuses guardians + student_guardian_mappings only.

-- ---------------------------------------------------------------------------
-- 1) users — optional email (secondary), phone as primary channel
-- ---------------------------------------------------------------------------
ALTER TABLE users
  MODIFY COLUMN email VARCHAR(150) NULL COMMENT 'Secondary; optional when phone is primary',
  MODIFY COLUMN phone VARCHAR(32) NULL COMMENT 'Primary auth channel',
  ADD COLUMN phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'EMAIL' COMMENT 'EMAIL, PHONE, SSO',
  ADD COLUMN account_locked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN last_login_at TIMESTAMP NULL,
  ADD COLUMN password_changed_at TIMESTAMP NULL;

CREATE INDEX idx_users_phone_tenant ON users (phone, tenant_id, is_deleted);
CREATE INDEX idx_users_school_phone ON users (school_code, phone, is_deleted);

-- ---------------------------------------------------------------------------
-- 2) otp_verifications — single auxiliary table for OTP / exchange token
-- ---------------------------------------------------------------------------
CREATE TABLE otp_verifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    otp_code VARCHAR(16) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL DEFAULT 'SMS',
    provider VARCHAR(30) NOT NULL DEFAULT 'MOCK',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exchange_token VARCHAR(64) NULL COMMENT 'One-time post-verify token for JWT exchange',
    ip_address VARCHAR(50) NULL,
    user_agent VARCHAR(500) NULL,
    request_id VARCHAR(100) NULL,
    provider_message_id VARCHAR(255) NULL,
    provider_status VARCHAR(50) NULL,
    provider_error TEXT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_otp_phone_status (phone, status, expires_at),
    INDEX idx_otp_tenant (tenant_id, created_at),
    INDEX idx_otp_expires (expires_at, status),
    INDEX idx_otp_request (request_id),
    INDEX idx_otp_exchange (exchange_token, tenant_id, phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 3) Guardian rows for parent portal users (reuses existing guardians table)
-- ---------------------------------------------------------------------------
INSERT INTO guardians (tenant_id, full_name, occupation, primary_phone, user_id, is_active, is_deleted, created_at, updated_at, created_by, updated_by)
SELECT DISTINCT u.tenant_id, u.name, NULL, COALESCE(NULLIF(TRIM(u.phone), ''), CONCAT('UNLINKED_', u.id)), u.id, TRUE, FALSE, NOW(), NOW(), 'V14', 'V14'
FROM users u
WHERE u.role = 'PARENT' AND (u.is_deleted IS NULL OR u.is_deleted = FALSE)
  AND NOT EXISTS (
    SELECT 1 FROM guardians g
    WHERE g.tenant_id = u.tenant_id AND g.user_id = u.id AND (g.is_deleted IS NULL OR g.is_deleted = FALSE)
  );

-- ---------------------------------------------------------------------------
-- 4) student_guardian_mappings from students.parent_id → guardians.user_id
-- ---------------------------------------------------------------------------
INSERT INTO student_guardian_mappings (
    tenant_id, student_id, guardian_id, relation_type, is_primary, is_emergency_contact,
    is_active, is_deleted, created_at, updated_at, created_by, updated_by
)
SELECT s.tenant_id, s.id, g.id, 'GUARDIAN', TRUE, FALSE, TRUE, FALSE, NOW(), NOW(), 'V14', 'V14'
FROM students s
INNER JOIN guardians g ON g.tenant_id = s.tenant_id AND g.user_id = s.parent_id
  AND (g.is_deleted IS NULL OR g.is_deleted = FALSE)
WHERE s.parent_id IS NOT NULL AND (s.is_deleted IS NULL OR s.is_deleted = FALSE)
  AND NOT EXISTS (
    SELECT 1 FROM student_guardian_mappings m
    WHERE m.tenant_id = s.tenant_id AND m.student_id = s.id AND m.guardian_id = g.id
      AND (m.is_deleted IS NULL OR m.is_deleted = FALSE)
  );

-- -------------------------------------------------------------------------
-- Legacy source: V15__auth_guardian_integrity.sql
-- Guardian / auth integrity (old V15).
-- -------------------------------------------------------------------------

-- V15: Integrity for phone-primary auth, OTP rate queries, and guardian-student graph.
-- Requires MySQL 8.0.13+ (functional indexes). Apply after V14.
--
-- PREFLIGHT: Normalize duplicate rows that would make the UNIQUE functional indexes fail.
-- Safe on empty DB (no-ops). Idempotent for typical demo / re-seed / legacy data drift.

-- ---------------------------------------------------------------------------
-- P0) Duplicate ACTIVE users per (tenant_id, TRIM(phone)) — repoint FKs, then soft-delete losers
-- ---------------------------------------------------------------------------

-- Drop chat participant rows that would collide with uq_chat_participant after user merge
-- (Derived table avoids MySQL ER 1093: cannot DELETE ... WHERE EXISTS (same table).)
DELETE FROM chat_participants
WHERE id IN (
    SELECT id FROM (
        SELECT cp.id
        FROM chat_participants cp
        INNER JOIN users u ON cp.user_id = u.id
        INNER JOIN (
            SELECT tenant_id, TRIM(phone) AS ph, MIN(id) AS keep_uid
            FROM users
            WHERE IFNULL(is_deleted, 0) = 0
              AND phone IS NOT NULL
              AND CHAR_LENGTH(TRIM(phone)) > 0
            GROUP BY tenant_id, TRIM(phone)
            HAVING COUNT(*) > 1
        ) dup ON u.tenant_id = dup.tenant_id AND TRIM(u.phone) = dup.ph AND u.id <> dup.keep_uid
        WHERE EXISTS (
            SELECT 1 FROM chat_participants o
            WHERE o.tenant_id = cp.tenant_id
              AND o.conversation_id = cp.conversation_id
              AND o.user_id = dup.keep_uid
              AND IFNULL(o.is_deleted, 0) = 0
              AND o.id <> cp.id
        )
    ) to_delete
);

UPDATE guardians g
INNER JOIN users u ON g.user_id = u.id
INNER JOIN (
    SELECT tenant_id, TRIM(phone) AS ph, MIN(id) AS keep_uid
    FROM users
    WHERE IFNULL(is_deleted, 0) = 0
      AND phone IS NOT NULL
      AND CHAR_LENGTH(TRIM(phone)) > 0
    GROUP BY tenant_id, TRIM(phone)
    HAVING COUNT(*) > 1
) dup ON u.tenant_id = dup.tenant_id AND TRIM(u.phone) = dup.ph AND u.id <> dup.keep_uid
SET g.user_id = dup.keep_uid
WHERE IFNULL(g.is_deleted, 0) = 0;

UPDATE students s
INNER JOIN users u ON s.parent_id = u.id
INNER JOIN (
    SELECT tenant_id, TRIM(phone) AS ph, MIN(id) AS keep_uid
    FROM users
    WHERE IFNULL(is_deleted, 0) = 0
      AND phone IS NOT NULL
      AND CHAR_LENGTH(TRIM(phone)) > 0
    GROUP BY tenant_id, TRIM(phone)
    HAVING COUNT(*) > 1
) dup ON u.tenant_id = dup.tenant_id AND TRIM(u.phone) = dup.ph AND u.id <> dup.keep_uid
SET s.parent_id = dup.keep_uid
WHERE IFNULL(s.is_deleted, 0) = 0;

UPDATE teachers t
INNER JOIN users u ON t.user_id = u.id
INNER JOIN (
    SELECT tenant_id, TRIM(phone) AS ph, MIN(id) AS keep_uid
    FROM users
    WHERE IFNULL(is_deleted, 0) = 0
      AND phone IS NOT NULL
      AND CHAR_LENGTH(TRIM(phone)) > 0
    GROUP BY tenant_id, TRIM(phone)
    HAVING COUNT(*) > 1
) dup ON u.tenant_id = dup.tenant_id AND TRIM(u.phone) = dup.ph AND u.id <> dup.keep_uid
SET t.user_id = dup.keep_uid
WHERE IFNULL(t.is_deleted, 0) = 0;

UPDATE notifications n
INNER JOIN users u ON n.user_id = u.id
INNER JOIN (
    SELECT tenant_id, TRIM(phone) AS ph, MIN(id) AS keep_uid
    FROM users
    WHERE IFNULL(is_deleted, 0) = 0
      AND phone IS NOT NULL
      AND CHAR_LENGTH(TRIM(phone)) > 0
    GROUP BY tenant_id, TRIM(phone)
    HAVING COUNT(*) > 1
) dup ON u.tenant_id = dup.tenant_id AND TRIM(u.phone) = dup.ph AND u.id <> dup.keep_uid
SET n.user_id = dup.keep_uid
WHERE IFNULL(n.is_deleted, 0) = 0;

UPDATE refresh_tokens r
INNER JOIN users u ON r.user_id = u.id
INNER JOIN (
    SELECT tenant_id, TRIM(phone) AS ph, MIN(id) AS keep_uid
    FROM users
    WHERE IFNULL(is_deleted, 0) = 0
      AND phone IS NOT NULL
      AND CHAR_LENGTH(TRIM(phone)) > 0
    GROUP BY tenant_id, TRIM(phone)
    HAVING COUNT(*) > 1
) dup ON u.tenant_id = dup.tenant_id AND TRIM(u.phone) = dup.ph AND u.id <> dup.keep_uid
SET r.user_id = dup.keep_uid
WHERE IFNULL(r.is_deleted, 0) = 0;

UPDATE fee_payment_attempts f
INNER JOIN users u ON f.parent_user_id = u.id
INNER JOIN (
    SELECT tenant_id, TRIM(phone) AS ph, MIN(id) AS keep_uid
    FROM users
    WHERE IFNULL(is_deleted, 0) = 0
      AND phone IS NOT NULL
      AND CHAR_LENGTH(TRIM(phone)) > 0
    GROUP BY tenant_id, TRIM(phone)
    HAVING COUNT(*) > 1
) dup ON u.tenant_id = dup.tenant_id AND TRIM(u.phone) = dup.ph AND u.id <> dup.keep_uid
SET f.parent_user_id = dup.keep_uid;

UPDATE leave_requests l
INNER JOIN users u ON l.applicant_user_id = u.id
INNER JOIN (
    SELECT tenant_id, TRIM(phone) AS ph, MIN(id) AS keep_uid
    FROM users
    WHERE IFNULL(is_deleted, 0) = 0
      AND phone IS NOT NULL
      AND CHAR_LENGTH(TRIM(phone)) > 0
    GROUP BY tenant_id, TRIM(phone)
    HAVING COUNT(*) > 1
) dup ON u.tenant_id = dup.tenant_id AND TRIM(u.phone) = dup.ph AND u.id <> dup.keep_uid
SET l.applicant_user_id = dup.keep_uid
WHERE IFNULL(l.is_deleted, 0) = 0;

UPDATE leave_requests l
INNER JOIN users u ON l.approver_user_id = u.id
INNER JOIN (
    SELECT tenant_id, TRIM(phone) AS ph, MIN(id) AS keep_uid
    FROM users
    WHERE IFNULL(is_deleted, 0) = 0
      AND phone IS NOT NULL
      AND CHAR_LENGTH(TRIM(phone)) > 0
    GROUP BY tenant_id, TRIM(phone)
    HAVING COUNT(*) > 1
) dup ON u.tenant_id = dup.tenant_id AND TRIM(u.phone) = dup.ph AND u.id <> dup.keep_uid
SET l.approver_user_id = dup.keep_uid
WHERE l.approver_user_id IS NOT NULL AND IFNULL(l.is_deleted, 0) = 0;

UPDATE chat_participants cp
INNER JOIN users u ON cp.user_id = u.id
INNER JOIN (
    SELECT tenant_id, TRIM(phone) AS ph, MIN(id) AS keep_uid
    FROM users
    WHERE IFNULL(is_deleted, 0) = 0
      AND phone IS NOT NULL
      AND CHAR_LENGTH(TRIM(phone)) > 0
    GROUP BY tenant_id, TRIM(phone)
    HAVING COUNT(*) > 1
) dup ON u.tenant_id = dup.tenant_id AND TRIM(u.phone) = dup.ph AND u.id <> dup.keep_uid
SET cp.user_id = dup.keep_uid
WHERE IFNULL(cp.is_deleted, 0) = 0;

UPDATE chat_messages m
INNER JOIN users u ON m.sender_user_id = u.id
INNER JOIN (
    SELECT tenant_id, TRIM(phone) AS ph, MIN(id) AS keep_uid
    FROM users
    WHERE IFNULL(is_deleted, 0) = 0
      AND phone IS NOT NULL
      AND CHAR_LENGTH(TRIM(phone)) > 0
    GROUP BY tenant_id, TRIM(phone)
    HAVING COUNT(*) > 1
) dup ON u.tenant_id = dup.tenant_id AND TRIM(u.phone) = dup.ph AND u.id <> dup.keep_uid
SET m.sender_user_id = dup.keep_uid
WHERE IFNULL(m.is_deleted, 0) = 0;

UPDATE import_jobs j
INNER JOIN users u ON j.created_by_user_id = u.id
INNER JOIN (
    SELECT tenant_id, TRIM(phone) AS ph, MIN(id) AS keep_uid
    FROM users
    WHERE IFNULL(is_deleted, 0) = 0
      AND phone IS NOT NULL
      AND CHAR_LENGTH(TRIM(phone)) > 0
    GROUP BY tenant_id, TRIM(phone)
    HAVING COUNT(*) > 1
) dup ON u.tenant_id = dup.tenant_id AND TRIM(u.phone) = dup.ph AND u.id <> dup.keep_uid
SET j.created_by_user_id = dup.keep_uid
WHERE j.created_by_user_id IS NOT NULL;

UPDATE operational_staff o
INNER JOIN users u ON o.user_id = u.id
INNER JOIN (
    SELECT tenant_id, TRIM(phone) AS ph, MIN(id) AS keep_uid
    FROM users
    WHERE IFNULL(is_deleted, 0) = 0
      AND phone IS NOT NULL
      AND CHAR_LENGTH(TRIM(phone)) > 0
    GROUP BY tenant_id, TRIM(phone)
    HAVING COUNT(*) > 1
) dup ON u.tenant_id = dup.tenant_id AND TRIM(u.phone) = dup.ph AND u.id <> dup.keep_uid
SET o.user_id = dup.keep_uid
WHERE o.user_id IS NOT NULL AND IFNULL(o.is_deleted, 0) = 0;

UPDATE gate_passes gp
INNER JOIN users u ON gp.issued_by_user_id = u.id
INNER JOIN (
    SELECT tenant_id, TRIM(phone) AS ph, MIN(id) AS keep_uid
    FROM users
    WHERE IFNULL(is_deleted, 0) = 0
      AND phone IS NOT NULL
      AND CHAR_LENGTH(TRIM(phone)) > 0
    GROUP BY tenant_id, TRIM(phone)
    HAVING COUNT(*) > 1
) dup ON u.tenant_id = dup.tenant_id AND TRIM(u.phone) = dup.ph AND u.id <> dup.keep_uid
SET gp.issued_by_user_id = dup.keep_uid
WHERE gp.issued_by_user_id IS NOT NULL AND IFNULL(gp.is_deleted, 0) = 0;

UPDATE users u
INNER JOIN (
    SELECT tenant_id, TRIM(phone) AS ph, MIN(id) AS keep_uid
    FROM users
    WHERE IFNULL(is_deleted, 0) = 0
      AND phone IS NOT NULL
      AND CHAR_LENGTH(TRIM(phone)) > 0
    GROUP BY tenant_id, TRIM(phone)
    HAVING COUNT(*) > 1
) dup ON u.tenant_id = dup.tenant_id AND TRIM(u.phone) = dup.ph AND u.id <> dup.keep_uid
SET u.is_deleted = 1, u.updated_at = CURRENT_TIMESTAMP(6), u.updated_by = 'V15_dedupe';

-- ---------------------------------------------------------------------------
-- P1) Guardian graph: repoint mappings, collapse duplicate SGM rows, drop extra guardian rows
-- ---------------------------------------------------------------------------

UPDATE student_guardian_mappings m
INNER JOIN guardians g ON m.guardian_id = g.id AND m.tenant_id = g.tenant_id
INNER JOIN (
    SELECT tenant_id, user_id, MIN(id) AS keep_gid
    FROM guardians
    WHERE IFNULL(is_deleted, 0) = 0
      AND user_id IS NOT NULL
    GROUP BY tenant_id, user_id
    HAVING COUNT(*) > 1
) d ON g.tenant_id = d.tenant_id AND g.user_id = d.user_id
SET m.guardian_id = d.keep_gid
WHERE g.id > d.keep_gid
  AND IFNULL(m.is_deleted, 0) = 0;

UPDATE student_guardian_mappings m
INNER JOIN (
    SELECT tenant_id, student_id, guardian_id, MIN(id) AS keep_id
    FROM student_guardian_mappings
    WHERE IFNULL(is_deleted, 0) = 0
    GROUP BY tenant_id, student_id, guardian_id
    HAVING COUNT(*) > 1
) d ON m.tenant_id = d.tenant_id
    AND m.student_id = d.student_id
    AND m.guardian_id = d.guardian_id
    AND m.id > d.keep_id
SET m.is_deleted = 1,
    m.is_active = 0,
    m.updated_at = CURRENT_TIMESTAMP(6),
    m.updated_by = 'V15_dedupe';

UPDATE guardians g
INNER JOIN (
    SELECT tenant_id, user_id, MIN(id) AS keep_id
    FROM guardians
    WHERE IFNULL(is_deleted, 0) = 0
      AND user_id IS NOT NULL
    GROUP BY tenant_id, user_id
    HAVING COUNT(*) > 1
) d ON g.tenant_id = d.tenant_id AND g.user_id = d.user_id AND g.id > d.keep_id
SET g.is_deleted = 1,
    g.is_active = 0,
    g.updated_at = CURRENT_TIMESTAMP(6),
    g.updated_by = 'V15_dedupe';

-- ---------------------------------------------------------------------------
-- 1) users — at most one ACTIVE row per (tenant_id, trimmed phone) when phone is set
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX uk_users_tenant_phone_active
ON users ((
    IF(
        IFNULL(is_deleted, 0) = 0
        AND phone IS NOT NULL
        AND CHAR_LENGTH(TRIM(phone)) > 0,
        CONCAT(tenant_id, '|', TRIM(phone)),
        NULL
    )
));

-- ---------------------------------------------------------------------------
-- 2) guardians — at most one ACTIVE profile per (tenant_id, portal user_id)
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX uk_guardians_tenant_user_active
ON guardians ((
    IF(
        IFNULL(is_deleted, 0) = 0
        AND user_id IS NOT NULL,
        CONCAT(tenant_id, '|', user_id),
        NULL
    )
));

-- ---------------------------------------------------------------------------
-- 3) student_guardian_mappings — no duplicate ACTIVE (student, guardian) pair
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX uk_sgm_student_guardian_active
ON student_guardian_mappings ((
    IF(
        IFNULL(is_deleted, 0) = 0,
        CONCAT(tenant_id, '|', student_id, '|', guardian_id),
        NULL
    )
));

-- ---------------------------------------------------------------------------
-- 4) otp_verifications — rate-limit / recent-send lookups by tenant + phone
-- ---------------------------------------------------------------------------
CREATE INDEX idx_otp_tenant_phone_created ON otp_verifications (tenant_id, phone, created_at);

-- -------------------------------------------------------------------------
-- Legacy source: V17__analytics_warehouse_stub.sql
-- Analytics warehouse stub (old V17).
-- -------------------------------------------------------------------------

-- Optional OLAP / ETL anchor table on primary DB until a separate warehouse is provisioned
CREATE TABLE IF NOT EXISTS analytics_etl_heartbeat (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ran_at DATETIME(6) NOT NULL,
    job_name VARCHAR(128) NOT NULL,
    note VARCHAR(512) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
