# Fees and Payroll Real Payment Production Configuration

This page explains exactly what to configure to run **real money flow** in production:

- Parent pays fees through live payment gateway
- Admin disburses teacher salary through live payout gateway
- No mock payment behavior in production

It also documents how your current design scales to additional providers (Cashfree, Paytm, etc.) with minimal code changes.

## 1) What "real payment mode" means

You are in real production mode when all of the following are true:

1. Fee checkout provider is live (`razorpay` currently).
2. Payroll payout provider is live (`razorpayx` currently).
3. All live credentials and webhook secrets are configured.
4. Dry-run/sandbox flags are disabled for payout.
5. Webhooks are reachable from provider and signature validation passes.

## 2) Required production environment configuration

Set these as environment variables in production secrets (not in git).

### 2.1 Parent fee payment (live checkout)

- `PARENT_FEE_ENABLED_PROVIDERS=razorpay`
- `RAZORPAY_API_BASE=https://api.razorpay.com`
- `RAZORPAY_KEY=<live_key_id>`
- `RAZORPAY_SECRET=<live_key_secret>`
- `RAZORPAY_WEBHOOK_SECRET=<live_webhook_secret>`
- `RAZORPAY_FALLBACK_WITHOUT_CREDS=false`

### 2.2 Payroll salary disbursement (live payout)

- `APP_PAYROLL_PAYOUT_PROVIDER=razorpayx`
- `APP_PAYROLL_RAZORPAYX_KEY_ID=<live_key_id>`
- `APP_PAYROLL_RAZORPAYX_KEY_SECRET=<live_key_secret>`
- `APP_PAYROLL_RAZORPAYX_ACCOUNT_NUMBER=<virtual_account_number>`
- `APP_PAYROLL_RAZORPAYX_WEBHOOK_SECRET=<live_webhook_secret>`
- `APP_PAYROLL_RAZORPAYX_DRY_RUN=false`
- `APP_PAYROLL_RAZORPAYX_CONTACT_PREFIX=teacher-` (or org-specific prefix)

### 2.3 Reliability and reconciliation jobs

- `APP_FEES_RECON_ENABLED=true`
- `APP_FEES_RECON_POLL_MS=300000`
- `APP_FEES_STALE_TIMEOUT_MIN=15`
- `APP_PAYROLL_RECON_ENABLED=true`
- `APP_PAYROLL_RECON_POLL_MS=300000`
- `APP_PAYROLL_RECON_BATCH=50`
- `APP_PAYROLL_RECON_STALE_SUBMITTED_MIN=30`
- `APP_FINANCE_WEBHOOK_RETENTION_ENABLED=true`
- `APP_FINANCE_WEBHOOK_RETENTION_DAYS=180`

### 2.4 Safety and idempotency (recommended enabled)

- `APP_IDEMPOTENCY_ENABLED=true`
- `APP_IDEMPOTENCY_RESPONSE_TTL=86400`
- `APP_IDEMPOTENCY_LOCK_TTL=120`
- Redis must be available and stable for idempotency/locking behavior.

## 3) Provider dashboard webhook setup

Configure these callback URLs in provider dashboards:

- Fees webhook URL: `/api/v1/fees/webhooks/razorpay`
- Payroll webhook URL: `/api/v1/payroll/webhooks/razorpayx`

Use your public API base URL in front, for example:

- `https://api.yourdomain.com/api/v1/fees/webhooks/razorpay`
- `https://api.yourdomain.com/api/v1/payroll/webhooks/razorpayx`

Important:

- Ensure provider sends HMAC signature headers.
- Keep webhook secrets aligned between provider dashboard and app secrets.
- Do not put these webhook paths behind auth that blocks provider callbacks.

## 4) Runtime flow after configuration

### 4.1 Real parent fee flow

1. Parent creates checkout session (`/api/v1/parent/payments/checkout-session`).
2. Backend creates live provider order/session and returns checkout data.
3. Parent completes payment in provider UI.
4. Confirm API updates payment state.
5. Webhook ingestion handles async confirmation and replay-safe reconciliation.

