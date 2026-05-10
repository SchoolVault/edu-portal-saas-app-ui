-- Phase 3 executable archive movement (logical partitioning).
-- Run manually per tenant/year after verifying counts with phase3_partition_assessment.sql.

SET @tenant_id = 'tenant_demo';
SET @academic_year_id = 1;
SET @batch_size = 5000;

-- Repeat these blocks until rows_moved = 0 for each table.
INSERT IGNORE INTO attendance_records_archive
SELECT * FROM attendance_records
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;
SET @rows_moved = ROW_COUNT();
DELETE FROM attendance_records
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;

INSERT IGNORE INTO mark_records_archive
SELECT * FROM mark_records
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;
SET @rows_moved = ROW_COUNT();
DELETE FROM mark_records
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;

INSERT IGNORE INTO fee_transactions_archive
SELECT * FROM fee_transactions
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;
SET @rows_moved = ROW_COUNT();
DELETE FROM fee_transactions
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;

INSERT IGNORE INTO fee_payments_archive
SELECT * FROM fee_payments
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;
SET @rows_moved = ROW_COUNT();
DELETE FROM fee_payments
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;

INSERT IGNORE INTO fee_payment_attempts_archive
SELECT * FROM fee_payment_attempts
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;
SET @rows_moved = ROW_COUNT();
DELETE FROM fee_payment_attempts
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;

INSERT IGNORE INTO notifications_archive
SELECT * FROM notifications
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;
SET @rows_moved = ROW_COUNT();
DELETE FROM notifications
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;

INSERT IGNORE INTO announcements_archive
SELECT * FROM announcements
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;
SET @rows_moved = ROW_COUNT();
DELETE FROM announcements
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;

INSERT IGNORE INTO communication_events_archive
SELECT * FROM communication_events
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;
SET @rows_moved = ROW_COUNT();
DELETE FROM communication_events
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;

INSERT IGNORE INTO book_issues_archive
SELECT * FROM book_issues
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;
SET @rows_moved = ROW_COUNT();
DELETE FROM book_issues
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;

INSERT IGNORE INTO leave_requests_archive
SELECT * FROM leave_requests
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;
SET @rows_moved = ROW_COUNT();
DELETE FROM leave_requests
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;

-- Validation checks:
SELECT 'attendance_records' AS table_name, COUNT(*) AS hot_rows
FROM attendance_records
WHERE tenant_id = @tenant_id AND academic_year_id = @academic_year_id
UNION ALL
SELECT 'attendance_records_archive', COUNT(*)
FROM attendance_records_archive
WHERE tenant_id = @tenant_id AND academic_year_id = @academic_year_id;
