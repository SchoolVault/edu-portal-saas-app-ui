-- V3__add_missing_tables.sql

-- Hostel Allocations
CREATE TABLE IF NOT EXISTS hostel_allocations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    room_id BIGINT NOT NULL,
    room_number VARCHAR(20),
    student_id BIGINT NOT NULL,
    student_name VARCHAR(200),
    from_date DATE,
    to_date DATE,
    status VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), updated_by VARCHAR(100),
    INDEX idx_ha_student (tenant_id, student_id),
    INDEX idx_ha_room (tenant_id, room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Student Transport Mapping
CREATE TABLE IF NOT EXISTS student_transport_mapping (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    route_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    student_name VARCHAR(200),
    pickup_stop VARCHAR(100),
    drop_stop VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), updated_by VARCHAR(100),
    INDEX idx_stm_student (tenant_id, student_id),
    INDEX idx_stm_route (tenant_id, route_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Messages (Teacher-Parent Chat)
CREATE TABLE IF NOT EXISTS messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    sender_id BIGINT NOT NULL,
    sender_name VARCHAR(200),
    sender_role VARCHAR(20),
    receiver_id BIGINT NOT NULL,
    receiver_name VARCHAR(200),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100), updated_by VARCHAR(100),
    INDEX idx_msg_sender (tenant_id, sender_id),
    INDEX idx_msg_receiver (tenant_id, receiver_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
