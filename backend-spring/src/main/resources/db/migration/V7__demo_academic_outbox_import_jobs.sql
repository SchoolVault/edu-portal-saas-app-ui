-- =============================================================================
-- Flyway V7 — Demo academic enrichment and outbox / import demo jobs
--
-- Extra classes/students/teachers for showcase tenant plus notification outbox and
-- import job samples (old V7 + V8).
-- =============================================================================

-- -------------------------------------------------------------------------
-- Legacy source: V7__demo_academic_seed_enrich.sql
-- Demo academic seed enrich (old V7).
-- -------------------------------------------------------------------------

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

-- -------------------------------------------------------------------------
-- Legacy source: V8__outbox_import_demo_jobs.sql
-- Outbox + import demo jobs + timetable demo rows (old V8).
-- -------------------------------------------------------------------------

-- >>> Legacy V26: V26__demo_tenant_academic_seed.sql
-- Showcase / sales demo data for default tenant t1: one class, section, teacher row linked to Sarah's login, one student linked to parent user.
-- Idempotent: skips rows that already exist (by email / admission number).

SET @demo_tenant := 't1';
SET @ay := (SELECT id FROM academic_years WHERE tenant_id = @demo_tenant AND is_current = TRUE LIMIT 1);
SET @u_teacher := (SELECT id FROM users WHERE tenant_id = @demo_tenant AND email = 'teacher@school.com' LIMIT 1);
SET @u_parent := (SELECT id FROM users WHERE tenant_id = @demo_tenant AND email = 'parent@school.com' LIMIT 1);

INSERT INTO teachers (tenant_id, first_name, last_name, email, phone, qualification, specialization, join_date, salary, status, user_id, is_active, is_deleted)
SELECT @demo_tenant, 'Sarah', 'Mitchell', 'teacher@school.com', '+1-555-0102', 'M.Ed', 'Mathematics', '2020-08-01', 55000.00, 'ACTIVE', @u_teacher, TRUE, FALSE
WHERE @u_teacher IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM teachers t WHERE t.tenant_id = @demo_tenant AND t.email = 'teacher@school.com');

SET @teach_id := (SELECT id FROM teachers WHERE tenant_id = @demo_tenant AND email = 'teacher@school.com' LIMIT 1);

INSERT INTO school_classes (tenant_id, name, grade, class_teacher_id, class_teacher_name, academic_year_id, is_active, is_deleted)
SELECT @demo_tenant, 'Class 8', 8, @teach_id, 'Sarah Mitchell', @ay, TRUE, FALSE
WHERE @ay IS NOT NULL AND @teach_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM school_classes c
      WHERE c.tenant_id = @demo_tenant AND c.name = 'Class 8' AND c.academic_year_id = @ay
  );

SET @class_id := (
    SELECT id FROM school_classes
    WHERE tenant_id = @demo_tenant AND name = 'Class 8' AND academic_year_id = @ay
    LIMIT 1
);

INSERT INTO sections (tenant_id, name, class_id, capacity, student_count, is_active, is_deleted)
SELECT @demo_tenant, 'A', @class_id, 40, 0, TRUE, FALSE
WHERE @class_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sections s WHERE s.tenant_id = @demo_tenant AND s.class_id = @class_id AND s.name = 'A');

SET @sec_id := (
    SELECT id FROM sections WHERE tenant_id = @demo_tenant AND class_id = @class_id AND name = 'A' LIMIT 1
);

INSERT INTO students (
    tenant_id, first_name, last_name, email, phone, date_of_birth, gender,
    class_id, section_id, roll_number, admission_number, admission_date,
    parent_id, parent_name, status, is_active, is_deleted
)
SELECT
    @demo_tenant, 'Emma', 'Chen', 'emma.c@school.com', '+1-555-0212', '2009-02-14', 'FEMALE',
    @class_id, @sec_id, '805', 'ADM2022080', '2022-06-08',
    @u_parent, 'Michael Chen', 'ACTIVE', TRUE, FALSE
