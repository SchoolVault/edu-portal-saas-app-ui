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
