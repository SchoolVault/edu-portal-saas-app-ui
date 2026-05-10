-- Normalize legacy guardian primary_phone to 10-digit India national (matches users.phone / import pipeline).
-- Skips portal placeholders and already-short numerics. Safe to re-run: second pass is mostly no-op.

UPDATE guardians
SET primary_phone = SUBSTRING(primary_phone, 5),
    updated_at = NOW(6)
WHERE is_deleted = 0
  AND primary_phone IS NOT NULL
  AND (CHAR_LENGTH(primary_phone) < 9 OR LEFT(primary_phone, 9) <> 'UNLINKED_')
  AND primary_phone LIKE '+91-%'
  AND CHAR_LENGTH(primary_phone) = 14
  AND primary_phone REGEXP '^\\+91-[6-9][0-9]{9}$';

UPDATE guardians
SET primary_phone = SUBSTRING(REPLACE(primary_phone, '+', ''), 3),
    updated_at = NOW(6)
WHERE is_deleted = 0
  AND primary_phone IS NOT NULL
  AND (CHAR_LENGTH(primary_phone) < 9 OR LEFT(primary_phone, 9) <> 'UNLINKED_')
  AND primary_phone REGEXP '^\\+91[6-9][0-9]{9}$';
