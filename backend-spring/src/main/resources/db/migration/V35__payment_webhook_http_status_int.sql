-- Standardize http_status as INT (JPA Integer); V33 used SMALLINT — widen for consistency across DBs.
ALTER TABLE payment_webhook_events
  MODIFY COLUMN http_status INT NULL;
