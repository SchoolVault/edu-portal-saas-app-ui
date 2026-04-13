-- Squashed Flyway baseline (part 7/10): demo_academic_seed_enrich
-- Built by scripts/build_squashed_flyway_migrations.py — do not edit by hand; regenerate from legacy migrations.

-- >>> Legacy V23: V23__fix_seed_password_bcrypt.sql
-- Replace incorrect legacy bcrypt (documented as admin123 but never matched Spring BCryptPasswordEncoder).
UPDATE users
SET password = '$2a$10$OF9wtmX3lDzBIYsrZlAe8Ou2829Ih6l6WTe2TxSVRacFh1fAr2mBy'
WHERE password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

-- >>> Legacy V24: V24__academic_subject_catalog.sql
-- Tenant-scoped subject master (dropdowns, reporting, future curriculum links).
-- Seeded for default demo tenant t1 (see V2). New tenants get API fallbacks until rows exist.

CREATE TABLE academic_subjects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    code VARCHAR(40) NULL,
    name VARCHAR(120) NOT NULL,
    category VARCHAR(50) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    UNIQUE KEY uk_academic_subject_tenant_name (tenant_id, name),
    INDEX idx_academic_subject_tenant (tenant_id, is_deleted, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO academic_subjects (tenant_id, code, name, category, sort_order) VALUES
('t1', 'MATH', 'Mathematics', 'STEM', 10),
('t1', 'PHY', 'Physics', 'STEM', 20),
('t1', 'CHEM', 'Chemistry', 'STEM', 30),
('t1', 'BIO', 'Biology', 'STEM', 40),
('t1', 'CS', 'Computer Science', 'STEM', 50),
('t1', 'IT', 'Information Technology', 'STEM', 55),
('t1', 'ENG', 'English', 'Languages', 60),
('t1', 'HIN', 'Hindi', 'Languages', 65),
('t1', 'BEN', 'Bengali', 'Languages', 66),
('t1', 'HIST', 'History', 'Social', 70),
('t1', 'GEO', 'Geography', 'Social', 75),
('t1', 'CIV', 'Civics', 'Social', 76),
('t1', 'ECO', 'Economics', 'Social', 77),
('t1', 'PE', 'Physical Education', 'Arts', 80),
('t1', 'ART', 'Art', 'Arts', 85),
('t1', 'MUS', 'Music', 'Arts', 86),
('t1', 'EVS', 'Environmental Science', 'STEM', 45);

-- >>> Legacy V25: V25__operations_extensions.sql
-- Substitute / cover (attendance + future period linkage)
CREATE TABLE attendance_cover_assignments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    cover_date DATE NOT NULL,
    period_number INT NULL COMMENT 'Optional period; null = whole day / class block',
    class_id BIGINT NOT NULL,
    section_id BIGINT NULL COMMENT 'Null = all sections in class',
    regular_teacher_id BIGINT NULL,
    covering_teacher_id BIGINT NOT NULL,
    reason VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    timetable_entry_id BIGINT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_aca_tenant_date_covering (tenant_id, cover_date, covering_teacher_id),
    INDEX idx_aca_tenant_class_date (tenant_id, class_id, cover_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Non-teaching / operational staff (drivers, security, office — not the academic Teacher row)
CREATE TABLE operational_staff (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    staff_role VARCHAR(40) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(40),
    email VARCHAR(120),
    employee_code VARCHAR(64),
    user_id BIGINT NULL,
    transport_route_id BIGINT NULL,
    notes VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_ops_staff_tenant_role (tenant_id, staff_role),
    INDEX idx_ops_staff_user (tenant_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE visitor_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    visitor_name VARCHAR(200) NOT NULL,
    phone VARCHAR(40),
    purpose VARCHAR(500),
    host_name VARCHAR(200),
    badge_no VARCHAR(64),
    check_in_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    check_out_at TIMESTAMP NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ON_PREMISES',
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_visitor_tenant_checkin (tenant_id, check_in_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE gate_passes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    student_id BIGINT NULL,
    issued_to_name VARCHAR(200) NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    purpose VARCHAR(500),
    issued_by_user_id BIGINT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_gate_tenant_valid (tenant_id, valid_from, valid_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inventory_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    sku VARCHAR(64) NOT NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(80),
    quantity_on_hand INT NOT NULL DEFAULT 0,
    reorder_level INT NOT NULL DEFAULT 0,
    location VARCHAR(120),
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    UNIQUE KEY uq_inv_tenant_sku (tenant_id, sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE fee_reminder_queue (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    student_id BIGINT NOT NULL,
    fee_payment_id BIGINT,
    due_date DATE,
    channel VARCHAR(20) NOT NULL DEFAULT 'EMAIL',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    scheduled_at TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    last_error VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_fee_rem_tenant_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
