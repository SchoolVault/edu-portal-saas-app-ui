-- Widen http_status to INT for JPA Integer / Hibernate; safe no-op widening from SMALLINT.
ALTER TABLE payment_webhook_events MODIFY COLUMN http_status INT NULL;
