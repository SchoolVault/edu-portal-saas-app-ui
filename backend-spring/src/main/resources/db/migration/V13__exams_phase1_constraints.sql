-- Exams Phase 1 hardening: prevent duplicate mark rows and speed exam schedule conflict checks.

ALTER TABLE mark_records
    ADD UNIQUE KEY uk_mark_records_identity (tenant_id, exam_id, student_id, class_id, subject_name, is_deleted);

ALTER TABLE exam_schedule_slot
    ADD KEY idx_ex_sched_conflict_scan (tenant_id, class_id, section_id, exam_date, start_time, end_time, is_deleted);
