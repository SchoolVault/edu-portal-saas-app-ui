CREATE TABLE IF NOT EXISTS dashboard_snapshots (
  id BIGINT NOT NULL AUTO_INCREMENT,
  tenant_id VARCHAR(50) NOT NULL,
  is_active BIT(1) DEFAULT b'1',
  is_deleted BIT(1) DEFAULT b'0',
  deleted_at DATETIME NULL,
  created_at DATETIME NULL,
  updated_at DATETIME NULL,
  created_by VARCHAR(100) NULL,
  updated_by VARCHAR(100) NULL,
  snapshot_type VARCHAR(40) NOT NULL,
  role_code VARCHAR(30) NOT NULL,
  scope_key VARCHAR(180) NOT NULL,
  window_start DATE NULL,
  window_end DATE NULL,
  payload_json JSON NOT NULL,
  cache_version INT NOT NULL DEFAULT 1,
  generated_at DATETIME NULL,
  refresh_required BIT(1) NOT NULL DEFAULT b'0',
  PRIMARY KEY (id),
  UNIQUE KEY ux_dash_snapshot_scope (tenant_id, snapshot_type, role_code, scope_key, window_start, window_end, is_deleted),
  KEY idx_dash_snap_lookup (tenant_id, snapshot_type, role_code, scope_key, is_deleted),
  KEY idx_dash_snap_refresh (refresh_required, generated_at, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lifecycle_archive_records (
  id BIGINT NOT NULL AUTO_INCREMENT,
  tenant_id VARCHAR(50) NOT NULL,
  source_table VARCHAR(80) NOT NULL,
  source_id BIGINT NOT NULL,
  archived_at DATETIME NOT NULL,
  source_created_at DATETIME NULL,
  payload_json JSON NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY ux_lifecycle_archive_source (tenant_id, source_table, source_id),
  KEY idx_lifecycle_archive_lookup (tenant_id, source_table, archived_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Query-path hardening indexes for tenant-scoped report workloads.
CREATE INDEX idx_students_tenant_deleted_class
    ON students (tenant_id, is_deleted, class_id);

CREATE INDEX idx_sections_tenant_deleted_class
    ON sections (tenant_id, is_deleted, class_id);

CREATE INDEX idx_attendance_tenant_deleted_class_date_status
    ON attendance_records (tenant_id, is_deleted, class_id, date, status);

CREATE INDEX idx_mark_records_tenant_deleted_class_max
    ON mark_records (tenant_id, is_deleted, class_id, max_marks);

CREATE INDEX idx_fee_payments_tenant_deleted_student_status
    ON fee_payments (tenant_id, is_deleted, student_id, status);

CREATE INDEX idx_cta_tenant_deleted_teacher_eff
    ON class_teacher_assignments (tenant_id, is_deleted, teacher_id, effective_from, effective_to);

CREATE INDEX idx_cta_tenant_deleted_class_sec_eff
    ON class_teacher_assignments (tenant_id, is_deleted, class_id, section_id, effective_to);

CREATE INDEX idx_timetable_entries_tenant_deleted_teacher_day_period
    ON timetable_entries (tenant_id, is_deleted, teacher_id, day, period);
