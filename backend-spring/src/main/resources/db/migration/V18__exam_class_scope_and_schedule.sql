-- Per-exam eligibility: whole class (section_id NULL) or single section
CREATE TABLE IF NOT EXISTS exam_class_scope (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    exam_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,
    section_id BIGINT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    INDEX idx_exam_scope_exam (tenant_id, exam_id, is_deleted),
    CONSTRAINT fk_exam_scope_exam FOREIGN KEY (exam_id) REFERENCES exams (id) ON DELETE CASCADE
);

-- Exam day timetable: subject, date, time window (per class / optional section)
CREATE TABLE IF NOT EXISTS exam_schedule_slot (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    exam_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,
    section_id BIGINT NULL,
    subject_name VARCHAR(200) NOT NULL,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(120) NULL,
    notes VARCHAR(500) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    INDEX idx_exam_sched_exam (tenant_id, exam_id, is_deleted),
    INDEX idx_exam_sched_date (tenant_id, exam_date),
    CONSTRAINT fk_exam_sched_exam FOREIGN KEY (exam_id) REFERENCES exams (id) ON DELETE CASCADE
);
