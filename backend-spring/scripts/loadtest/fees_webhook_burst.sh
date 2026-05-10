#!/usr/bin/env bash
set -euo pipefail

# Basic burst test for fees webhook ingestion endpoint.
# Usage:
#   BASE_URL=http://localhost:8080 EVENT_FILE=sample.json SIGNATURE=dummy ./fees_webhook_burst.sh 200

BASE_URL="${BASE_URL:-http://localhost:8080}"
EVENT_FILE="${EVENT_FILE:-}"
SIGNATURE="${SIGNATURE:-test-signature}"
COUNT="${1:-100}"

if [[ -z "$EVENT_FILE" || ! -f "$EVENT_FILE" ]]; then
  echo "Set EVENT_FILE to a valid webhook JSON file."
  exit 1
fi

echo "Running fees webhook burst: count=$COUNT base=$BASE_URL"

for i in $(seq 1 "$COUNT"); do
  curl -sS -X POST \
    "$BASE_URL/api/v1/fees/webhooks/razorpay" \
    -H "Content-Type: application/json" \
    -H "X-Razorpay-Signature: $SIGNATURE" \
    --data-binary "@$EVENT_FILE" >/dev/null &
done

wait
echo "Completed fees webhook burst."
