-- Per-tenant capability: allow parents to open Razorpay (or other) checkout from the parent portal.
-- When disabled, schools use counter/cash collection; staff records payments in Fees → ledger stays authoritative.
-- Default ON preserves existing behaviour after migration. Schools opting for offline-first set this to 0 in Settings → Finance.

ALTER TABLE tenant_finance_profiles
    ADD COLUMN parent_online_fee_checkout_enabled TINYINT(1) NOT NULL DEFAULT 1
        COMMENT '1=parents may use online fee checkout when env providers allow; 0=school counter only';
