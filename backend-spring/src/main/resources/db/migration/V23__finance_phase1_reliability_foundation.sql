-- Phase 1 reliability foundation: operation-key idempotency + canonical attempt states + immutable financial audit log.

ALTER TABLE fee_payment_attempts
    ADD COLUMN operation_key VARCHAR(120) NULL AFTER provider_payment_id;

ALTER TABLE salary_disbursement_attempts
    ADD COLUMN operation_key VARCHAR(120) NULL AFTER reference_id;

UPDATE fee_payment_attempts
SET status = 'ORDER_CREATED'
WHERE status IS NULL
   OR TRIM(status) = ''
   OR LOWER(status) = 'initiated';

UPDATE fee_payment_attempts
SET status = 'RECONCILED'
WHERE LOWER(status) = 'success';

UPDATE fee_payment_attempts
SET status = 'FAILED'
WHERE LOWER(status) = 'failed';

UPDATE salary_disbursement_attempts
SET status = 'PROCESSED'
WHERE UPPER(TRIM(status)) = 'COMPLETED';

CREATE UNIQUE INDEX ux_fpa_tenant_operation_key_active
  ON fee_payment_attempts (tenant_id, operation_key, is_deleted);

CREATE UNIQUE INDEX ux_sda_tenant_operation_key_active
  ON salary_disbursement_attempts (tenant_id, operation_key, is_deleted);

CREATE TABLE financial_audit_events (
  id BIGINT NOT NULL AUTO_INCREMENT,
  tenant_id VARCHAR(50) NOT NULL,
  module_name VARCHAR(40) NOT NULL,
  action_name VARCHAR(64) NOT NULL,
  entity_type VARCHAR(40) NOT NULL,
  entity_id BIGINT NOT NULL,
  operation_key VARCHAR(120) NULL,
  idempotency_key VARCHAR(120) NULL,
  from_state VARCHAR(32) NULL,
  to_state VARCHAR(32) NULL,
  event_status VARCHAR(32) NULL,
  provider VARCHAR(40) NULL,
  reference_id VARCHAR(120) NULL,
  currency VARCHAR(10) NULL,
  amount DECIMAL(14,2) NULL,
  detail_json TEXT NULL,
  is_active TINYINT(1) NULL DEFAULT 1,
  is_deleted TINYINT(1) NULL DEFAULT 0,
  deleted_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  created_by VARCHAR(100) NULL,
  updated_by VARCHAR(100) NULL,
  PRIMARY KEY (id),
  KEY idx_fin_audit_lookup (tenant_id, module_name, entity_type, entity_id),
  KEY idx_fin_audit_operation (tenant_id, operation_key),
  KEY idx_fin_audit_created (tenant_id, created_at)
) ENGINE=InnoDB;

CREATE UNIQUE INDEX ux_payment_webhook_provider_external_event
  ON payment_webhook_events (provider, external_event_id);
