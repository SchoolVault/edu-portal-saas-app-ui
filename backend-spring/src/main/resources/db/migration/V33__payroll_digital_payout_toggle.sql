-- Per-tenant: allow initiating salary through the configured payout provider (e.g. RazorpayX).
-- Default OFF: schools pay teachers via their own process; staff records "mark paid" in the app.
-- When enabled, Payroll → initiate uses the same gateway as env configuration.

ALTER TABLE tenant_finance_profiles
    ADD COLUMN payroll_digital_payout_enabled TINYINT(1) NOT NULL DEFAULT 0
        COMMENT '1=initiate-salary may call payroll payout API; 0=offline first, mark paid in app only';
