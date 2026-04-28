#!/usr/bin/env bash
set -euo pipefail

# Phase 4 go/no-go gate script.
# Evaluates hard pre-live checks for backend readiness.
#
# Usage:
#   BASE_URL=http://localhost:8080 ./scripts/prelive/phase4_go_live_gate.sh
# Optional:
#   AUTH_TOKEN=... DB_URL=... DB_USERNAME=... DB_PASSWORD=...

BASE_URL="${BASE_URL:-http://localhost:8080}"
AUTH_TOKEN="${AUTH_TOKEN:-}"
OUTPUT_DIR="${OUTPUT_DIR:-test_reports/phase4}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
REPORT_FILE="${OUTPUT_DIR}/go_live_gate_${TIMESTAMP}.txt"

mkdir -p "${OUTPUT_DIR}"

FAILURES=0

log() {
  echo "$1" | tee -a "${REPORT_FILE}"
}

pass() {
  log "[PASS] $1"
}

fail() {
  log "[FAIL] $1"
  FAILURES=$((FAILURES + 1))
}

check_health_endpoint() {
  local code
  code="$(curl -sS -o /dev/null -w "%{http_code}" "${BASE_URL}/actuator/health" || echo "000")"
  if [[ "${code}" == "200" ]]; then
    pass "Actuator health endpoint reachable"
  else
    fail "Actuator health endpoint failed (status=${code})"
  fi
}

check_required_env_docs() {
  local required=(
    "READ_DATASOURCE_URL"
    "APP_DATA_LIFECYCLE_HOT_WINDOW_YEARS"
    "APP_DATA_LIFECYCLE_WARM_WINDOW_YEARS"
    "APP_DATA_LIFECYCLE_ARCHIVE_AFTER_YEARS"
  )
  local missing=0
  for var_name in "${required[@]}"; do
    if [[ -z "${!var_name:-}" ]]; then
      log "[WARN] ${var_name} is not set in current shell"
      missing=$((missing + 1))
    fi
  done
  if [[ "${missing}" -eq 0 ]]; then
    pass "Recommended scale environment variables are present"
  else
    fail "Missing ${missing} recommended scale environment variables"
  fi
}

check_smoke_api() {
  local endpoint="$1"
  local code
  if [[ -n "${AUTH_TOKEN}" ]]; then
    code="$(curl -sS -o /dev/null -w "%{http_code}" -H "Authorization: Bearer ${AUTH_TOKEN}" "${BASE_URL}${endpoint}" || echo "000")"
  else
    code="$(curl -sS -o /dev/null -w "%{http_code}" "${BASE_URL}${endpoint}" || echo "000")"
  fi
  if [[ "${code}" =~ ^2|3|4 ]]; then
    pass "Smoke endpoint ${endpoint} reachable (status=${code})"
  else
    fail "Smoke endpoint ${endpoint} unreachable (status=${code})"
  fi
}

check_database_connectivity() {
  local db_url="${DB_URL:-}"
  local db_user="${DB_USERNAME:-}"
  local db_pass="${DB_PASSWORD:-}"
  if [[ -z "${db_url}" || -z "${db_user}" ]]; then
    fail "DB_URL/DB_USERNAME not provided for database gate checks"
    return
  fi

  if command -v mysql >/dev/null 2>&1; then
    if MYSQL_PWD="${db_pass}" mysql --connect-timeout=5 -u "${db_user}" -e "SELECT 1;" >/dev/null 2>&1; then
      pass "Database connectivity check succeeded"
    else
      fail "Database connectivity check failed"
    fi
  else
    fail "mysql client not installed; database connectivity not verified"
  fi
}

{
  echo "Phase 4 Go/No-Go Gate"
  echo "Timestamp: ${TIMESTAMP}"
  echo "Base URL: ${BASE_URL}"
  echo
} | tee "${REPORT_FILE}"

check_health_endpoint
check_required_env_docs
check_smoke_api "/api/v1/reports/dashboard/admin"
check_smoke_api "/api/v1/reports/dashboard/kpis"
check_smoke_api "/api/v1/notifications?page=0&size=20"
check_database_connectivity

echo | tee -a "${REPORT_FILE}"
if [[ "${FAILURES}" -eq 0 ]]; then
  pass "GO-LIVE GATE RESULT: GO"
  exit 0
fi

fail "GO-LIVE GATE RESULT: NO-GO (failures=${FAILURES})"
exit 1
