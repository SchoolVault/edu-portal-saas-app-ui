-- Phase 3 production-ready data partitioning (logical partition by academic year).
--
-- Why this file uses archive partitioning (not native MySQL PARTITION):
-- Your current schema uses PRIMARY KEY (id) on scoped tables. Native partition by
-- academic_year_id requires partition key in every unique/primary key, which would
-- force high-risk PK/entity refactors.
--
-- This script is safe with current schema and gives ERP-grade hot/cold separation:
-- - keep hot/current years in OLTP tables
-- - move old years to *_archive tables
-- - query cross-year analytics from archive/warehouse paths

-- =============================================================================
-- STEP 0: PARAMS (SET BEFORE EXECUTION)
-- =============================================================================
-- Example:
-- SET @tenant_id = 't1';
-- SET @archive_academic_year_id = 1;
-- SET @batch_size = 5000;

SET @tenant_id = COALESCE(@tenant_id, 't1');
SET @archive_academic_year_id = COALESCE(@archive_academic_year_id, 1);
SET @batch_size = COALESCE(@batch_size, 5000);

-- =============================================================================
-- STEP 1: CREATE ARCHIVE TABLES (one-time)
-- =============================================================================
CREATE TABLE IF NOT EXISTS attendance_records_archive LIKE attendance_records;
CREATE TABLE IF NOT EXISTS mark_records_archive LIKE mark_records;
CREATE TABLE IF NOT EXISTS fee_transactions_archive LIKE fee_transactions;
CREATE TABLE IF NOT EXISTS fee_payments_archive LIKE fee_payments;
CREATE TABLE IF NOT EXISTS fee_payment_attempts_archive LIKE fee_payment_attempts;
CREATE TABLE IF NOT EXISTS notifications_archive LIKE notifications;
CREATE TABLE IF NOT EXISTS announcements_archive LIKE announcements;
CREATE TABLE IF NOT EXISTS communication_events_archive LIKE communication_events;
CREATE TABLE IF NOT EXISTS book_issues_archive LIKE book_issues;
CREATE TABLE IF NOT EXISTS leave_requests_archive LIKE leave_requests;

-- Optional: archive-optimized indexes (idempotent-friendly using IF NOT EXISTS not available everywhere).
-- Run only once if missing:
-- CREATE INDEX idx_att_archive_tenant_year ON attendance_records_archive (tenant_id, academic_year_id, date);
-- CREATE INDEX idx_marks_archive_tenant_year ON mark_records_archive (tenant_id, academic_year_id, exam_id);
-- CREATE INDEX idx_fee_txn_archive_tenant_year ON fee_transactions_archive (tenant_id, academic_year_id, created_at);

-- =============================================================================
-- STEP 2: PRECHECK COUNTS
-- =============================================================================
SELECT 'attendance_records' AS table_name, COUNT(*) AS source_rows
FROM attendance_records
WHERE tenant_id = @tenant_id AND academic_year_id = @archive_academic_year_id
UNION ALL
SELECT 'mark_records', COUNT(*) FROM mark_records WHERE tenant_id = @tenant_id AND academic_year_id = @archive_academic_year_id
UNION ALL
SELECT 'fee_transactions', COUNT(*) FROM fee_transactions WHERE tenant_id = @tenant_id AND academic_year_id = @archive_academic_year_id
UNION ALL
SELECT 'fee_payments', COUNT(*) FROM fee_payments WHERE tenant_id = @tenant_id AND academic_year_id = @archive_academic_year_id
UNION ALL
SELECT 'fee_payment_attempts', COUNT(*) FROM fee_payment_attempts WHERE tenant_id = @tenant_id AND academic_year_id = @archive_academic_year_id
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications WHERE tenant_id = @tenant_id AND academic_year_id = @archive_academic_year_id
UNION ALL
SELECT 'announcements', COUNT(*) FROM announcements WHERE tenant_id = @tenant_id AND academic_year_id = @archive_academic_year_id
UNION ALL
SELECT 'communication_events', COUNT(*) FROM communication_events WHERE tenant_id = @tenant_id AND academic_year_id = @archive_academic_year_id
UNION ALL
SELECT 'book_issues', COUNT(*) FROM book_issues WHERE tenant_id = @tenant_id AND academic_year_id = @archive_academic_year_id
UNION ALL
SELECT 'leave_requests', COUNT(*) FROM leave_requests WHERE tenant_id = @tenant_id AND academic_year_id = @archive_academic_year_id;

-- =============================================================================
-- STEP 3: MOVE DATA (COPY FIRST, THEN DELETE)
-- IMPORTANT: run one table at a time during low traffic windows.
-- =============================================================================

-- 3.1 Attendance
INSERT INTO attendance_records_archive
SELECT * FROM attendance_records
WHERE tenant_id = @tenant_id
  AND academic_year_id = @archive_academic_year_id;

DELETE FROM attendance_records
WHERE tenant_id = @tenant_id
  AND academic_year_id = @archive_academic_year_id;

