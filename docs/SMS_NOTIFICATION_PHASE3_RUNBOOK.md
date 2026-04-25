# SMS Notification Phase 3 Runbook

This runbook covers final-stage enterprise operations for SMS notifications:

- provider failover routing
- DLQ replay operations
- outage simulation drills
- capacity certification thresholds

## 1) Production Routing Configuration

Set routing mode and enabled providers:

- `APP_SMS_ROUTING_ENABLED=true`
- `APP_SMS_ROUTING_PRIORITY=MSG91,TWILIO,AWS_SNS,MOCK`
- `APP_SMS_ROUTING_SKIP_UNHEALTHY=true`
- `APP_SMS_PROVIDER_MSG91_ENABLED=true`
- `APP_SMS_PROVIDER_TWILIO_ENABLED=true`
- `APP_SMS_PROVIDER_AWS_SNS_ENABLED=false`
- `APP_SMS_PROVIDER_MOCK_ENABLED=true` (optional safety fallback)

## 2) Operations Endpoints

Admin endpoints for runtime operations:

- `GET /api/v1/notifications/ops/provider-health`
- `GET /api/v1/notifications/ops/dead-letter?page=0&size=20`
- `POST /api/v1/notifications/ops/dead-letter/{id}/replay`
- `POST /api/v1/notifications/ops/dead-letter/replay-by-campaign/{campaignId}?limit=200`

## 3) Outage Simulation Drill

Run in staging:

`backend-spring/scripts/loadtest/sms_provider_outage_simulation.sh`

Inputs:

- `BASE_URL`
- `TOKEN`
- optional `CAMPAIGN_ID` for replay drill
- optional `TENANT_ID` + `WEBHOOK_SECRET` for callback simulation

Expected result:

- provider health visible
- replay operations succeed
- replayed rows move from `DEAD_LETTER` to `RETRY`

## 4) Capacity Certification Workflow

Run:

`backend-spring/scripts/loadtest/sms_capacity_certification.sh`

Inputs:

- `BASE_URL`
- `TOKEN`
- `REQUESTS` (default `100`)
- `CONCURRENCY` (default `10`)
- `MAX_ACCEPTED_ERROR_RATE_PCT` (default `2`)
- `MAX_P95_MS` (default `1200`)

Certification pass criteria:

- HTTP error rate <= threshold
- P95 latency <= threshold

## 5) Alerting Checklist

Configure alerts for:

- DLQ growth spike
- Provider health all-down state
- Campaign queued but no sent progression
- Retry queue age > SLA threshold

Suggested SLO starter values:

- campaign enqueue availability: 99.9%
- provider health check freshness: < 5 minutes
- DLQ replay success ratio: > 95%

## 6) Incident Recovery Sequence

1. Check provider health endpoint and logs.
2. Verify routing order and unhealthy skip flags.
3. Replay dead letters by campaign.
4. Confirm sent progression on campaign analytics.
5. If still degraded, move failing provider lower in priority and re-test.
