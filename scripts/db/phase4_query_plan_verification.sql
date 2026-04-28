-- Phase 4 query plan verification checklist.
-- Goal: prove tenant + academic_year composite index usage on hot endpoints.
--
-- Run in MySQL shell:
--   mysql -u <user> -p <db> < scripts/db/phase4_query_plan_verification.sql

-- Replace these placeholders before execution.
SET @tenant_id := 'replace-tenant-id';
SET @academic_year_id := 1;
SET @student_id := 1;
SET @class_id := 1;
SET @user_id := 1;

-- 1) Attendance hot path
EXPLAIN FORMAT=TRADITIONAL
SELECT id, student_id, date, status
FROM attendance_records
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
  AND class_id = @class_id
ORDER BY date DESC
LIMIT 50;

-- 2) Marks hot path
EXPLAIN FORMAT=TRADITIONAL
SELECT id, exam_id, student_id, marks_obtained
FROM mark_records
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
  AND student_id = @student_id
ORDER BY id DESC
LIMIT 50;

-- 3) Fee transactions hot path
EXPLAIN FORMAT=TRADITIONAL
SELECT id, fee_payment_id, amount, event_type, created_at
FROM fee_transactions
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
ORDER BY created_at DESC
LIMIT 50;

-- 4) Notifications hot path
EXPLAIN FORMAT=TRADITIONAL
SELECT id, title, is_read, created_at
FROM notifications
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
  AND user_id = @user_id
ORDER BY created_at DESC
LIMIT 50;

-- 5) Leave hot path
EXPLAIN FORMAT=TRADITIONAL
SELECT id, applicant_user_id, start_date, end_date, status
FROM leave_requests
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
ORDER BY created_at DESC
LIMIT 50;

-- Manual acceptance criteria:
-- - key is an index starting with tenant_id + academic_year_id
-- - type is range/ref (not ALL)
-- - rows estimate is bounded and decreases after predicate tightening
