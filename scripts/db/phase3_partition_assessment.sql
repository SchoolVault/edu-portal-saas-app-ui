-- Phase 3 big-ERP partition planning pack (assessment + candidate DDL templates).
-- Safe by default: this file only runs SELECT checks and prints DDL templates.
--
-- Usage:
-- 1) Run all assessment queries.
-- 2) Review constraint warnings (unique key rules for partitioning).
-- 3) Copy generated ALTER TABLE templates and execute one table at a time in maintenance windows.

-- -----------------------------------------------------------------------------
-- STEP 1: Growth scan for year-scoped transactional tables
-- -----------------------------------------------------------------------------
SELECT table_name,
       table_rows,
       ROUND((data_length + index_length) / 1024 / 1024, 2) AS total_mb
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name IN (
      'attendance_records',
      'mark_records',
      'fee_transactions',
      'fee_payments',
      'fee_payment_attempts',
      'notifications',
      'announcements',
      'communication_events',
      'book_issues',
      'leave_requests'
  )
ORDER BY total_mb DESC, table_rows DESC;

-- -----------------------------------------------------------------------------
-- STEP 2: Year distribution skew check (partition usefulness indicator)
-- -----------------------------------------------------------------------------
SELECT 'attendance_records' AS table_name, academic_year_id, COUNT(*) AS row_count
FROM attendance_records
GROUP BY academic_year_id
UNION ALL
SELECT 'mark_records', academic_year_id, COUNT(*)
FROM mark_records
GROUP BY academic_year_id
UNION ALL
SELECT 'fee_transactions', academic_year_id, COUNT(*)
FROM fee_transactions
GROUP BY academic_year_id
UNION ALL
SELECT 'fee_payments', academic_year_id, COUNT(*)
FROM fee_payments
GROUP BY academic_year_id
UNION ALL
SELECT 'fee_payment_attempts', academic_year_id, COUNT(*)
FROM fee_payment_attempts
GROUP BY academic_year_id
UNION ALL
SELECT 'notifications', academic_year_id, COUNT(*)
FROM notifications
GROUP BY academic_year_id
UNION ALL
SELECT 'announcements', academic_year_id, COUNT(*)
FROM announcements
GROUP BY academic_year_id
UNION ALL
SELECT 'communication_events', academic_year_id, COUNT(*)
FROM communication_events
GROUP BY academic_year_id
UNION ALL
SELECT 'book_issues', academic_year_id, COUNT(*)
FROM book_issues
GROUP BY academic_year_id
UNION ALL
SELECT 'leave_requests', academic_year_id, COUNT(*)
FROM leave_requests
GROUP BY academic_year_id
ORDER BY table_name, academic_year_id;

-- -----------------------------------------------------------------------------
-- STEP 3: Hard blocker check (MySQL rule: every UNIQUE/PRIMARY key must include partition key)
-- -----------------------------------------------------------------------------
-- Any row returned here means this table needs key redesign before PARTITION BY academic_year_id.
SELECT s.table_name,
       s.index_name,
       GROUP_CONCAT(s.column_name ORDER BY s.seq_in_index) AS index_columns
FROM information_schema.statistics s
WHERE s.table_schema = DATABASE()
  AND s.table_name IN (
      'attendance_records',
      'mark_records',
      'fee_transactions',
      'fee_payments',
      'fee_payment_attempts',
      'notifications',
      'announcements',
      'communication_events',
      'book_issues',
      'leave_requests'
  )
  AND s.non_unique = 0
GROUP BY s.table_name, s.index_name
HAVING SUM(CASE WHEN s.column_name = 'academic_year_id' THEN 1 ELSE 0 END) = 0
ORDER BY s.table_name, s.index_name;

