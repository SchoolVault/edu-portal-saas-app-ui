#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080/api/v1}"
TOKEN="${TOKEN:-}"
REQUESTS="${REQUESTS:-100}"
CONCURRENCY="${CONCURRENCY:-10}"
MAX_ACCEPTED_ERROR_RATE_PCT="${MAX_ACCEPTED_ERROR_RATE_PCT:-2}"
MAX_P95_MS="${MAX_P95_MS:-1200}"

if [[ -z "$TOKEN" ]]; then
  echo "TOKEN is required"
  exit 1
fi

tmp_file="$(mktemp)"
trap 'rm -f "$tmp_file"' EXIT

payload() {
  local i="$1"
  cat <<JSON
{"title":"Capacity Test ${i}","message":"Capacity certification campaign ${i}","eventType":"ANNOUNCEMENT_PUBLISHED","targetAudience":"ALL","channels":["SMS"],"locale":"en"}
JSON
}

run_one() {
  local i="$1"
  local out
  out=$(curl -sS -o /dev/null -w "%{http_code} %{time_total}\n" \
    -X POST "${BASE_URL}/communication/campaigns/send" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    --data "$(payload "$i")")
  echo "$out"
}

export -f run_one payload
export BASE_URL TOKEN

seq 1 "$REQUESTS" | xargs -P "$CONCURRENCY" -I {} bash -lc 'run_one "$@"' _ {} | tee "$tmp_file" >/dev/null

total=$(wc -l < "$tmp_file" | tr -d ' ')
errors=$(awk '$1 !~ /^20[02]$/ {c++} END {print c+0}' "$tmp_file")
error_rate_pct=$(awk -v e="$errors" -v t="$total" 'BEGIN { if (t==0) print 100; else printf "%.2f", (e*100.0)/t }')

p95_ms=$(awk '{print $2*1000}' "$tmp_file" | sort -n | awk -v n="$total" 'BEGIN{idx=int((95*n+99)/100)} NR==idx{printf "%.0f", $1}')

echo "Total: $total"
echo "Errors: $errors"
echo "Error rate (%): $error_rate_pct"
echo "P95 latency (ms): ${p95_ms:-0}"

fail=0
awk -v val="$error_rate_pct" -v lim="$MAX_ACCEPTED_ERROR_RATE_PCT" 'BEGIN { if (val > lim) exit 1 }' || fail=1
awk -v val="${p95_ms:-0}" -v lim="$MAX_P95_MS" 'BEGIN { if (val > lim) exit 1 }' || fail=1

if [[ "$fail" -ne 0 ]]; then
  echo "Capacity certification FAILED (threshold breach)."
  exit 2
fi

echo "Capacity certification PASSED."
