#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080/api/v1}"
TOKEN="${TOKEN:-}"
REQUESTS="${REQUESTS:-25}"
CONCURRENCY="${CONCURRENCY:-5}"
TARGET_AUDIENCE="${TARGET_AUDIENCE:-ALL}"
CHANNELS="${CHANNELS:-SMS}"

if [[ -z "$TOKEN" ]]; then
  echo "TOKEN is required"
  exit 1
fi

payload() {
  local i="$1"
  cat <<JSON
{"title":"Loadtest Campaign ${i}","message":"This is load test campaign ${i}","eventType":"ANNOUNCEMENT_PUBLISHED","targetAudience":"${TARGET_AUDIENCE}","channels":["${CHANNELS}"],"locale":"en"}
JSON
}

run_one() {
  local i="$1"
  curl -sS -o /dev/null -w "%{http_code}\n" \
    -X POST "${BASE_URL}/communication/campaigns/send" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    --data "$(payload "$i")"
}

export -f run_one payload
export BASE_URL TOKEN TARGET_AUDIENCE CHANNELS

seq 1 "$REQUESTS" | xargs -P "$CONCURRENCY" -I {} bash -lc 'run_one "$@"' _ {}

echo "Dispatched ${REQUESTS} campaign requests with concurrency ${CONCURRENCY}"
