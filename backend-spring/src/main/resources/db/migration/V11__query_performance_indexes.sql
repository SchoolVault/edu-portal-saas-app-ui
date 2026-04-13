-- High-traffic lookup patterns: tenant + soft-delete, fees, parents, notifications, checkout.
-- Additive Flyway version; runs once per database (duplicate index names would fail on re-apply).

-- ========== Core tenant + is_deleted (list / filter by active rows) ==========
CREATE INDEX idx_users_tenant_deleted ON users (tenant_id, is_deleted);
CREATE INDEX idx_users_tenant_role_deleted ON users (tenant_id, role, is_deleted);

CREATE INDEX idx_students_tenant_deleted ON students (tenant_id, is_deleted);
CREATE INDEX idx_students_parent_deleted ON students (tenant_id, parent_id, is_deleted);
CREATE INDEX idx_students_class_deleted ON students (tenant_id, class_id, is_deleted);
CREATE INDEX idx_students_section_deleted ON students (tenant_id, class_id, section_id, is_deleted);

CREATE INDEX idx_teachers_tenant_deleted ON teachers (tenant_id, is_deleted);
CREATE INDEX idx_teachers_user_deleted ON teachers (tenant_id, user_id, is_deleted);

CREATE INDEX idx_academic_years_tenant_deleted ON academic_years (tenant_id, is_deleted);
CREATE INDEX idx_school_classes_tenant_deleted ON school_classes (tenant_id, is_deleted);
CREATE INDEX idx_sections_tenant_class_deleted ON sections (tenant_id, class_id, is_deleted);

-- ========== Fees (bulk assign, reminders, parent portal) ==========
CREATE INDEX idx_fee_structures_tenant_deleted ON fee_structures (tenant_id, is_deleted);
CREATE INDEX idx_fee_structures_class_deleted ON fee_structures (tenant_id, class_id, is_deleted);

CREATE INDEX idx_fee_components_structure ON fee_components (tenant_id, fee_structure_id, is_deleted);

CREATE INDEX idx_fee_payments_tenant_deleted ON fee_payments (tenant_id, is_deleted);
CREATE INDEX idx_fee_payments_tenant_status_deleted ON fee_payments (tenant_id, status, is_deleted);
CREATE INDEX idx_fee_payments_student_deleted ON fee_payments (tenant_id, student_id, is_deleted);
-- One issued receipt per tenant (multiple NULL receipt_number allowed in MySQL)
CREATE UNIQUE INDEX uq_fee_payment_tenant_receipt ON fee_payments (tenant_id, receipt_number);
-- Bulk duplicate check + reminder scans (leading columns match WHERE tenant + deleted + structure + due)
CREATE INDEX idx_fee_payments_obligation_lookup ON fee_payments (tenant_id, is_deleted, fee_structure_id, due_date, student_id);

-- ========== Fee checkout / webhooks ==========
CREATE INDEX idx_fpa_checkout ON fee_payment_attempts (tenant_id, checkout_token, is_deleted);
CREATE INDEX idx_fpa_tenant_provider_order ON fee_payment_attempts (tenant_id, provider, provider_order_id, is_deleted);
CREATE INDEX idx_fpa_tenant_provider_payment ON fee_payment_attempts (tenant_id, provider, provider_payment_id, is_deleted);
CREATE INDEX idx_fpa_parent_user ON fee_payment_attempts (tenant_id, parent_user_id, is_deleted);

-- ========== Notifications (in-app inbox) ==========
CREATE INDEX idx_notifications_inbox ON notifications (tenant_id, user_id, is_deleted, is_read);
CREATE INDEX idx_notifications_id_lookup ON notifications (tenant_id, user_id, id, is_deleted);

