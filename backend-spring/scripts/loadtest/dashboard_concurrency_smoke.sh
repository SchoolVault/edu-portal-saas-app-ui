#!/usr/bin/env bash
set -euo pipefail

# Lightweight dashboard concurrency smoke test.
# Usage:
#   BASE_URL=http://localhost:8080/api/v1 TOKEN=... ./scripts/loadtest/dashboard_concurrency_smoke.sh

BASE_URL="${BASE_URL:-http://localhost:8080/api/v1}"
TOKEN="${TOKEN:-}"
CONCURRENCY="${CONCURRENCY:-20}"
ROUNDS="${ROUNDS:-10}"
TIMEOUT_SEC="${TIMEOUT_SEC:-8}"

if [[ -z "${TOKEN}" ]]; then
  echo "TOKEN is required (Bearer JWT)." >&2
  exit 1
fi

auth=(-H "Authorization: Bearer ${TOKEN}" -H "Accept: application/json")

echo "Starting dashboard smoke test: concurrency=${CONCURRENCY} rounds=${ROUNDS} base=${BASE_URL}"
start_epoch="$(date +%s)"

for ((r=1; r<=ROUNDS; r++)); do
  seq 1 "${CONCURRENCY}" | xargs -I{} -P "${CONCURRENCY}" bash -c '
    code=$(curl -sS -o /dev/null -m "'"${TIMEOUT_SEC}"'" -w "%{http_code}" "'"${BASE_URL}/reports/dashboard/admin"'" "'"${auth[0]}"'" "'"${auth[1]}"'")
    if [[ "$code" != "200" ]]; then
      echo "round='"${r}"' code=${code}" >&2
      exit 11
    fi
  '
  echo "round ${r}/${ROUNDS} ok"
done

end_epoch="$(date +%s)"
echo "Completed in $((end_epoch - start_epoch))s"
echo "Tip: correlate with /actuator/metrics/http.server.requests and /actuator/prometheus."

