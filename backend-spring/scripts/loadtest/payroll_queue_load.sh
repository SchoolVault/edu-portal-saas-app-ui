#!/usr/bin/env bash
set -euo pipefail

# Simulates payout initiation load for payroll queue behavior.
# Requires valid ADMIN_JWT and tenant setup.
#
# Usage:
#   BASE_URL=http://localhost:8080 ADMIN_JWT=... ./payroll_queue_load.sh 50

BASE_URL="${BASE_URL:-http://localhost:8080}"
ADMIN_JWT="${ADMIN_JWT:-}"
COUNT="${1:-50}"
MONTH="${MONTH:-April}"
YEAR="${YEAR:-2026}"
TEACHER_ID_START="${TEACHER_ID_START:-1}"

if [[ -z "$ADMIN_JWT" ]]; then
  echo "Set ADMIN_JWT for authenticated payroll requests."
  exit 1
fi

echo "Running payroll queue load: count=$COUNT base=$BASE_URL"

for i in $(seq 0 $((COUNT-1))); do
  teacher_id=$((TEACHER_ID_START + i))
  op_key="LOADTEST-PAYROLL-$teacher_id-$(date +%s%N)"
  curl -sS -X POST \
    "$BASE_URL/api/v1/payroll/disburse/initiate" \
    -H "Authorization: Bearer $ADMIN_JWT" \
    -H "Content-Type: application/json" \
    -H "X-Operation-Key: $op_key" \
    -H "Idempotency-Key: $op_key" \
    -d "{\"teacherId\":$teacher_id,\"month\":\"$MONTH\",\"year\":$YEAR,\"paymentMethod\":\"NEFT\"}" >/dev/null &
done

wait
echo "Completed payroll queue load."