-- 3.2 Marks
INSERT INTO mark_records_archive
SELECT * FROM mark_records
WHERE tenant_id = @tenant_id
  AND academic_year_id = @archive_academic_year_id;

DELETE FROM mark_records
WHERE tenant_id = @tenant_id
  AND academic_year_id = @archive_academic_year_id;

-- 3.3 Fee transactions
INSERT INTO fee_transactions_archive
SELECT * FROM fee_transactions
WHERE tenant_id = @tenant_id
  AND academic_year_id = @archive_academic_year_id;

DELETE FROM fee_transactions
WHERE tenant_id = @tenant_id
  AND academic_year_id = @archive_academic_year_id;

-- 3.4 Fee payments
INSERT INTO fee_payments_archive
SELECT * FROM fee_payments
WHERE tenant_id = @tenant_id
  AND academic_year_id = @archive_academic_year_id;

DELETE FROM fee_payments
WHERE tenant_id = @tenant_id
  AND academic_year_id = @archive_academic_year_id;

-- 3.5 Fee payment attempts
INSERT INTO fee_payment_attempts_archive
SELECT * FROM fee_payment_attempts
WHERE tenant_id = @tenant_id
  AND academic_year_id = @archive_academic_year_id;

DELETE FROM fee_payment_attempts
WHERE tenant_id = @tenant_id
  AND academic_year_id = @archive_academic_year_id;

-- 3.6 Notifications
INSERT INTO notifications_archive
SELECT * FROM notifications
WHERE tenant_id = @tenant_id
  AND academic_year_id = @archive_academic_year_id;

DELETE FROM notifications
WHERE tenant_id = @tenant_id
  AND academic_year_id = @archive_academic_year_id;

-- 3.7 Announcements
INSERT INTO announcements_archive
SELECT * FROM announcements
WHERE tenant_id = @tenant_id
  AND academic_year_id = @archive_academic_year_id;

DELETE FROM announcements
WHERE tenant_id = @tenant_id
  AND academic_year_id = @archive_academic_year_id;

-- 3.8 Communication events
INSERT INTO communication_events_archive
SELECT * FROM communication_events
WHERE tenant_id = @tenant_id
  AND academic_year_id = @archive_academic_year_id;

DELETE FROM communication_events
WHERE tenant_id = @tenant_id
  AND academic_year_id = @archive_academic_year_id;

-- 3.9 Book issues
INSERT INTO book_issues_archive
SELECT * FROM book_issues
WHERE tenant_id = @tenant_id
  AND academic_year_id = @archive_academic_year_id;

DELETE FROM book_issues
WHERE tenant_id = @tenant_id
  AND academic_year_id = @archive_academic_year_id;

-- 3.10 Leave requests
INSERT INTO leave_requests_archive
SELECT * FROM leave_requests
WHERE tenant_id = @tenant_id
  AND academic_year_id = @archive_academic_year_id;

DELETE FROM leave_requests
WHERE tenant_id = @tenant_id
  AND academic_year_id = @archive_academic_year_id;

-- =============================================================================
-- STEP 4: VALIDATION (source should be zero, archive should match precheck)
-- =============================================================================
SELECT 'attendance_records' AS table_name,
       (SELECT COUNT(*) FROM attendance_records WHERE tenant_id = @tenant_id AND academic_year_id = @archive_academic_year_id) AS source_rows,
       (SELECT COUNT(*) FROM attendance_records_archive WHERE tenant_id = @tenant_id AND academic_year_id = @archive_academic_year_id) AS archive_rows
UNION ALL
SELECT 'mark_records',
       (SELECT COUNT(*) FROM mark_records WHERE tenant_id = @tenant_id AND academic_year_id = @archive_academic_year_id),
       (SELECT COUNT(*) FROM mark_records_archive WHERE tenant_id = @tenant_id AND academic_year_id = @archive_academic_year_id)
UNION ALL
SELECT 'fee_transactions',
       (SELECT COUNT(*) FROM fee_transactions WHERE tenant_id = @tenant_id AND academic_year_id = @archive_academic_year_id),
       (SELECT COUNT(*) FROM fee_transactions_archive WHERE tenant_id = @tenant_id AND academic_year_id = @archive_academic_year_id)
UNION ALL
SELECT 'fee_payments',
       (SELECT COUNT(*) FROM fee_payments WHERE tenant_id = @tenant_id AND academic_year_id = @archive_academic_year_id),
       (SELECT COUNT(*) FROM fee_payments_archive WHERE tenant_id = @tenant_id AND academic_year_id = @archive_academic_year_id);

-- =============================================================================
-- STEP 5: ROLLBACK (if needed)
-- =============================================================================
-- INSERT INTO attendance_records SELECT * FROM attendance_records_archive WHERE tenant_id = @tenant_id AND academic_year_id = @archive_academic_year_id;
-- DELETE FROM attendance_records_archive WHERE tenant_id = @tenant_id AND academic_year_id = @archive_academic_year_id;
-- Repeat same pattern for other *_archive tables.
