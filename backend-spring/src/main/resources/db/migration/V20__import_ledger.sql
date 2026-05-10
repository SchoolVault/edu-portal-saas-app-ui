-- Per-row import ledger: create / update / skip for operator replay and manual rollback planning.

CREATE TABLE import_ledger (
  id BIGINT NOT NULL AUTO_INCREMENT,
  tenant_id VARCHAR(50) NOT NULL,
  job_id BIGINT NOT NULL,
  job_line_id BIGINT NULL,
  line_index INT NOT NULL,
  outcome VARCHAR(32) NOT NULL,
  entity_type VARCHAR(64) NULL,
  entity_id BIGINT NULL,
  natural_key VARCHAR(512) NULL,
  rollback_guidance VARCHAR(2000) NULL,
  is_active TINYINT(1) NULL DEFAULT 1,
  is_deleted TINYINT(1) NULL DEFAULT 0,
  deleted_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  created_by VARCHAR(100) NULL,
  updated_by VARCHAR(100) NULL,
  PRIMARY KEY (id),
  KEY idx_import_ledger_tenant_job (tenant_id, job_id, id),
  KEY idx_import_ledger_line (job_line_id)
) ENGINE=InnoDB;
