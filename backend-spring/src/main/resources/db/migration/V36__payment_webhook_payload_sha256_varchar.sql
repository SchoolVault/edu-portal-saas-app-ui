-- CHAR(64) → VARCHAR(64) so JPA String + length=64 matches Hibernate validate (Types#VARCHAR).
ALTER TABLE payment_webhook_events MODIFY COLUMN payload_sha256 VARCHAR(64) NOT NULL;
