-- V1__init_schema.sql - SchoolVault ERP Complete Database Schema
-- Multi-tenant with tenant_id on every table, soft-delete, audit columns

-- Users (Auth)
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL,
    school_code VARCHAR(100),
    avatar VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    UNIQUE KEY uk_user_tenant_email (tenant_id, email),
    INDEX idx_user_tenant (tenant_id),
    INDEX idx_user_school_code (school_code, email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Academic Years
CREATE TABLE academic_years (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), updated_by VARCHAR(100),
    INDEX idx_ay_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- School Classes
CREATE TABLE school_classes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(50) NOT NULL,
    grade INT NOT NULL,
    class_teacher_id BIGINT,
    class_teacher_name VARCHAR(200),
    academic_year_id BIGINT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), updated_by VARCHAR(100),
    INDEX idx_class_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sections
CREATE TABLE sections (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(10) NOT NULL,
    class_id BIGINT NOT NULL,
    capacity INT NOT NULL DEFAULT 40,
    student_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), updated_by VARCHAR(100),
    INDEX idx_section_class (tenant_id, class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Students
CREATE TABLE students (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10),
    class_id BIGINT,
    section_id BIGINT,
    roll_number VARCHAR(20),
    admission_number VARCHAR(50) NOT NULL,
    admission_date DATE,
    parent_id BIGINT,
    parent_name VARCHAR(200),
    address VARCHAR(500),
    blood_group VARCHAR(5),
    avatar VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), updated_by VARCHAR(100),
    UNIQUE KEY uk_student_admission (tenant_id, admission_number),
    INDEX idx_student_tenant (tenant_id),
    INDEX idx_student_class (tenant_id, class_id),
    INDEX idx_student_section (tenant_id, class_id, section_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Teachers
CREATE TABLE teachers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    qualification VARCHAR(200),
    specialization VARCHAR(100),
    join_date DATE,
    salary DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    avatar VARCHAR(500),
    user_id BIGINT,
    is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), updated_by VARCHAR(100),
    INDEX idx_teacher_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE teacher_subjects (
    teacher_id BIGINT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    PRIMARY KEY (teacher_id, subject),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Attendance
CREATE TABLE attendance_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    student_id BIGINT NOT NULL,
    student_name VARCHAR(200),
    class_id BIGINT NOT NULL,
    section_id BIGINT NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(10) NOT NULL,
    marked_by BIGINT,
    remarks VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), updated_by VARCHAR(100),
    INDEX idx_att_class_date (tenant_id, class_id, date),
    INDEX idx_att_student (tenant_id, student_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Timetable
CREATE TABLE timetable_entries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    class_id BIGINT NOT NULL,
    section_id BIGINT NOT NULL,
    day VARCHAR(10) NOT NULL,
    period INT NOT NULL,
    start_time TIME,
    end_time TIME,
    subject_name VARCHAR(100) NOT NULL,
    teacher_id BIGINT,
    teacher_name VARCHAR(200),
    room VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), updated_by VARCHAR(100),
    INDEX idx_tt_class (tenant_id, class_id, section_id),
    INDEX idx_tt_teacher (tenant_id, teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Exams
CREATE TABLE exams (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    academic_year_id BIGINT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), updated_by VARCHAR(100),
    INDEX idx_exam_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Mark Records
CREATE TABLE mark_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    exam_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    student_name VARCHAR(200),
    subject_name VARCHAR(100) NOT NULL,
    marks_obtained DOUBLE NOT NULL,
    max_marks DOUBLE NOT NULL,
    grade VARCHAR(5),
    class_id BIGINT,
    is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), updated_by VARCHAR(100),
    INDEX idx_marks_exam (tenant_id, exam_id),
    INDEX idx_marks_student (tenant_id, student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fee Structures
CREATE TABLE fee_structures (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    class_id BIGINT,
    class_name VARCHAR(50),
    academic_year_id BIGINT,
    total_amount DECIMAL(12,2),
    is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), updated_by VARCHAR(100),
    INDEX idx_fs_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fee Components
CREATE TABLE fee_components (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    fee_structure_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), updated_by VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fee Payments
CREATE TABLE fee_payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    student_id BIGINT NOT NULL,
    student_name VARCHAR(200),
    fee_structure_id BIGINT,
    amount DECIMAL(12,2),
    paid_amount DECIMAL(12,2),
    due_amount DECIMAL(12,2),
    status VARCHAR(10),
    payment_date DATE,
    due_date DATE,
    discount DECIMAL(10,2) DEFAULT 0,
    late_fee DECIMAL(10,2) DEFAULT 0,
    receipt_number VARCHAR(50),
    payment_method VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), updated_by VARCHAR(100),
    INDEX idx_fp_student (tenant_id, student_id),
    INDEX idx_fp_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Announcements
