ALTER TABLE exams
    ADD COLUMN board_code VARCHAR(30) NULL AFTER grading_config_json,
    ADD COLUMN session_type VARCHAR(30) NULL AFTER board_code,
    ADD COLUMN term_code VARCHAR(30) NULL AFTER session_type,
    ADD COLUMN assessment_kind VARCHAR(30) NULL AFTER term_code;

CREATE INDEX idx_exam_partition_lookup
    ON exams (tenant_id, academic_year_id, board_code, session_type, term_code, is_deleted);