### 4.2 Real payroll disbursement flow

1. Admin initiates disbursement (`/api/v1/payroll/disburse/initiate`).
2. Backend sends live payout request to configured payout provider.
3. Payout attempt is recorded with provider reference.
4. Webhook + reconciliation scheduler keep status converged (submitted/completed/failed).
5. Payslip/queue status is synchronized by reconciliation logic.

## 5) Go-live checklist (cutover day)

1. Confirm migrations are applied and finance tables exist.
2. Load all live credentials and webhook secrets in production secret manager.
3. Set provider mode:
  - `PARENT_FEE_ENABLED_PROVIDERS=razorpay`
  - `APP_PAYROLL_PAYOUT_PROVIDER=razorpayx`
  - `APP_PAYROLL_RAZORPAYX_DRY_RUN=false`
4. Register webhook URLs in provider dashboards.
5. Restart backend and verify startup has no missing config errors.
6. Execute one low-value real transaction for:
  - Fee payment from a parent test account
  - Payroll payout to a controlled beneficiary
7. Validate audit trails, ledger rows, and receipt/payout status transitions.
8. Enable monitoring and alerts for failed ratio + stale submitted payouts.

## 6) Rollback plan (if gateway outage or config issue)

If production issue occurs:

1. Keep reconciliation enabled (do not disable safety net).
2. Temporarily pause admin disbursement operations from UI/process.
3. Fix credentials/webhook mismatch first.
4. Re-run reconciliation and verify pending attempts converge.
5. As emergency non-live fallback (only if business accepts), switch payout provider to `mock` in non-customer windows; avoid this during active production payouts.

## 7) Why this design is scalable for new gateways

Your architecture is already provider-pluggable and config-driven:

- Fees side uses a strategy router (`FeePaymentCheckoutStrategy`) and delegated gateway client.
- Payroll side uses provider abstraction (`PayrollPayoutGatewayClient`) selected by config.
- Webhook ingestion and reconciliation are separated from UI actions.
- Idempotency + lock + ledger model protects against duplicate and out-of-order events.

This means you can add Cashfree/Paytm/other providers without rewriting core business flows.

## 8) How to add another provider (Cashfree/Paytm pattern)

### Fees (parent checkout)

1. Add provider id constant (example: `cashfree`).
2. Add a new strategy implementing `FeePaymentCheckoutStrategy`.
3. Implement create/confirm/fetch status for that provider.
4. Add provider-specific webhook verifier/processor mapping.
5. Include provider id in `PARENT_FEE_ENABLED_PROVIDERS` for target tenants/env.

### Payroll (salary payout)

1. Add implementation of `PayrollPayoutGatewayClient` for new provider.
2. Add provider-specific properties under `app.payroll.payout.<provider>`.
3. Add startup validation (similar to RazorpayX validator rules).
4. Add webhook endpoint/signature verifier and status mapping.
5. Set `APP_PAYROLL_PAYOUT_PROVIDER=<new_provider>` when promoting.

## 9) Production hardening recommendations

- Keep only live providers enabled in production; avoid mixed mock/live configuration.
- Enforce secret rotation runbook quarterly.
- Keep reconciliation jobs always-on.
- Monitor:
  - webhook reject/error rates
  - payout submitted aging
  - fee capture-to-receipt latency
- Run load scripts before major release:
  - `backend-spring/scripts/loadtest/fees_webhook_burst.sh`
  - `backend-spring/scripts/loadtest/payroll_queue_load.sh`

## 10) Quick verification commands (manual checks)

- Confirm fee provider config values are non-empty in production runtime.
- Confirm payroll provider is `razorpayx` and dry-run is `false`.
- Confirm webhook endpoints receive provider callbacks (2xx + valid signature).
- Confirm one end-to-end parent payment and one end-to-end salary payout complete successfully.

---

If you want, next I can generate a second page for your **SMS production architecture**:

- onboarding SMS and verification link flow,
- announcement fanout to parents/teachers,
- delivery retries/DLQ,
- cost controls and provider failover,
- and scaling model for exam result/fee receipt notifications.

