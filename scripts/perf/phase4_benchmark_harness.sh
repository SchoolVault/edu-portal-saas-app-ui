#!/usr/bin/env bash
set -euo pipefail

# Phase 4 benchmark harness (lightweight, curl-based).
# Purpose: quick repeatable latency/error baseline without external tooling.
#
# Usage:
#   BASE_URL=http://localhost:8080 ./scripts/perf/phase4_benchmark_harness.sh
# Optional:
#   AUTH_TOKEN=... TENANT_HEADER=school-1 REQUESTS_PER_ENDPOINT=50

BASE_URL="${BASE_URL:-http://localhost:8080}"
AUTH_TOKEN="${AUTH_TOKEN:-}"
TENANT_HEADER="${TENANT_HEADER:-}"
REQUESTS_PER_ENDPOINT="${REQUESTS_PER_ENDPOINT:-30}"
WARMUP_REQUESTS="${WARMUP_REQUESTS:-5}"
OUTPUT_DIR="${OUTPUT_DIR:-test_reports/phase4}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
REPORT_FILE="${OUTPUT_DIR}/benchmark_${TIMESTAMP}.txt"

mkdir -p "${OUTPUT_DIR}"

declare -a ENDPOINTS=(
  "/actuator/health"
  "/api/v1/reports/dashboard/admin"
  "/api/v1/reports/dashboard/kpis"
  "/api/v1/notifications?page=0&size=20"
  "/api/v1/students?page=0&size=20"
)

build_headers() {
  local -a headers=()
  headers+=("-H" "Accept: application/json")
  if [[ -n "${AUTH_TOKEN}" ]]; then
    headers+=("-H" "Authorization: Bearer ${AUTH_TOKEN}")
  fi
  if [[ -n "${TENANT_HEADER}" ]]; then
    headers+=("-H" "X-Tenant-Id: ${TENANT_HEADER}")
  fi
  printf '%s\n' "${headers[@]}"
}

percentile() {
  local percentile_rank="$1"
  shift
  local values=("$@")
  local count="${#values[@]}"
  if [[ "${count}" -eq 0 ]]; then
    echo "0"
    return
  fi
  local raw_index=$(( (percentile_rank * count + 99) / 100 ))
  local index=$(( raw_index - 1 ))
  if [[ "${index}" -lt 0 ]]; then
    index=0
  fi
  if [[ "${index}" -ge "${count}" ]]; then
    index=$(( count - 1 ))
  fi
  echo "${values[$index]}"
}

run_endpoint_benchmark() {
  local endpoint="$1"
  local url="${BASE_URL}${endpoint}"
  local -a timings_ms=()
  local success_count=0
  local failure_count=0

  mapfile -t header_args < <(build_headers)

  for ((i=1; i<=WARMUP_REQUESTS; i++)); do
    curl -sS -o /dev/null "${header_args[@]}" "${url}" || true
  done

  for ((i=1; i<=REQUESTS_PER_ENDPOINT; i++)); do
    local response
    response="$(curl -sS -o /dev/null -w "%{http_code} %{time_total}" "${header_args[@]}" "${url}" || echo "000 9.999")"
    local status_code latency_seconds
    status_code="$(echo "${response}" | awk '{print $1}')"
    latency_seconds="$(echo "${response}" | awk '{print $2}')"
    local latency_ms
    latency_ms="$(awk "BEGIN { printf \"%.3f\", ${latency_seconds} * 1000 }")"
    timings_ms+=("${latency_ms}")

    if [[ "${status_code}" =~ ^2|3 ]]; then
      success_count=$((success_count + 1))
    else
      failure_count=$((failure_count + 1))
    fi
  done

  IFS=$'\n' timings_ms=($(printf "%s\n" "${timings_ms[@]}" | sort -n))
  unset IFS

  local p50 p95 p99 max
  p50="$(percentile 50 "${timings_ms[@]}")"
  p95="$(percentile 95 "${timings_ms[@]}")"
  p99="$(percentile 99 "${timings_ms[@]}")"
  max="${timings_ms[$((${#timings_ms[@]} - 1))]}"

  {
    echo "Endpoint: ${endpoint}"
    echo "  requests=${REQUESTS_PER_ENDPOINT} warmup=${WARMUP_REQUESTS}"
    echo "  success=${success_count} failure=${failure_count}"
    echo "  p50_ms=${p50} p95_ms=${p95} p99_ms=${p99} max_ms=${max}"
    echo
  } | tee -a "${REPORT_FILE}"
}

{
  echo "Phase 4 Benchmark Harness"
  echo "Timestamp: ${TIMESTAMP}"
  echo "Base URL: ${BASE_URL}"
  echo "Requests/Endpoint: ${REQUESTS_PER_ENDPOINT}"
  echo
} | tee "${REPORT_FILE}"

for endpoint in "${ENDPOINTS[@]}"; do
  run_endpoint_benchmark "${endpoint}"
done

echo "Benchmark report generated at: ${REPORT_FILE}"
