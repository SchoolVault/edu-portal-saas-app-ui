-- Flyway baseline (part 5/10): exams_roles_platform_jobs
-- Regenerate from legacy scripts: backend-spring/scripts/build_squashed_flyway_migrations.py

-- >>> Legacy V17: V17__transport_fleet_and_live_location.sql
CREATE TABLE transport_vehicles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    registration_number VARCHAR(40) NOT NULL,
    vehicle_type VARCHAR(30) NOT NULL COMMENT 'BUS, VAN, CAR, OTHER',
    capacity INT NOT NULL DEFAULT 40,
    model VARCHAR(80) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_tv_tenant (tenant_id),
    INDEX idx_tv_tenant_reg (tenant_id, registration_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE transport_drivers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(30) NULL,
    license_number VARCHAR(60) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_td_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE transport_routes
    ADD COLUMN vehicle_id BIGINT NULL AFTER assigned_students,
    ADD COLUMN driver_id BIGINT NULL AFTER vehicle_id;

CREATE TABLE vehicle_live_locations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    vehicle_id BIGINT NOT NULL,
    route_id BIGINT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vll_tenant_vehicle (tenant_id, vehicle_id),
    INDEX idx_vll_route (tenant_id, route_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- >>> Legacy V18: V18__exam_class_scope_and_schedule.sql
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

-- >>> Legacy V19: V19__teacher_library_staff_role.sql
ALTER TABLE teachers
    ADD COLUMN library_staff_role VARCHAR(32) NULL;