WHERE @class_id IS NOT NULL AND @sec_id IS NOT NULL AND @u_parent IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM students st WHERE st.tenant_id = @demo_tenant AND st.admission_number = 'ADM2022080');

-- >>> Legacy V27: V27__demo_tenant_academic_enrich.sql
-- Extra academic + timetable rows for default tenant t1 (parity with mock-heavy UI / local integration).
-- Idempotent: uses NOT EXISTS on names and admission numbers.

SET @demo_tenant := 't1';
SET @ay := (SELECT id FROM academic_years WHERE tenant_id = @demo_tenant AND is_current = TRUE LIMIT 1);
SET @u_parent := (SELECT id FROM users WHERE tenant_id = @demo_tenant AND email = 'parent@school.com' LIMIT 1);
SET @teach_id := (SELECT id FROM teachers WHERE tenant_id = @demo_tenant AND email = 'teacher@school.com' LIMIT 1);

INSERT INTO school_classes (tenant_id, name, grade, class_teacher_id, class_teacher_name, academic_year_id, is_active, is_deleted)
SELECT @demo_tenant, 'Class 6', 6, @teach_id, 'Sarah Mitchell', @ay, TRUE, FALSE
WHERE @ay IS NOT NULL AND @teach_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM school_classes c
      WHERE c.tenant_id = @demo_tenant AND c.name = 'Class 6' AND c.academic_year_id = @ay
  );

INSERT INTO school_classes (tenant_id, name, grade, class_teacher_id, class_teacher_name, academic_year_id, is_active, is_deleted)
SELECT @demo_tenant, 'Class 9', 9, @teach_id, 'Sarah Mitchell', @ay, TRUE, FALSE
WHERE @ay IS NOT NULL AND @teach_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM school_classes c
      WHERE c.tenant_id = @demo_tenant AND c.name = 'Class 9' AND c.academic_year_id = @ay
  );

INSERT INTO school_classes (tenant_id, name, grade, class_teacher_id, class_teacher_name, academic_year_id, is_active, is_deleted)
SELECT @demo_tenant, 'Class 11', 11, @teach_id, 'Sarah Mitchell', @ay, TRUE, FALSE
WHERE @ay IS NOT NULL AND @teach_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM school_classes c
      WHERE c.tenant_id = @demo_tenant AND c.name = 'Class 11' AND c.academic_year_id = @ay
  );

SET @c6 := (SELECT id FROM school_classes WHERE tenant_id = @demo_tenant AND name = 'Class 6' AND academic_year_id = @ay LIMIT 1);
SET @c9 := (SELECT id FROM school_classes WHERE tenant_id = @demo_tenant AND name = 'Class 9' AND academic_year_id = @ay LIMIT 1);
SET @c11 := (SELECT id FROM school_classes WHERE tenant_id = @demo_tenant AND name = 'Class 11' AND academic_year_id = @ay LIMIT 1);

INSERT INTO sections (tenant_id, name, class_id, capacity, student_count, is_active, is_deleted)
SELECT @demo_tenant, 'A', @c6, 40, 0, TRUE, FALSE
WHERE @c6 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sections s WHERE s.tenant_id = @demo_tenant AND s.class_id = @c6 AND s.name = 'A');

INSERT INTO sections (tenant_id, name, class_id, capacity, student_count, is_active, is_deleted)
SELECT @demo_tenant, 'B', @c6, 40, 0, TRUE, FALSE
WHERE @c6 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sections s WHERE s.tenant_id = @demo_tenant AND s.class_id = @c6 AND s.name = 'B');

INSERT INTO sections (tenant_id, name, class_id, capacity, student_count, is_active, is_deleted)
SELECT @demo_tenant, 'A', @c9, 40, 0, TRUE, FALSE
WHERE @c9 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sections s WHERE s.tenant_id = @demo_tenant AND s.class_id = @c9 AND s.name = 'A');

