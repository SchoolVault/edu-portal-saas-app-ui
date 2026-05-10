-- =============================================================================
-- Flyway V3 — Assignments, documents, transport, and timetable academic columns
--
-- Assignment workflow, document storage metadata, transport routes/vehicles,
-- hostel/payslip-related columns, and timetable academic_year / version fields.
-- =============================================================================

-- -------------------------------------------------------------------------
-- Legacy source: V3__assignments_docs_transport.sql
-- Assignments, docs, transport, timetable academic columns (old V3).
-- -------------------------------------------------------------------------

-- >>> Legacy V9: V9__student_guardian_flexibility.sql
-- Flexible parent/guardian model: many-to-many with role metadata; student extensions for primary contact + dynamic attributes

CREATE TABLE guardians (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    occupation VARCHAR(200),
    primary_phone VARCHAR(30),
    phones_json JSON,
    emails_json JSON,
    user_id BIGINT,
    attributes_json JSON,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_guardian_tenant (tenant_id),
    INDEX idx_guardian_primary_phone (tenant_id, primary_phone),
    INDEX idx_guardian_user (tenant_id, user_id),
    CONSTRAINT fk_guardian_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE student_guardian_mappings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    student_id BIGINT NOT NULL,
    guardian_id BIGINT NOT NULL,
    relation_type VARCHAR(30) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    is_emergency_contact BOOLEAN DEFAULT FALSE,
    custody_type VARCHAR(30),
    effective_from DATE,
    effective_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_sgm_student (tenant_id, student_id),
    INDEX idx_sgm_guardian (tenant_id, guardian_id),
    CONSTRAINT fk_sgm_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    CONSTRAINT fk_sgm_guardian FOREIGN KEY (guardian_id) REFERENCES guardians (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE students
    ADD COLUMN primary_contact_guardian_id BIGINT NULL AFTER parent_id,
    ADD COLUMN attributes_json JSON NULL AFTER blood_group,
    ADD CONSTRAINT fk_student_primary_guardian FOREIGN KEY (primary_contact_guardian_id) REFERENCES guardians (id) ON DELETE SET NULL;

-- >>> Legacy V10: V10__teacher_assignment_tables.sql
-- Historical class teacher and subject teacher assignments (replaces reliance on school_classes.class_teacher_id alone)

CREATE TABLE class_teacher_assignments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    academic_year_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,
    section_id BIGINT,
    teacher_id BIGINT NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_cta_tenant_class (tenant_id, class_id),
    INDEX idx_cta_tenant_teacher (tenant_id, teacher_id),
    INDEX idx_cta_year (tenant_id, academic_year_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE subject_teacher_assignments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    academic_year_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,
    section_id BIGINT,
    subject_name VARCHAR(100) NOT NULL,
    teacher_id BIGINT NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_sta_tenant_class (tenant_id, class_id),
    INDEX idx_sta_tenant_teacher (tenant_id, teacher_id),
    INDEX idx_sta_subject (tenant_id, subject_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- >>> Legacy V11: V11__documents_metadata_extend.sql
ALTER TABLE documents
    ADD COLUMN owner_type VARCHAR(30) NULL AFTER related_entity_type,
    ADD COLUMN owner_id BIGINT NULL AFTER owner_type,
    ADD COLUMN visibility_scope VARCHAR(30) NULL AFTER owner_id,
    ADD COLUMN file_version INT NOT NULL DEFAULT 1 AFTER visibility_scope,
    ADD COLUMN mime_type VARCHAR(120) NULL AFTER file_version,
    ADD COLUMN size_bytes BIGINT NULL AFTER mime_type,
    ADD COLUMN storage_key VARCHAR(500) NULL AFTER size_bytes,
    ADD COLUMN parent_folder_id BIGINT NULL AFTER storage_key,
    ADD COLUMN tags_json JSON NULL AFTER parent_folder_id;

CREATE INDEX idx_documents_tenant_owner ON documents (tenant_id, owner_type, owner_id);

-- >>> Legacy V12: V12__transport_exam_timetable_hostel_payslip.sql
ALTER TABLE route_stops
    ADD COLUMN latitude DECIMAL(10, 7) NULL AFTER stop_order,
    ADD COLUMN longitude DECIMAL(10, 7) NULL AFTER latitude,
    ADD COLUMN estimated_travel_minutes INT NULL COMMENT 'Minutes from route start' AFTER longitude;

ALTER TABLE hostel_rooms
    ADD COLUMN occupancy_status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE' AFTER room_type;

ALTER TABLE exams
    ADD COLUMN results_published BOOLEAN NOT NULL DEFAULT FALSE AFTER status,
    ADD COLUMN grading_config_json JSON NULL AFTER results_published;

ALTER TABLE timetable_entries
    ADD COLUMN timetable_version INT NOT NULL DEFAULT 1 AFTER academic_year_id,
    ADD COLUMN has_conflict BOOLEAN NOT NULL DEFAULT FALSE AFTER room;


ALTER TABLE payslips
    ADD COLUMN payroll_month VARCHAR(7) NULL COMMENT 'YYYY-MM' AFTER teacher_name,
    ADD COLUMN components_json JSON NULL AFTER payroll_month,
    ADD COLUMN tax_details_json JSON NULL AFTER components_json;

CREATE INDEX idx_payslip_month ON payslips (tenant_id, payroll_month);
