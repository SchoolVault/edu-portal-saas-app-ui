-- Import, user/finance integrity, warehouse aggregates, and disbursement safety.

ALTER TABLE import_jobs
    ADD COLUMN payload_hash VARCHAR(64) NULL COMMENT 'SHA-256 hex of upload bytes';

ALTER TABLE import_jobs
    ADD COLUMN column_mapping_hash VARCHAR(64) NOT NULL DEFAULT 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
        COMMENT 'SHA-256 hex of normalized column mapping (empty map = SHA-256 of empty string)';

CREATE INDEX idx_import_jobs_tenant_type_hash_status
    ON import_jobs (tenant_id, job_type, payload_hash, status);

CREATE INDEX idx_import_jobs_idem_mapping
    ON import_jobs (tenant_id, job_type, payload_hash, column_mapping_hash, status);

UPDATE users
SET phone = NULL
WHERE phone IS NOT NULL
  AND TRIM(phone) = '';

UPDATE users
SET is_deleted = 0
WHERE is_deleted IS NULL;

CREATE UNIQUE INDEX ux_users_tenant_phone_is_deleted
  ON users (tenant_id, phone, is_deleted);

UPDATE fee_structures
SET is_deleted = 0
WHERE is_deleted IS NULL;

UPDATE salary_structures
SET is_deleted = 0
WHERE is_deleted IS NULL;

CREATE UNIQUE INDEX ux_fee_structures_tenant_class_year_name_active
  ON fee_structures (tenant_id, class_id, academic_year_id, name, is_deleted);

CREATE UNIQUE INDEX ux_salary_structures_tenant_teacher_active
  ON salary_structures (tenant_id, teacher_id, is_deleted);

CREATE TABLE IF NOT EXISTS wh_dashboard_daily_metrics (
  id BIGINT NOT NULL AUTO_INCREMENT,
  tenant_id VARCHAR(50) NOT NULL,
  metric_date DATE NOT NULL,
  total_students BIGINT NOT NULL DEFAULT 0,
  total_teachers BIGINT NOT NULL DEFAULT 0,
  fees_collected DECIMAL(14,2) NOT NULL DEFAULT 0,
  fees_pending DECIMAL(14,2) NOT NULL DEFAULT 0,
  attendance_total BIGINT NOT NULL DEFAULT 0,
  attendance_present BIGINT NOT NULL DEFAULT 0,
  attendance_absent BIGINT NOT NULL DEFAULT 0,
  attendance_late BIGINT NOT NULL DEFAULT 0,
  attendance_excused BIGINT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY ux_wh_dashboard_daily (tenant_id, metric_date),
  KEY idx_wh_dashboard_daily_lookup (tenant_id, metric_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wh_class_daily_summary (
  id BIGINT NOT NULL AUTO_INCREMENT,
  tenant_id VARCHAR(50) NOT NULL,
  metric_date DATE NOT NULL,
  class_id BIGINT NOT NULL,
  class_name VARCHAR(200) NULL,
  grade INT NULL,
  sections BIGINT NOT NULL DEFAULT 0,
  total_students BIGINT NOT NULL DEFAULT 0,
  attendance_percentage DECIMAL(7,2) NOT NULL DEFAULT 0,
  performance_percentage DECIMAL(7,2) NOT NULL DEFAULT 0,
  fee_collection_percentage DECIMAL(7,2) NOT NULL DEFAULT 0,
  overdue_accounts BIGINT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY ux_wh_class_daily (tenant_id, metric_date, class_id),
  KEY idx_wh_class_daily_lookup (tenant_id, metric_date, grade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wh_section_daily_summary (
  id BIGINT NOT NULL AUTO_INCREMENT,
  tenant_id VARCHAR(50) NOT NULL,
  metric_date DATE NOT NULL,
  class_id BIGINT NOT NULL,
  section_id BIGINT NOT NULL,
  class_name VARCHAR(200) NULL,
  section_name VARCHAR(200) NULL,
  class_teacher_name VARCHAR(200) NULL,
  student_count BIGINT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY ux_wh_section_daily (tenant_id, metric_date, section_id),
  KEY idx_wh_section_daily_lookup (tenant_id, metric_date, class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wh_teacher_workload_daily_summary (
  id BIGINT NOT NULL AUTO_INCREMENT,
  tenant_id VARCHAR(50) NOT NULL,
  metric_date DATE NOT NULL,
  teacher_id BIGINT NOT NULL,
  teacher_name VARCHAR(200) NULL,
  specialization VARCHAR(200) NULL,
  teacher_status VARCHAR(40) NULL,
  subjects_json JSON NULL,
  homeroom_classes VARCHAR(500) NULL,
  assigned_classes BIGINT NOT NULL DEFAULT 0,
  weekly_periods BIGINT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY ux_wh_teacher_workload_daily (tenant_id, metric_date, teacher_id),
  KEY idx_wh_teacher_workload_lookup (tenant_id, metric_date, teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wh_student_attendance_monthly_summary (
  id BIGINT NOT NULL AUTO_INCREMENT,
  tenant_id VARCHAR(50) NOT NULL,
  month_key VARCHAR(7) NOT NULL,
  class_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  student_name VARCHAR(220) NULL,
  present_count BIGINT NOT NULL DEFAULT 0,
  absent_count BIGINT NOT NULL DEFAULT 0,
  late_count BIGINT NOT NULL DEFAULT 0,
  excused_count BIGINT NOT NULL DEFAULT 0,
  total_days BIGINT NOT NULL DEFAULT 0,
  attendance_percentage DECIMAL(7,2) NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY ux_wh_student_att_month (tenant_id, month_key, class_id, student_id),
  KEY idx_wh_student_att_month_lookup (tenant_id, month_key, class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

UPDATE salary_disbursement_attempts
SET status = UPPER(TRIM(status))
WHERE status IS NOT NULL;

UPDATE salary_disbursement_attempts
SET status = 'SUBMITTED'
WHERE status IS NULL
   OR status = ''
   OR status NOT IN ('SUBMITTED', 'COMPLETED', 'FAILED');

UPDATE salary_disbursement_attempts
SET is_deleted = 0
WHERE is_deleted IS NULL;

CREATE UNIQUE INDEX ux_salary_disb_tenant_reference_active
  ON salary_disbursement_attempts (tenant_id, reference_id, is_deleted);

CREATE INDEX idx_salary_disb_tenant_status_completed
  ON salary_disbursement_attempts (tenant_id, status, completed_at, is_deleted);
