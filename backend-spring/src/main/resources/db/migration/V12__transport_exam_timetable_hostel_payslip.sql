ALTER TABLE route_stops
    ADD COLUMN latitude DECIMAL(10, 7) NULL AFTER stop_order,
    ADD COLUMN longitude DECIMAL(10, 7) NULL AFTER latitude,
    ADD COLUMN estimated_travel_minutes INT NULL COMMENT 'Minutes from route start' AFTER longitude;

ALTER TABLE hostel_rooms
    ADD COLUMN occupancy_status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE' AFTER room_type;

ALTER TABLE exams
    ADD COLUMN results_published BOOLEAN NOT NULL DEFAULT FALSE AFTER status,
    ADD COLUMN grading_config_json JSON NULL AFTER results_published;

ALTER TABLE timetable_entries
    ADD COLUMN academic_year_id BIGINT NULL AFTER tenant_id,
    ADD COLUMN timetable_version INT NOT NULL DEFAULT 1 AFTER academic_year_id,
    ADD COLUMN has_conflict BOOLEAN NOT NULL DEFAULT FALSE AFTER room;

CREATE INDEX idx_tt_year ON timetable_entries (tenant_id, academic_year_id);

ALTER TABLE payslips
    ADD COLUMN payroll_month VARCHAR(7) NULL COMMENT 'YYYY-MM' AFTER teacher_name,
    ADD COLUMN components_json JSON NULL AFTER payroll_month,
    ADD COLUMN tax_details_json JSON NULL AFTER components_json;

CREATE INDEX idx_payslip_month ON payslips (tenant_id, payroll_month);
