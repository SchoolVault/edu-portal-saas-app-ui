#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080/api/v1}"
TOKEN="${TOKEN:-}"
TENANT_ID="${TENANT_ID:-}"
WEBHOOK_SECRET="${WEBHOOK_SECRET:-}"
CAMPAIGN_ID="${CAMPAIGN_ID:-}"

if [[ -z "$TOKEN" ]]; then
  echo "TOKEN is required"
  exit 1
fi

echo "1) Provider health snapshot"
curl -sS -H "Authorization: Bearer ${TOKEN}" "${BASE_URL}/notifications/ops/provider-health"
echo

if [[ -n "$CAMPAIGN_ID" ]]; then
  echo "2) Replay campaign DLQ for ${CAMPAIGN_ID}"
  curl -sS -X POST \
    -H "Authorization: Bearer ${TOKEN}" \
    "${BASE_URL}/notifications/ops/dead-letter/replay-by-campaign/${CAMPAIGN_ID}?limit=200"
  echo
fi

if [[ -n "$TENANT_ID" && -n "$WEBHOOK_SECRET" ]]; then
  echo "3) Simulate provider recovery callback"
  curl -sS -X POST \
    -H "Content-Type: application/json" \
    -H "X-Webhook-Secret: ${WEBHOOK_SECRET}" \
    "${BASE_URL}/notifications/webhooks/msg91?tenantId=${TENANT_ID}" \
    --data '{"request_id":"simulate-recovery","message_id":"simulate-recovery-msg","status":"DELIVERED","reason":"Recovered provider route"}'
  echo
fi

echo "Outage simulation completed."
