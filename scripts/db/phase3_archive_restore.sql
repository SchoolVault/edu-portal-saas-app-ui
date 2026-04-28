-- Phase 3 restore flow from archive back to hot OLTP tables.
-- Use only for rollback or audit replay scenarios.

SET @tenant_id = 'tenant_demo';
SET @academic_year_id = 1;
SET @batch_size = 5000;

INSERT IGNORE INTO attendance_records
SELECT * FROM attendance_records_archive
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;

INSERT IGNORE INTO mark_records
SELECT * FROM mark_records_archive
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;

INSERT IGNORE INTO fee_transactions
SELECT * FROM fee_transactions_archive
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;

INSERT IGNORE INTO fee_payments
SELECT * FROM fee_payments_archive
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;

INSERT IGNORE INTO fee_payment_attempts
SELECT * FROM fee_payment_attempts_archive
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;

INSERT IGNORE INTO notifications
SELECT * FROM notifications_archive
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;

INSERT IGNORE INTO announcements
SELECT * FROM announcements_archive
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;

INSERT IGNORE INTO communication_events
SELECT * FROM communication_events_archive
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;

INSERT IGNORE INTO book_issues
SELECT * FROM book_issues_archive
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;

INSERT IGNORE INTO leave_requests
SELECT * FROM leave_requests_archive
WHERE tenant_id = @tenant_id
  AND academic_year_id = @academic_year_id
LIMIT @batch_size;

-- Optional cleanup after restore validation:
-- DELETE FROM attendance_records_archive WHERE tenant_id = @tenant_id AND academic_year_id = @academic_year_id LIMIT @batch_size;
-- Repeat for all *_archive tables only after sign-off.
