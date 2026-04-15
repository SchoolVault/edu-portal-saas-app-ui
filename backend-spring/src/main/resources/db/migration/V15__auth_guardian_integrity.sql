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
