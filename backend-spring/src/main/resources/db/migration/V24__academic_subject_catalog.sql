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