CREATE TABLE announcements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    author VARCHAR(200),
    author_role VARCHAR(20),
    target_audience VARCHAR(20),
    target_class_id BIGINT,
    is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), updated_by VARCHAR(100),
    INDEX idx_ann_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Notifications
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message VARCHAR(500),
    type VARCHAR(10),
    is_read BOOLEAN DEFAULT FALSE,
    user_id BIGINT NOT NULL,
    link VARCHAR(300),
    is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), updated_by VARCHAR(100),
    INDEX idx_notif_user (tenant_id, user_id),
    INDEX idx_notif_read (tenant_id, user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Transport Routes
CREATE TABLE transport_routes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    vehicle_number VARCHAR(20),
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    assigned_students INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), updated_by VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE route_stops (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    route_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    stop_time TIME,
    stop_order INT,
    is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), updated_by VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Library
CREATE TABLE books (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(200),
    isbn VARCHAR(20),
    category VARCHAR(50),
    total_copies INT,
    available_copies INT,
    shelf_location VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), updated_by VARCHAR(100),
    INDEX idx_book_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE book_issues (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    book_id BIGINT NOT NULL,
    book_title VARCHAR(200),
    student_id BIGINT NOT NULL,
    student_name VARCHAR(200),
    issue_date DATE,
    due_date DATE,
    return_date DATE,
    fine DECIMAL(8,2) DEFAULT 0,
    status VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), updated_by VARCHAR(100),
    INDEX idx_bi_student (tenant_id, student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Hostel
CREATE TABLE hostel_rooms (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    room_number VARCHAR(20),
    block VARCHAR(50),
    floor INT,
    capacity INT,
    occupancy INT DEFAULT 0,
    room_type VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), updated_by VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Payroll
CREATE TABLE salary_structures (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    teacher_id BIGINT NOT NULL,
    teacher_name VARCHAR(200),
    basic_salary DECIMAL(12,2),
    net_salary DECIMAL(12,2),
    is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), updated_by VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE salary_components (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    salary_structure_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(15) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), updated_by VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE payslips (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    teacher_id BIGINT NOT NULL,
    teacher_name VARCHAR(200),
    month VARCHAR(20),
    year INT,
    basic_salary DECIMAL(12,2),
    total_allowances DECIMAL(12,2),
    total_deductions DECIMAL(12,2),
    net_salary DECIMAL(12,2),
    status VARCHAR(15),
    payment_date DATE,
    is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), updated_by VARCHAR(100),
    INDEX idx_payslip_teacher (tenant_id, teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Documents
CREATE TABLE documents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    file_type VARCHAR(20),
    category VARCHAR(20),
    uploaded_by VARCHAR(100),
    file_size VARCHAR(20),
    file_url VARCHAR(500),
    related_entity_id BIGINT,
    related_entity_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), updated_by VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Audit Logs
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    action VARCHAR(10) NOT NULL,
    module VARCHAR(50) NOT NULL,
    description VARCHAR(500) NOT NULL,
    user_id BIGINT,
    user_name VARCHAR(200),
    ip_address VARCHAR(45),
    entity_id BIGINT,
    entity_type VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), updated_by VARCHAR(100),
    INDEX idx_audit_tenant_date (tenant_id, created_at),
    INDEX idx_audit_user (tenant_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tenant Config
CREATE TABLE tenant_configs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL UNIQUE,
    school_name VARCHAR(200) NOT NULL,
    school_code VARCHAR(20) NOT NULL,
    logo VARCHAR(500),
    address VARCHAR(500),
    phone VARCHAR(20),
    email VARCHAR(150),
    primary_color VARCHAR(10),
    secondary_color VARCHAR(10),
    features_json TEXT,
    is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), updated_by VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
