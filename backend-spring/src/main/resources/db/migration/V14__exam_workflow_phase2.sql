-- Exam Phase 2 workflow states and operator notes.

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
