-- Squashed Flyway baseline (part 6/10): timetable_vehicle_password_catalog_ops
-- Built by scripts/build_squashed_flyway_migrations.py — do not edit by hand; regenerate from legacy migrations.

-- >>> Legacy V20: V20__platform_purge_jobs.sql
CREATE TABLE platform_tenant_purge_jobs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    school_code VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    error_message TEXT,
    rows_deleted_estimate INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    INDEX idx_ptpj_tenant (tenant_id),
    INDEX idx_ptpj_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- >>> Legacy V21: V21__timetable_section_nullable.sql
-- Allow class-level timetables when a school has no sections (was duplicate V14; renumbered for Flyway)
ALTER TABLE timetable_entries
    MODIFY COLUMN section_id BIGINT NULL;

-- >>> Legacy V22: V22__vehicle_live_location_audit.sql
-- Align vehicle_live_locations with BaseEntity (created_by / updated_by)
ALTER TABLE vehicle_live_locations
    ADD COLUMN created_by VARCHAR(100) NULL,
    ADD COLUMN updated_by VARCHAR(100) NULL;
