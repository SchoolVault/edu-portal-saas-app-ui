-- Bootstrap archive tables for year-based logical partitioning.
-- Safe to run on empty or existing environments.

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

-- Archive-path indexes for tenant/year lookups and analytics exports.
CREATE INDEX idx_att_archive_tenant_year_date ON attendance_records_archive (tenant_id, academic_year_id, date);
CREATE INDEX idx_marks_archive_tenant_year_exam ON mark_records_archive (tenant_id, academic_year_id, exam_id);
CREATE INDEX idx_fee_txn_archive_tenant_year_created ON fee_transactions_archive (tenant_id, academic_year_id, created_at);
CREATE INDEX idx_fee_pay_archive_tenant_year_due ON fee_payments_archive (tenant_id, academic_year_id, due_date);
CREATE INDEX idx_fee_attempt_archive_tenant_year_created ON fee_payment_attempts_archive (tenant_id, academic_year_id, created_at);
CREATE INDEX idx_notif_archive_tenant_year_created ON notifications_archive (tenant_id, academic_year_id, created_at);
CREATE INDEX idx_ann_archive_tenant_year_created ON announcements_archive (tenant_id, academic_year_id, created_at);
CREATE INDEX idx_comm_evt_archive_tenant_year_start ON communication_events_archive (tenant_id, academic_year_id, event_start_at);
CREATE INDEX idx_book_issue_archive_tenant_year_issue ON book_issues_archive (tenant_id, academic_year_id, issue_date);
CREATE INDEX idx_leave_archive_tenant_year_start ON leave_requests_archive (tenant_id, academic_year_id, start_date);