-- ========== Chat (inbox / participants) ==========
CREATE INDEX idx_chat_conv_tenant_deleted ON chat_conversations (tenant_id, is_deleted);
CREATE INDEX idx_chat_participant_conv_deleted ON chat_participants (tenant_id, conversation_id, is_deleted);
CREATE INDEX idx_chat_participant_user_deleted ON chat_participants (tenant_id, user_id, is_deleted);
-- chat_messages already has idx_chat_msg_conv (tenant_id, conversation_id, id) in V2

-- ========== Documents, attendance, marks, exams ==========
CREATE INDEX idx_documents_tenant_deleted ON documents (tenant_id, is_deleted);
CREATE INDEX idx_attendance_tenant_deleted ON attendance_records (tenant_id, is_deleted);
CREATE INDEX idx_marks_tenant_deleted ON mark_records (tenant_id, is_deleted);
CREATE INDEX idx_exams_tenant_deleted ON exams (tenant_id, is_deleted);
CREATE INDEX idx_timetable_tenant_deleted ON timetable_entries (tenant_id, is_deleted);

-- ========== Library / transport / announcements ==========
CREATE INDEX idx_books_tenant_deleted ON books (tenant_id, is_deleted);
CREATE INDEX idx_book_issues_tenant_deleted ON book_issues (tenant_id, is_deleted);
CREATE INDEX idx_transport_routes_tenant_deleted ON transport_routes (tenant_id, is_deleted);
CREATE INDEX idx_route_stops_route ON route_stops (tenant_id, route_id, is_deleted);
CREATE INDEX idx_announcements_tenant_deleted ON announcements (tenant_id, is_deleted);

-- ========== Payslips / salary / hostel ==========
CREATE INDEX idx_payslips_tenant_deleted ON payslips (tenant_id, is_deleted);
CREATE INDEX idx_hostel_rooms_tenant_deleted ON hostel_rooms (tenant_id, is_deleted);
CREATE INDEX idx_hostel_alloc_tenant_deleted ON hostel_allocations (tenant_id, is_deleted);

-- ========== Import jobs (admin) ==========
CREATE INDEX idx_import_jobs_tenant_deleted ON import_jobs (tenant_id, is_deleted);

-- ========== Outbox, guardians, leave, assignments, legacy messaging ==========
CREATE INDEX idx_notification_outbox_worker ON notification_outbox (tenant_id, status, is_deleted, created_at);
CREATE INDEX idx_salary_disb_attempts_status ON salary_disbursement_attempts (tenant_id, status, is_deleted);

CREATE INDEX idx_guardians_tenant_deleted ON guardians (tenant_id, is_deleted);
CREATE INDEX idx_sgm_student_deleted ON student_guardian_mappings (tenant_id, student_id, is_deleted);
CREATE INDEX idx_sgm_guardian_deleted ON student_guardian_mappings (tenant_id, guardian_id, is_deleted);

CREATE INDEX idx_cta_tenant_deleted ON class_teacher_assignments (tenant_id, is_deleted);
CREATE INDEX idx_sta_tenant_deleted ON subject_teacher_assignments (tenant_id, is_deleted);

CREATE INDEX idx_leave_tenant_status_deleted ON leave_requests (tenant_id, status, is_deleted);

CREATE INDEX idx_fee_reminder_tenant_status_deleted ON fee_reminder_queue (tenant_id, status, is_deleted);

CREATE INDEX idx_ops_staff_tenant_deleted ON operational_staff (tenant_id, is_deleted);

CREATE INDEX idx_student_transport_tenant_deleted ON student_transport_mapping (tenant_id, is_deleted);

CREATE INDEX idx_messages_tenant_deleted ON messages (tenant_id, is_deleted);
CREATE INDEX idx_refresh_tokens_user_deleted ON refresh_tokens (tenant_id, user_id, is_deleted);

CREATE INDEX idx_import_job_lines_tenant_deleted ON import_job_lines (tenant_id, job_id, is_deleted);

CREATE INDEX idx_hostels_tenant_deleted ON hostels (tenant_id, is_deleted);
