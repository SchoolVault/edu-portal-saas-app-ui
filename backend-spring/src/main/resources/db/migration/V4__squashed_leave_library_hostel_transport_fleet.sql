-- Squashed Flyway baseline (part 4/10): leave_library_hostel_transport_fleet
-- Built by scripts/build_squashed_flyway_migrations.py — do not edit by hand; regenerate from legacy migrations.

-- >>> Legacy V13: V13__leave_requests.sql
CREATE TABLE leave_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    applicant_user_id BIGINT NOT NULL,
    applicant_role VARCHAR(20) NOT NULL,
    student_id BIGINT,
    teacher_id BIGINT,
    leave_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    approver_user_id BIGINT,
    approver_remarks VARCHAR(500),
    balance_snapshot_json JSON,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_leave_tenant_status (tenant_id, status),
    INDEX idx_leave_applicant (tenant_id, applicant_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- >>> Legacy V14: V14__leave_day_unit.sql
ALTER TABLE leave_requests
    ADD COLUMN day_unit VARCHAR(20) NOT NULL DEFAULT 'FULL_DAY' AFTER end_date;

-- >>> Legacy V15: V15__tenant_library_fine_teacher_bank.sql
ALTER TABLE tenant_configs
    ADD COLUMN library_fine_per_day DECIMAL(10, 2) NOT NULL DEFAULT 10.00 COMMENT 'INR per overdue day; tenant-specific' AFTER secondary_color;

ALTER TABLE teachers
    ADD COLUMN bank_account_holder VARCHAR(200) NULL AFTER avatar,
    ADD COLUMN bank_name VARCHAR(120) NULL AFTER bank_account_holder,
    ADD COLUMN bank_account_number VARCHAR(64) NULL AFTER bank_name,
    ADD COLUMN bank_ifsc VARCHAR(32) NULL AFTER bank_account_number;

-- >>> Legacy V16: V16__hostels.sql
CREATE TABLE hostels (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    name VARCHAR(160) NOT NULL,
    code VARCHAR(40) NULL,
    gender_scope VARCHAR(20) NULL COMMENT 'MALE, FEMALE, MIXED',
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_hostel_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE hostel_rooms
    ADD COLUMN hostel_id BIGINT NULL AFTER tenant_id,
    ADD INDEX idx_hostel_rooms_building (tenant_id, hostel_id);
