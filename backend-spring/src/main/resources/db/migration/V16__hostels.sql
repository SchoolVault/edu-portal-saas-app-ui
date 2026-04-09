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