INSERT INTO sections (tenant_id, name, class_id, capacity, student_count, is_active, is_deleted)
SELECT @demo_tenant, 'B', @c9, 40, 0, TRUE, FALSE
WHERE @c9 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sections s WHERE s.tenant_id = @demo_tenant AND s.class_id = @c9 AND s.name = 'B');

INSERT INTO sections (tenant_id, name, class_id, capacity, student_count, is_active, is_deleted)
SELECT @demo_tenant, 'A', @c11, 35, 0, TRUE, FALSE
WHERE @c11 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sections s WHERE s.tenant_id = @demo_tenant AND s.class_id = @c11 AND s.name = 'A');

SET @s6a := (SELECT id FROM sections WHERE tenant_id = @demo_tenant AND class_id = @c6 AND name = 'A' LIMIT 1);
SET @s9a := (SELECT id FROM sections WHERE tenant_id = @demo_tenant AND class_id = @c9 AND name = 'A' LIMIT 1);
SET @s9b := (SELECT id FROM sections WHERE tenant_id = @demo_tenant AND class_id = @c9 AND name = 'B' LIMIT 1);
SET @s11a := (SELECT id FROM sections WHERE tenant_id = @demo_tenant AND class_id = @c11 AND name = 'A' LIMIT 1);

INSERT INTO students (
    tenant_id, first_name, last_name, email, phone, date_of_birth, gender,
    class_id, section_id, roll_number, admission_number, admission_date,
    parent_id, parent_name, status, is_active, is_deleted
)
SELECT
    @demo_tenant, 'Jordan', 'Lee', 'jordan.l@school.com', '+1-555-0301', '2013-04-20', 'MALE',
    @c6, @s6a, '601', 'DEMO-V27-0601', '2025-06-01',
    @u_parent, 'Michael Chen', 'ACTIVE', TRUE, FALSE
WHERE @c6 IS NOT NULL AND @s6a IS NOT NULL AND @u_parent IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM students st WHERE st.tenant_id = @demo_tenant AND st.admission_number = 'DEMO-V27-0601');

INSERT INTO students (
    tenant_id, first_name, last_name, email, phone, date_of_birth, gender,
    class_id, section_id, roll_number, admission_number, admission_date,
    parent_id, parent_name, status, is_active, is_deleted
)
SELECT
    @demo_tenant, 'Sam', 'Rivera', 'sam.r@school.com', '+1-555-0302', '2013-08-11', 'OTHER',
    @c6, @s6a, '602', 'DEMO-V27-0602', '2025-06-01',
    NULL, '—', 'ACTIVE', TRUE, FALSE
WHERE @c6 IS NOT NULL AND @s6a IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM students st WHERE st.tenant_id = @demo_tenant AND st.admission_number = 'DEMO-V27-0602');

INSERT INTO students (
    tenant_id, first_name, last_name, email, phone, date_of_birth, gender,
    class_id, section_id, roll_number, admission_number, admission_date,
    parent_id, parent_name, status, is_active, is_deleted
)
SELECT
    @demo_tenant, 'Nina', 'Park', 'nina.p@school.com', '+1-555-0303', '2011-01-30', 'FEMALE',
    @c9, @s9a, '901', 'DEMO-V27-0901', '2024-06-01',
    @u_parent, 'Michael Chen', 'ACTIVE', TRUE, FALSE
WHERE @c9 IS NOT NULL AND @s9a IS NOT NULL AND @u_parent IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM students st WHERE st.tenant_id = @demo_tenant AND st.admission_number = 'DEMO-V27-0901');

