-- Enforce tenant-scoped phone uniqueness for active vs soft-deleted records.
-- This hardens profile-phone update race safety and keeps OTP login lookup deterministic.

-- Normalize blank phones so unique key only applies to real numbers.
UPDATE users
SET phone = NULL
WHERE phone IS NOT NULL
  AND TRIM(phone) = '';

-- Legacy rows may have null soft-delete flags; normalize before indexing.
UPDATE users
SET is_deleted = 0
WHERE is_deleted IS NULL;

-- One active row per (tenant, phone). Soft-deleted copies remain allowed.
CREATE UNIQUE INDEX ux_users_tenant_phone_is_deleted
  ON users (tenant_id, phone, is_deleted);
