-- Product-level email verification (one-time tokens; hash stored, not raw token).

CREATE TABLE email_verification_tokens (
  id BIGINT NOT NULL AUTO_INCREMENT,
  tenant_id VARCHAR(50) NOT NULL,
  user_id BIGINT NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  consumed_at DATETIME(6) NULL,
  is_active TINYINT(1) NULL DEFAULT 1,
  is_deleted TINYINT(1) NULL DEFAULT 0,
  deleted_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  created_by VARCHAR(100) NULL,
  updated_by VARCHAR(100) NULL,
  PRIMARY KEY (id),
  KEY idx_email_verif_lookup (tenant_id, user_id, token_hash),
  KEY idx_email_verif_user (tenant_id, user_id, expires_at)
) ENGINE=InnoDB;