INSERT INTO students (
    tenant_id, first_name, last_name, email, phone, date_of_birth, gender,
    class_id, section_id, roll_number, admission_number, admission_date,
    parent_id, parent_name, status, is_active, is_deleted
)
SELECT
    @demo_tenant, 'Chris', 'Nguyen', 'chris.n@school.com', '+1-555-0304', '2011-11-02', 'MALE',
    @c9, @s9b, '915', 'DEMO-V27-0915', '2024-06-01',
    NULL, '—', 'ACTIVE', TRUE, FALSE
WHERE @c9 IS NOT NULL AND @s9b IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM students st WHERE st.tenant_id = @demo_tenant AND st.admission_number = 'DEMO-V27-0915');

INSERT INTO students (
    tenant_id, first_name, last_name, email, phone, date_of_birth, gender,
    class_id, section_id, roll_number, admission_number, admission_date,
    parent_id, parent_name, status, is_active, is_deleted
)
SELECT
    @demo_tenant, 'Taylor', 'Brooks', 'taylor.b@school.com', '+1-555-0305', '2009-06-18', 'FEMALE',
    @c11, @s11a, '1101', 'DEMO-V27-1101', '2023-06-01',
    @u_parent, 'Michael Chen', 'ACTIVE', TRUE, FALSE
WHERE @c11 IS NOT NULL AND @s11a IS NOT NULL AND @u_parent IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM students st WHERE st.tenant_id = @demo_tenant AND st.admission_number = 'DEMO-V27-1101');

INSERT INTO timetable_entries (
    tenant_id, academic_year_id, class_id, section_id, day, period,
    start_time, end_time, subject_name, teacher_id, teacher_name, room, is_deleted
)
SELECT @demo_tenant, @ay, @c6, @s6a, 'MONDAY', 1, '08:00:00', '08:45:00', 'Mathematics', @teach_id, 'Sarah Mitchell', 'Room 101', FALSE
WHERE @ay IS NOT NULL AND @c6 IS NOT NULL AND @s6a IS NOT NULL AND @teach_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM timetable_entries t
      WHERE t.tenant_id = @demo_tenant AND t.class_id = @c6 AND t.section_id = @s6a
        AND t.day = 'MONDAY' AND t.period = 1 AND t.is_deleted = FALSE
  );

INSERT INTO timetable_entries (
    tenant_id, academic_year_id, class_id, section_id, day, period,
    start_time, end_time, subject_name, teacher_id, teacher_name, room, is_deleted
)
SELECT @demo_tenant, @ay, @c6, @s6a, 'MONDAY', 2, '08:45:00', '09:30:00', 'English', @teach_id, 'Sarah Mitchell', 'Room 101', FALSE
WHERE @ay IS NOT NULL AND @c6 IS NOT NULL AND @s6a IS NOT NULL AND @teach_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM timetable_entries t
      WHERE t.tenant_id = @demo_tenant AND t.class_id = @c6 AND t.section_id = @s6a
        AND t.day = 'MONDAY' AND t.period = 2 AND t.is_deleted = FALSE
  );

INSERT INTO timetable_entries (
    tenant_id, academic_year_id, class_id, section_id, day, period,
    start_time, end_time, subject_name, teacher_id, teacher_name, room, is_deleted
)
SELECT @demo_tenant, @ay, @c9, @s9a, 'TUESDAY', 1, '08:00:00', '08:45:00', 'Science', @teach_id, 'Sarah Mitchell', 'Lab 1', FALSE
WHERE @ay IS NOT NULL AND @c9 IS NOT NULL AND @s9a IS NOT NULL AND @teach_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM timetable_entries t
      WHERE t.tenant_id = @demo_tenant AND t.class_id = @c9 AND t.section_id = @s9a
        AND t.day = 'TUESDAY' AND t.period = 1 AND t.is_deleted = FALSE
  );

