-- Speed webhook + reconciliation lookups by gateway order id
CREATE INDEX idx_fpa_provider_order ON fee_payment_attempts (provider, provider_order_id);