-- Decision view for native partition viability.
WITH native_partition_blockers AS (
    SELECT s.table_name
    FROM information_schema.statistics s
    WHERE s.table_schema = DATABASE()
      AND s.table_name IN (
          'attendance_records',
          'mark_records',
          'fee_transactions',
          'fee_payments',
          'fee_payment_attempts',
          'notifications',
          'announcements',
          'communication_events',
          'book_issues',
          'leave_requests'
      )
      AND s.non_unique = 0
    GROUP BY s.table_name, s.index_name
    HAVING SUM(CASE WHEN s.column_name = 'academic_year_id' THEN 1 ELSE 0 END) = 0
)
SELECT c.table_name,
       CASE WHEN b.table_name IS NULL THEN 'NATIVE_PARTITION_READY'
            ELSE 'BLOCKED_BY_UNIQUE_KEY_RULE' END AS native_partition_status
FROM (
    SELECT 'attendance_records' AS table_name
    UNION ALL SELECT 'mark_records'
    UNION ALL SELECT 'fee_transactions'
    UNION ALL SELECT 'fee_payments'
    UNION ALL SELECT 'fee_payment_attempts'
    UNION ALL SELECT 'notifications'
    UNION ALL SELECT 'announcements'
    UNION ALL SELECT 'communication_events'
    UNION ALL SELECT 'book_issues'
    UNION ALL SELECT 'leave_requests'
) c
LEFT JOIN (SELECT DISTINCT table_name FROM native_partition_blockers) b
  ON b.table_name = c.table_name
ORDER BY c.table_name;

-- -----------------------------------------------------------------------------
-- STEP 4: Required-column precheck (academic_year_id must exist before partition)
-- -----------------------------------------------------------------------------
SELECT c.table_name,
       CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'MISSING' END AS academic_year_column_status
FROM (
    SELECT 'attendance_records' AS table_name
    UNION ALL SELECT 'mark_records'
    UNION ALL SELECT 'fee_transactions'
    UNION ALL SELECT 'fee_payments'
    UNION ALL SELECT 'fee_payment_attempts'
    UNION ALL SELECT 'notifications'
    UNION ALL SELECT 'announcements'
    UNION ALL SELECT 'communication_events'
    UNION ALL SELECT 'book_issues'
    UNION ALL SELECT 'leave_requests'
) c
LEFT JOIN information_schema.columns ic
  ON ic.table_schema = DATABASE()
 AND ic.table_name = c.table_name
 AND ic.column_name = 'academic_year_id'
GROUP BY c.table_name
ORDER BY c.table_name;

-- Remediation DDL templates for tables where column is missing (copy only missing ones):
SELECT CONCAT('ALTER TABLE ', c.table_name, ' ADD COLUMN academic_year_id BIGINT NOT NULL;') AS ddl_template
FROM (
    SELECT 'attendance_records' AS table_name
    UNION ALL SELECT 'mark_records'
    UNION ALL SELECT 'fee_transactions'
    UNION ALL SELECT 'fee_payments'
    UNION ALL SELECT 'fee_payment_attempts'
    UNION ALL SELECT 'notifications'
    UNION ALL SELECT 'announcements'
    UNION ALL SELECT 'communication_events'
    UNION ALL SELECT 'book_issues'
    UNION ALL SELECT 'leave_requests'
) c
LEFT JOIN information_schema.columns ic
  ON ic.table_schema = DATABASE()
 AND ic.table_name = c.table_name
 AND ic.column_name = 'academic_year_id'
WHERE ic.column_name IS NULL;

-- -----------------------------------------------------------------------------
-- STEP 5: Required-index precheck (tenant_id, academic_year_id) for hot query paths
-- -----------------------------------------------------------------------------
SELECT c.table_name,
       CASE WHEN SUM(CASE WHEN s.index_name IS NOT NULL THEN 1 ELSE 0 END) > 0
            THEN 'OK' ELSE 'MISSING' END AS tenant_year_index_status
