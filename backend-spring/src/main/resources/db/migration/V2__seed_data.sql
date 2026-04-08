-- V2__seed_data.sql - Default admin user and tenant config

-- Default tenant config
INSERT INTO tenant_configs (tenant_id, school_name, school_code, address, phone, email, primary_color, secondary_color, features_json)
VALUES ('t1', 'SchoolVault Academy', 'SCH001', '123 Education Lane, Knowledge City', '+1-555-0100', 'info@schoolvault.edu', '#1B3A30', '#C05C3D',
        '{"transport":true,"library":true,"hostel":true,"payroll":true,"documents":true,"audit":true,"communication":true,"reports":true}');

-- Default admin user (password: admin123 - bcrypt encoded)
INSERT INTO users (tenant_id, name, email, password, phone, role, school_code)
VALUES ('t1', 'John Anderson', 'admin@school.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+1-555-0101', 'ADMIN', 'SCH001');

INSERT INTO users (tenant_id, name, email, password, phone, role, school_code)
VALUES ('t1', 'Sarah Mitchell', 'teacher@school.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+1-555-0102', 'TEACHER', 'SCH001');

INSERT INTO users (tenant_id, name, email, password, phone, role, school_code)
VALUES ('t1', 'Michael Chen', 'parent@school.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+1-555-0103', 'PARENT', 'SCH001');

-- Academic Year
INSERT INTO academic_years (tenant_id, name, start_date, end_date, is_current) VALUES ('t1', '2025-2026', '2025-06-01', '2026-05-31', TRUE);
