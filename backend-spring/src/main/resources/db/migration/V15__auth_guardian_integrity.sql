-- V15: Integrity for phone-primary auth, OTP rate queries, and guardian-student graph.
-- Requires MySQL 8.0.13+ (functional indexes). Apply after V14.

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