FROM (
    SELECT 'attendance_records' AS table_name
    UNION ALL SELECT 'mark_records'
    UNION ALL SELECT 'fee_transactions'
    UNION ALL SELECT 'fee_payments'
    UNION ALL SELECT 'fee_payment_attempts'
    UNION ALL SELECT 'notifications'
    UNION ALL SELECT 'announcements'
    UNION ALL SELECT 'communication_events'
    UNION ALL SELECT 'book_issues'
    UNION ALL SELECT 'leave_requests'
) c
LEFT JOIN information_schema.statistics s
  ON s.table_schema = DATABASE()
 AND s.table_name = c.table_name
 AND s.column_name IN ('tenant_id', 'academic_year_id')
GROUP BY c.table_name
ORDER BY c.table_name;

-- Remediation index DDL templates (run where needed):
SELECT CONCAT('CREATE INDEX idx_', c.table_name, '_tenant_year ON ', c.table_name, ' (tenant_id, academic_year_id);') AS ddl_template
FROM (
    SELECT 'attendance_records' AS table_name
    UNION ALL SELECT 'mark_records'
    UNION ALL SELECT 'fee_transactions'
    UNION ALL SELECT 'fee_payments'
    UNION ALL SELECT 'fee_payment_attempts'
    UNION ALL SELECT 'notifications'
    UNION ALL SELECT 'announcements'
    UNION ALL SELECT 'communication_events'
    UNION ALL SELECT 'book_issues'
    UNION ALL SELECT 'leave_requests'
) c;

-- -----------------------------------------------------------------------------
-- STEP 6: Precheck for NULL year rows (must be zero for partition candidates)
-- -----------------------------------------------------------------------------
SELECT 'attendance_records' AS table_name, COUNT(*) AS null_year_rows FROM attendance_records WHERE academic_year_id IS NULL
UNION ALL
SELECT 'mark_records', COUNT(*) FROM mark_records WHERE academic_year_id IS NULL
UNION ALL
SELECT 'fee_transactions', COUNT(*) FROM fee_transactions WHERE academic_year_id IS NULL
UNION ALL
SELECT 'fee_payments', COUNT(*) FROM fee_payments WHERE academic_year_id IS NULL
UNION ALL
SELECT 'fee_payment_attempts', COUNT(*) FROM fee_payment_attempts WHERE academic_year_id IS NULL
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications WHERE academic_year_id IS NULL
UNION ALL
SELECT 'announcements', COUNT(*) FROM announcements WHERE academic_year_id IS NULL
UNION ALL
SELECT 'communication_events', COUNT(*) FROM communication_events WHERE academic_year_id IS NULL
UNION ALL
SELECT 'book_issues', COUNT(*) FROM book_issues WHERE academic_year_id IS NULL
UNION ALL
SELECT 'leave_requests', COUNT(*) FROM leave_requests WHERE academic_year_id IS NULL
ORDER BY table_name;

-- -----------------------------------------------------------------------------
-- STEP 7: Candidate partition DDL templates (copy-run manually, one table at a time)
-- -----------------------------------------------------------------------------
-- Recommended starter for ERP growth: HASH(academic_year_id) PARTITIONS 16
-- Tune partitions based on row count and CPU cores.

SELECT CONCAT('ALTER TABLE attendance_records PARTITION BY HASH(academic_year_id) PARTITIONS 16;') AS ddl_template
UNION ALL
SELECT CONCAT('ALTER TABLE mark_records PARTITION BY HASH(academic_year_id) PARTITIONS 16;')
UNION ALL
SELECT CONCAT('ALTER TABLE fee_transactions PARTITION BY HASH(academic_year_id) PARTITIONS 16;')
UNION ALL
SELECT CONCAT('ALTER TABLE fee_payments PARTITION BY HASH(academic_year_id) PARTITIONS 16;')
UNION ALL
SELECT CONCAT('ALTER TABLE fee_payment_attempts PARTITION BY HASH(academic_year_id) PARTITIONS 16;')
UNION ALL
SELECT CONCAT('ALTER TABLE notifications PARTITION BY HASH(academic_year_id) PARTITIONS 16;')
UNION ALL
SELECT CONCAT('ALTER TABLE announcements PARTITION BY HASH(academic_year_id) PARTITIONS 8;')
UNION ALL
SELECT CONCAT('ALTER TABLE communication_events PARTITION BY HASH(academic_year_id) PARTITIONS 8;')
UNION ALL
SELECT CONCAT('ALTER TABLE book_issues PARTITION BY HASH(academic_year_id) PARTITIONS 8;')
UNION ALL
SELECT CONCAT('ALTER TABLE leave_requests PARTITION BY HASH(academic_year_id) PARTITIONS 8;');

