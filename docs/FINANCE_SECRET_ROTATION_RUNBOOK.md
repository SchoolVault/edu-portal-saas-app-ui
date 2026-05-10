# Finance Secret Rotation Runbook (Razorpay + RazorpayX)

This runbook rotates payout/webhook secrets with zero downtime.

## Scope

- `app.payroll.payout.razorpayx.key-id`
- `app.payroll.payout.razorpayx.key-secret`
- `app.payroll.payout.razorpayx.webhook-secret`
- `app.payments.razorpay.secret` (fees side)
- `app.payments.razorpay.webhook-secret` (fees side)

## Preconditions

- Metrics dashboard healthy (`FINANCE_ALERT_RULES.md`).
- Reconciliation scheduler active.
- Deployment rollback path verified.

## Steps

1. Create new provider keys/secrets in PSP console.
2. Keep old webhook endpoint active.
3. Update secret manager entries (new values) without restarting app yet.
4. Deploy app with new secrets to canary environment.
5. Validate:
   - payout initiate returns submitted
   - payout callback is accepted (signature valid)
   - fee webhook callback is accepted
6. Promote deployment to production with rolling strategy.
7. Monitor for 30 minutes:
   - webhook signature failures
   - reconciliation failures
   - stale submitted payout count
8. Revoke old PSP secrets.

## Rollback

- Re-apply previous secret versions from secret manager.
- Redeploy previous config and verify webhook acceptance.

## Notes

- Never log raw keys/secrets.
- Rotation should be scheduled during low payout volume windows.
