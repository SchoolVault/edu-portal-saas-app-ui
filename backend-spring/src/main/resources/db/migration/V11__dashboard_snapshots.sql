-- Academic foundations bundle:
-- section homeroom teacher model, leave policy, and exam workflow hardening.

ALTER TABLE sections
    ADD COLUMN class_teacher_id BIGINT NULL AFTER student_count,
    ADD COLUMN class_teacher_name VARCHAR(200) NULL AFTER class_teacher_id;

CREATE INDEX idx_section_homeroom_teacher ON sections (tenant_id, class_teacher_id);

UPDATE sections sec
    INNER JOIN school_classes sc ON sc.id = sec.class_id AND sc.tenant_id = sec.tenant_id
SET sec.class_teacher_id = sc.class_teacher_id,
    sec.class_teacher_name = sc.class_teacher_name
WHERE sec.is_deleted = 0
  AND sc.class_teacher_id IS NOT NULL;

UPDATE school_classes sc
SET sc.class_teacher_id = NULL,
    sc.class_teacher_name = NULL
WHERE sc.is_deleted = 0
  AND EXISTS (SELECT 1 FROM sections s WHERE s.class_id = sc.id AND s.is_deleted = 0);

CREATE TABLE leave_entitlement_policies (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    is_deleted TINYINT(1) DEFAULT 0,
    deleted_at DATETIME(6) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    annual_entitled INT NOT NULL DEFAULT 24,
    sick_entitled INT NOT NULL DEFAULT 12,
    casual_entitled INT NOT NULL DEFAULT 12,
    policy_year_label VARCHAR(120) NULL,
    UNIQUE KEY uk_leave_entitlement_policy_tenant (tenant_id),
    KEY idx_leave_entitlement_tenant_active (tenant_id, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE mark_records
    ADD UNIQUE KEY uk_mark_records_identity (tenant_id, exam_id, student_id, class_id, subject_name, is_deleted);

ALTER TABLE exam_schedule_slot
    ADD KEY idx_ex_sched_conflict_scan (tenant_id, class_id, section_id, exam_date, start_time, end_time, is_deleted);

ALTER TABLE exams
    ADD COLUMN workflow_state VARCHAR(40) NULL AFTER grading_config_json,
    ADD COLUMN workflow_note VARCHAR(500) NULL AFTER workflow_state,
    ADD COLUMN published_at DATETIME(6) NULL AFTER workflow_note,
    ADD COLUMN frozen_at DATETIME(6) NULL AFTER published_at;

UPDATE exams
SET workflow_state = CASE
    WHEN LOWER(COALESCE(status, '')) = 'cancelled' THEN 'REJECTED'
    WHEN LOWER(COALESCE(status, '')) IN ('ongoing', 'completed') THEN 'PUBLISHED'
    ELSE 'APPROVED'
END
WHERE workflow_state IS NULL;

ALTER TABLE exams
    MODIFY COLUMN workflow_state VARCHAR(40) NOT NULL;

ALTER TABLE exams
    ADD KEY idx_exam_workflow_state (tenant_id, workflow_state, is_deleted);