-- -----------------------------------------------------------------------------
-- STEP 8: Reliable fallback strategy (archive tables by year) when native partition is blocked
-- -----------------------------------------------------------------------------
-- This path avoids MySQL unique-key partition constraints and is safer with JPA identity PKs.
-- Pattern:
--   1) Keep hot/current data in primary OLTP table.
--   2) Move old academic years to *_archive tables.
--   3) Query current year from OLTP; cross-year analytics from warehouse/archive paths.

-- Archive table templates (run once per table where needed):
SELECT 'CREATE TABLE IF NOT EXISTS attendance_records_archive LIKE attendance_records;' AS ddl_template
UNION ALL SELECT 'CREATE TABLE IF NOT EXISTS mark_records_archive LIKE mark_records;'
UNION ALL SELECT 'CREATE TABLE IF NOT EXISTS fee_transactions_archive LIKE fee_transactions;'
UNION ALL SELECT 'CREATE TABLE IF NOT EXISTS fee_payments_archive LIKE fee_payments;'
UNION ALL SELECT 'CREATE TABLE IF NOT EXISTS notifications_archive LIKE notifications;'
UNION ALL SELECT 'CREATE TABLE IF NOT EXISTS announcements_archive LIKE announcements;'
UNION ALL SELECT 'CREATE TABLE IF NOT EXISTS communication_events_archive LIKE communication_events;';

-- Year-move templates (run in batches per tenant/year in maintenance windows):
SELECT 'INSERT INTO attendance_records_archive SELECT * FROM attendance_records WHERE academic_year_id = ? AND tenant_id = ?;' AS ddl_template
UNION ALL SELECT 'DELETE FROM attendance_records WHERE academic_year_id = ? AND tenant_id = ?;'
UNION ALL SELECT 'INSERT INTO mark_records_archive SELECT * FROM mark_records WHERE academic_year_id = ? AND tenant_id = ?;'
UNION ALL SELECT 'DELETE FROM mark_records WHERE academic_year_id = ? AND tenant_id = ?;'
UNION ALL SELECT 'INSERT INTO fee_transactions_archive SELECT * FROM fee_transactions WHERE academic_year_id = ? AND tenant_id = ?;'
UNION ALL SELECT 'DELETE FROM fee_transactions WHERE academic_year_id = ? AND tenant_id = ?;'
UNION ALL SELECT 'INSERT INTO fee_payments_archive SELECT * FROM fee_payments WHERE academic_year_id = ? AND tenant_id = ?;'
UNION ALL SELECT 'DELETE FROM fee_payments WHERE academic_year_id = ? AND tenant_id = ?;';

-- Recommended invariant check after each move:
SELECT 'SELECT COUNT(*) FROM <table> WHERE academic_year_id = ? AND tenant_id = ?;' AS validation_template
UNION ALL
SELECT 'SELECT COUNT(*) FROM <table>_archive WHERE academic_year_id = ? AND tenant_id = ?;';

-- -----------------------------------------------------------------------------
-- EXECUTION ORDER (recommended)
-- 1) attendance_records
-- 2) mark_records
-- 3) fee_transactions
-- 4) fee_payments
-- 5) notifications
-- 6) fee_payment_attempts
-- 7) announcements / communication_events
-- 8) book_issues / leave_requests
-- -----------------------------------------------------------------------------
