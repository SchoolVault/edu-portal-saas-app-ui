-- Payment routing onboarding gate (Razorpay Route): school submits → platform approves → LIVE checkout.

ALTER TABLE tenant_finance_profiles
    ADD COLUMN payment_routing_onboarding_status VARCHAR(40) NOT NULL DEFAULT 'NOT_REQUIRED',
    ADD COLUMN payment_routing_submitted_at DATETIME(6) NULL,
    ADD COLUMN payment_routing_live_at DATETIME(6) NULL,
    ADD COLUMN payment_routing_live_by_user_id BIGINT NULL,
    ADD COLUMN payment_routing_onboarding_declaration VARCHAR(2000) NULL;

-- Existing Route tenants: treat as already live (backward compatible).
UPDATE tenant_finance_profiles
SET payment_routing_onboarding_status = 'LIVE',
    payment_routing_live_at = COALESCE(updated_at, created_at, NOW(6)),
    payment_routing_submitted_at = COALESCE(updated_at, created_at, NOW(6))
WHERE UPPER(TRIM(fee_settlement_mode)) = 'ROUTE_LINKED_ACCOUNT'
  AND razorpay_route_linked_account_id IS NOT NULL
  AND TRIM(razorpay_route_linked_account_id) <> '';

UPDATE tenant_finance_profiles
SET payment_routing_onboarding_status = 'NOT_REQUIRED'
WHERE UPPER(TRIM(fee_settlement_mode)) <> 'ROUTE_LINKED_ACCOUNT'
   OR fee_settlement_mode IS NULL;

UPDATE tenant_finance_profiles
SET payment_routing_onboarding_status = 'DRAFT'
WHERE UPPER(TRIM(fee_settlement_mode)) = 'ROUTE_LINKED_ACCOUNT'
  AND (razorpay_route_linked_account_id IS NULL OR TRIM(razorpay_route_linked_account_id) = '');
