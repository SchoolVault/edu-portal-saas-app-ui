# Fees + Payroll Production Readiness Checklist

This checklist is the final "go-live quality gate" for fees and payroll modules.

## 1) Financial correctness and replay safety

- [x] Idempotency on critical write paths (checkout/disbursement/reconcile/refund)
- [x] Immutable fee ledger for money movement
- [x] Webhook ingestion with signature verification and duplicate suppression
- [x] Canonical status transitions for fee and payroll attempts
- [x] Financial audit event writes on all major transitions

## 2) Payout provider readiness (RazorpayX)

- [x] Provider abstraction for initiate + status polling
- [x] Live credentials validation guard at startup (fail-fast when dry-run is false)
- [x] Beneficiary lifecycle (contact + fund account) with tenant-safe reusable cache
- [x] Bank fingerprint-based beneficiary reuse to prevent duplicate fund accounts
- [x] Payout callback contract with event/status matrix mapping

## 3) Reliability and recovery

- [x] Scheduled reconciliation for pending payout attempts
- [x] Webhook-driven status sync and manual queue override from admin console
- [x] Lock-protected updates for payout initiation and status transitions
- [x] Add alert rules in monitoring stack (high failed payout ratio, stale submitted payouts)
- [x] Run disaster drills: webhook delay, duplicate callbacks, provider downtime

## 4) Security and compliance

- [x] Payout webhooks are unauthenticated but HMAC protected
- [x] Secrets read from environment-backed configuration
- [x] Sensitive credential masking in diagnostic payloads
- [x] Verify production secret rotation runbook
- [x] Confirm data retention policy for webhook payload tables

## 5) Performance and scale checks (80% school-fit target)

- [x] Load test fee webhook ingestion at burst traffic
- [x] Load test payroll payout queue with multi-tenant concurrency
- [ ] Confirm DB indices with production-size data snapshots
- [x] Validate queue reconciliation batch sizing for peak cycles

## 6) QA and release

- [ ] Add automated integration tests for live payout mode (mocked HTTP)
- [ ] Validate mobile/tablet views for admin finance screens
- [ ] Complete UAT scenarios (admin, parent, teacher roles)
- [ ] Execute staged rollout with canary schools

## Operational launch notes

- Keep `app.payroll.payout.provider=mock` and `dry-run=true` in non-production.
- In production, switch to `provider=razorpayx` and `dry-run=false` only after secrets are configured.
- Run reconciliation scheduler continuously; it is the safety net for eventual consistency.
- Use `backend-spring/scripts/loadtest/` scripts before launch cutover.
