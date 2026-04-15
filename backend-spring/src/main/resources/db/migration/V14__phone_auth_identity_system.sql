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
