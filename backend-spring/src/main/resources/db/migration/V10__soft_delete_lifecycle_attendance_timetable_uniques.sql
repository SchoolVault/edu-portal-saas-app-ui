-- =============================================================================
-- Flyway V10 — Soft-delete lifecycle, attendance cover uniqueness, timetable slot uniqueness
--
-- deleted_at columns where applicable, unique active-slot keys for attendance cover
-- and timetable (including dedupe for demo teacher double-booking before indexes).
-- =============================================================================

-- -------------------------------------------------------------------------
-- Legacy source: V18__deleted_at_lifecycle.sql
-- deleted_at lifecycle (old V18).
-- -------------------------------------------------------------------------

-- Soft-delete timestamp for retention / hard-delete jobs (all BaseEntity tables)
ALTER TABLE academic_subjects ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE academic_years ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE announcements ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE attendance_cover_assignments ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE attendance_records ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE audit_logs ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE book_issues ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE books ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE chat_conversations ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE chat_messages ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE chat_participants ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE class_teacher_assignments ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE documents ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE exam_class_scope ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE exam_schedule_slot ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE exams ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE fee_components ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE fee_payment_attempts ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE fee_payments ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE fee_reminder_queue ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE fee_structures ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE gate_passes ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE guardians ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE hostel_allocations ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE hostel_rooms ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE hostels ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE import_job_lines ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE import_jobs ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE inventory_items ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE leave_requests ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE mark_records ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE messages ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE notification_outbox ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE notifications ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE operational_staff ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE payslips ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE refresh_tokens ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE route_stops ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE salary_components ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE salary_disbursement_attempts ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE salary_structures ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE school_classes ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE sections ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE student_guardian_mappings ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE student_transport_mapping ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE students ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE subject_teacher_assignments ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE teachers ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE tenant_configs ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE timetable_entries ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE transport_drivers ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE transport_routes ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE transport_vehicles ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE users ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE vehicle_live_locations ADD COLUMN deleted_at DATETIME(6) NULL;
ALTER TABLE visitor_logs ADD COLUMN deleted_at DATETIME(6) NULL;

-- -------------------------------------------------------------------------
-- Legacy source: V19__attendance_cover_active_slot_unique.sql
-- Attendance cover active slot unique (old V19).
-- -------------------------------------------------------------------------

-- At most one ACTIVE (non-deleted) cover per tenant + calendar day + class + section-key + period-key.
-- Section key: NULL section_id means "all sections" and is encoded as -1 for the slot hash.
-- Period key: NULL period_number means "whole day / unspecified period" and is encoded as -1.
ALTER TABLE attendance_cover_assignments
    ADD COLUMN active_slot_key VARCHAR(191) AS (
        CASE
            WHEN IFNULL(is_deleted, 0) = 0 AND UPPER(IFNULL(TRIM(status), '')) = 'ACTIVE' THEN CONCAT(
                    tenant_id,
                    '|',
                    DATE(cover_date),
                    '|',
                    class_id,
                    '|',
                    IFNULL(section_id, -1),
                    '|',
                    IFNULL(period_number, -1)
                )
            ELSE NULL
            END
        ) STORED;

CREATE UNIQUE INDEX uq_attendance_cover_active_slot ON attendance_cover_assignments (active_slot_key);

-- -------------------------------------------------------------------------
-- Legacy source: V20__timetable_active_slot_unique.sql
-- Timetable active slot unique + dedupe (old V20).
-- -------------------------------------------------------------------------

-- At most one active (non-deleted) timetable row per tenant + academic year + class + section + weekday + period,
-- and at most one per teacher + tenant + academic year + weekday + period when teacher_id is set.
-- If this migration failed mid-flight, repair flyway_schema_history and any partial timetable indexes/columns manually.

-- Same teacher on the same (academic_year, day, period) in more than one class breaks uq_tt_active_teacher_slot.
-- Demo timetable inserts (legacy V8, now inside V7) used one teacher across multiple classes; keep lowest id per slot.
UPDATE timetable_entries t
    INNER JOIN (
        SELECT id
        FROM (
                 SELECT id,
                        ROW_NUMBER() OVER (
                            PARTITION BY tenant_id, IFNULL(academic_year_id, -1), teacher_id, `day`, period
                            ORDER BY id
                            ) AS rn
                 FROM timetable_entries
                 WHERE IFNULL(is_deleted, 0) = 0
                   AND teacher_id IS NOT NULL
             ) ranked
        WHERE ranked.rn > 1
    ) dup ON dup.id = t.id
SET t.teacher_id   = NULL,
    t.teacher_name = 'Unassigned (deduped for slot uniqueness)';

ALTER TABLE timetable_entries
    ADD COLUMN active_class_slot_key VARCHAR(191) AS (
        CASE
            WHEN IFNULL(is_deleted, 0) = 0 THEN CONCAT(
                    tenant_id,
                    '|',
                    IFNULL(academic_year_id, -1),
                    '|',
                    class_id,
                    '|',
                    IFNULL(section_id, -1),
                    '|',
                    `day`,
                    '|',
                    period
                )
            ELSE NULL
            END
        ) STORED;

CREATE UNIQUE INDEX uq_tt_active_class_slot ON timetable_entries (active_class_slot_key);

ALTER TABLE timetable_entries
    ADD COLUMN active_teacher_slot_key VARCHAR(191) AS (
        CASE
            WHEN IFNULL(is_deleted, 0) = 0 AND teacher_id IS NOT NULL THEN CONCAT(
                    tenant_id,
                    '|',
                    IFNULL(academic_year_id, -1),
                    '|',
                    teacher_id,
                    '|',
                    `day`,
                    '|',
                    period
                )
            ELSE NULL
            END
        ) STORED;

CREATE UNIQUE INDEX uq_tt_active_teacher_slot ON timetable_entries (active_teacher_slot_key);

CREATE INDEX idx_tt_class_day_period_live ON timetable_entries (tenant_id, class_id, section_id, day, period, is_deleted);

CREATE INDEX idx_tt_teacher_day_period_live ON timetable_entries (tenant_id, teacher_id, day, period, is_deleted);
