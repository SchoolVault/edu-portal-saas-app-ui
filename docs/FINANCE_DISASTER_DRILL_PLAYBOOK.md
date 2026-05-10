# Finance Disaster Drill Playbook

Run these drills monthly in staging and quarterly in production-like environment.

## Drill A: Webhook delay

Goal: Ensure reconciliation closes pending payouts/payments when callback is delayed.

Steps:

1. Disable inbound webhook route temporarily (network policy or mock gateway delay).
2. Trigger fee payment + payroll payout requests.
3. Wait for scheduler cycles.
4. Restore webhook path and replay callbacks.
5. Validate final status convergence and audit entries.

## Drill B: Duplicate callbacks

Goal: Validate idempotent webhook ingestion.

Steps:

1. Send same webhook payload 3 times (same external event id).
2. Confirm only one state transition is applied.
3. Confirm duplicate events are acknowledged but not re-applied.

## Drill C: Provider API downtime

Goal: Validate retry/circuit-breaker + graceful queue behavior.

Steps:

1. Simulate 5xx from payout provider endpoints.
2. Trigger disbursement + reconciliation.
3. Verify service does not crash, attempts stay in safe status.
4. Restore provider; verify scheduler heals queue.

## Exit criteria

- No duplicate ledger/event postings.
- No unbounded queue growth.
- Recovery completed within agreed SLO window.
