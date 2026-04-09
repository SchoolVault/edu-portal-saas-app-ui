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