INSERT INTO timetable_entries (
    tenant_id, academic_year_id, class_id, section_id, day, period,
    start_time, end_time, subject_name, teacher_id, teacher_name, room, is_deleted
)
SELECT @demo_tenant, @ay, @c9, @s9a, 'WEDNESDAY', 1, '08:00:00', '08:45:00', 'Mathematics', @teach_id, 'Sarah Mitchell', 'Room 301', FALSE
WHERE @ay IS NOT NULL AND @c9 IS NOT NULL AND @s9a IS NOT NULL AND @teach_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM timetable_entries t
      WHERE t.tenant_id = @demo_tenant AND t.class_id = @c9 AND t.section_id = @s9a
        AND t.day = 'WEDNESDAY' AND t.period = 1 AND t.is_deleted = FALSE
  );

INSERT INTO timetable_entries (
    tenant_id, academic_year_id, class_id, section_id, day, period,
    start_time, end_time, subject_name, teacher_id, teacher_name, room, is_deleted
)
SELECT @demo_tenant, @ay, @c11, @s11a, 'MONDAY', 1, '08:00:00', '08:45:00', 'Physics', @teach_id, 'Sarah Mitchell', 'Lab 2', FALSE
WHERE @ay IS NOT NULL AND @c11 IS NOT NULL AND @s11a IS NOT NULL AND @teach_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM timetable_entries t
      WHERE t.tenant_id = @demo_tenant AND t.class_id = @c11 AND t.section_id = @s11a
        AND t.day = 'MONDAY' AND t.period = 1 AND t.is_deleted = FALSE
  );

-- >>> Legacy V28: V28__notification_outbox_salary_disburse.sql
-- Transactional outbox for SMS/WhatsApp (mock worker marks SENT) + salary disbursement audit rows.

CREATE TABLE notification_outbox (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    recipient_user_id BIGINT NULL,
    recipient_phone_e164 VARCHAR(24) NULL,
    subject VARCHAR(200) NULL,
    body_text TEXT NOT NULL,
    dedupe_key VARCHAR(200) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    attempts INT NOT NULL DEFAULT 0,
    last_error VARCHAR(500) NULL,
    correlation_id VARCHAR(64) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_no_tenant_status_created (tenant_id, status, created_at),
    INDEX idx_no_tenant_event (tenant_id, event_type),
    UNIQUE KEY uq_no_dedupe (tenant_id, dedupe_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE salary_disbursement_attempts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    payslip_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    payment_method VARCHAR(32) NOT NULL,
    reference_id VARCHAR(80) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
    gateway_payload TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sda_tenant_teacher (tenant_id, teacher_id),
    INDEX idx_sda_payslip (tenant_id, payslip_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Demo rows for QA tenant t1 (processed = mock history + one pending for worker smoke test)
SET @demo_tenant := 't1';
INSERT INTO notification_outbox (
    tenant_id, event_type, channel, recipient_user_id, recipient_phone_e164, subject, body_text, dedupe_key, status, attempts, processed_at, is_deleted
)
SELECT @demo_tenant, 'ANNOUNCEMENT_SMS', 'SMS', u.id, u.phone, 'Demo seed',
       'School ERP demo: outbox row (already sent).', CONCAT('seed:sms:', u.id), 'SENT', 1, NOW(), FALSE
FROM users u
WHERE u.tenant_id = @demo_tenant AND u.email = 'parent@school.com' AND u.phone IS NOT NULL AND u.phone <> ''
LIMIT 1;

INSERT INTO notification_outbox (
    tenant_id, event_type, channel, recipient_user_id, recipient_phone_e164, subject, body_text, dedupe_key, status, attempts, is_deleted
)
SELECT @demo_tenant, 'FEE_REMINDER', 'WHATSAPP', u.id, u.phone, 'Fee reminder (demo)',
       'Demo pending WhatsApp fee reminder — mock worker will mark SENT.', 'seed:fee:wa:pending', 'PENDING', 0, FALSE
FROM users u
WHERE u.tenant_id = @demo_tenant AND u.email = 'parent@school.com' AND u.phone IS NOT NULL AND u.phone <> ''
LIMIT 1;
