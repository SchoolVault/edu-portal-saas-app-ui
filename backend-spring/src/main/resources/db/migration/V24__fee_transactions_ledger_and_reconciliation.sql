-- Phase 2: fee ledger (append-only), provider dedupe, and reconciliation indexes.

CREATE TABLE fee_transactions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  tenant_id VARCHAR(50) NOT NULL,
  fee_payment_id BIGINT NOT NULL,
  attempt_id BIGINT NULL,
  event_type VARCHAR(40) NOT NULL,
  event_status VARCHAR(32) NULL,
  amount DECIMAL(14,2) NOT NULL,
  currency VARCHAR(10) NULL,
  provider VARCHAR(40) NULL,
  provider_payment_id VARCHAR(120) NULL,
  reference_id VARCHAR(120) NULL,
  operation_key VARCHAR(120) NULL,
  note VARCHAR(400) NULL,
  metadata_json TEXT NULL,
  occurred_at DATETIME(6) NULL,
  is_active TINYINT(1) NULL DEFAULT 1,
  is_deleted TINYINT(1) NULL DEFAULT 0,
  deleted_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  created_by VARCHAR(100) NULL,
  updated_by VARCHAR(100) NULL,
  PRIMARY KEY (id),
  KEY idx_fee_txn_payment (tenant_id, fee_payment_id, created_at),
  KEY idx_fee_txn_attempt (tenant_id, attempt_id),
  KEY idx_fee_txn_event (tenant_id, event_type, created_at)
) ENGINE=InnoDB;

CREATE UNIQUE INDEX ux_fee_txn_capture_provider_payment
  ON fee_transactions (tenant_id, event_type, provider_payment_id, is_deleted);

CREATE INDEX idx_fee_attempt_status_initiated
  ON fee_payment_attempts (status, initiated_at, is_deleted);
