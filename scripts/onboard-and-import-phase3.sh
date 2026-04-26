#!/usr/bin/env bash
set -euo pipefail

# Onboard a school + admin, then import phase3 CSV files in sequence.
#
# Usage:
#   chmod +x scripts/onboard-and-import-phase3.sh
#   scripts/onboard-and-import-phase3.sh
#
# Optional env overrides:
#   API_BASE_URL=http://localhost:8080/api/v1
#   IMPORT_DIR=docs/onboarding-import-pack/phase3-production-mini-6to12
#   SCHOOL_NAME="Greenfield International School"
#   SCHOOL_CODE="GFIS612"                  # if omitted, generated automatically
#   ADMIN_NAME="Ritika Sharma"
#   ADMIN_EMAIL="principal@gfis.edu.in"    # if omitted, generated from school code
#   ADMIN_PHONE="+919876543210"
#   ADMIN_PASSWORD="StrongPass@123"
#   ACADEMIC_YEAR_NAME="AY 2026-2027"
#   ACADEMIC_YEAR_START="2026-04-01"
#   ACADEMIC_YEAR_END="2027-03-31"
#   IMPORT_EXECUTION_MODE="BEST_EFFORT"    # or ALL_OR_NOTHING
#   IMPORT_REPROCESS="false"               # true/false
#   POLL_SECONDS=3
#   POLL_TIMEOUT_SECONDS=900
#   LOGIN_EMAIL="existing-admin@school.com"
#   LOGIN_PASSWORD="ExistingPass@123"      # when set, skips onboarding and logs in directly
#   AUTH_SCHOOL_CODE="PLATFORM"            # school code used only for login (e.g. super admin workspace)
#   IMPORT_SCHOOL_CODE="SUN612"            # target school code for import APIs; defaults to SCHOOL_CODE

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

API_BASE_URL="${API_BASE_URL:-http://localhost:8080/api/v1}"
IMPORT_DIR="${IMPORT_DIR:-$ROOT_DIR/docs/onboarding-import-pack/phase3-production-mini-6to12}"
SCHOOL_NAME="${SCHOOL_NAME:-Greenfield International School}"
SCHOOL_CODE="${SCHOOL_CODE:-PH3$(date +%m%d%H%M)}"
SCHOOL_CODE_LOWER="$(printf '%s' "$SCHOOL_CODE" | tr '[:upper:]' '[:lower:]')"
ADMIN_NAME="${ADMIN_NAME:-Ritika Sharma}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin+${SCHOOL_CODE_LOWER}@schoolvault.local}"
ADMIN_PHONE="${ADMIN_PHONE:-+919876543210}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-StrongPass@123}"
ACADEMIC_YEAR_NAME="${ACADEMIC_YEAR_NAME:-AY 2026-2027}"
ACADEMIC_YEAR_START="${ACADEMIC_YEAR_START:-2026-04-01}"
ACADEMIC_YEAR_END="${ACADEMIC_YEAR_END:-2027-03-31}"
IMPORT_EXECUTION_MODE="${IMPORT_EXECUTION_MODE:-BEST_EFFORT}"
IMPORT_REPROCESS="${IMPORT_REPROCESS:-false}"
POLL_SECONDS="${POLL_SECONDS:-3}"
POLL_TIMEOUT_SECONDS="${POLL_TIMEOUT_SECONDS:-900}"
LOGIN_EMAIL="${LOGIN_EMAIL:-}"
LOGIN_PASSWORD="${LOGIN_PASSWORD:-}"
AUTH_SCHOOL_CODE="${AUTH_SCHOOL_CODE:-$SCHOOL_CODE}"
IMPORT_SCHOOL_CODE="${IMPORT_SCHOOL_CODE:-$SCHOOL_CODE}"

if [[ ! -d "$IMPORT_DIR" ]]; then
  echo "Import directory not found: $IMPORT_DIR" >&2
  exit 1
fi

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_cmd curl
require_cmd python3

json_get() {
  local json="$1"
  local expr="$2"
  JSON_INPUT="$json" python3 -c '
import json
import os
import sys

expr = sys.argv[1]
raw = os.environ.get("JSON_INPUT", "")
if not raw:
    print("")
    sys.exit(0)
data = json.loads(raw)
cur = data
for part in expr.split("."):
    if isinstance(cur, dict) and part in cur:
        cur = cur[part]
    else:
        cur = None
        break
if cur is None:
    print("")
elif isinstance(cur, (dict, list)):
    print(json.dumps(cur))
else:
    print(cur)
' "$expr"
}

http_json() {
  local method="$1"
  local url="$2"
  local body="$3"
  local auth="${4:-}"
  local tmp
  tmp="$(mktemp)"
  local code
  if [[ -n "$auth" ]]; then
    code="$(curl -sS -o "$tmp" -w "%{http_code}" -X "$method" "$url" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $auth" \
      -d "$body")"
  else
    code="$(curl -sS -o "$tmp" -w "%{http_code}" -X "$method" "$url" \
      -H "Content-Type: application/json" \
      -d "$body")"
  fi
  local resp
  resp="$(cat "$tmp")"
  rm -f "$tmp"
  if [[ "$code" -lt 200 || "$code" -ge 300 ]]; then
    echo "HTTP $code calling $url" >&2
    echo "$resp" >&2
    exit 1
  fi
  echo "$resp"
}

submit_import() {
  local token="$1"
  local job_type="$2"
  local file_path="$3"
  local tmp
  tmp="$(mktemp)"
  local code
  code="$(curl -sS -o "$tmp" -w "%{http_code}" -X POST "$API_BASE_URL/import-export/jobs" \
    -H "Authorization: Bearer $token" \
    -F "jobType=$job_type" \
    -F "file=@$file_path" \
    -F "executionMode=$IMPORT_EXECUTION_MODE" \
    -F "reprocess=$IMPORT_REPROCESS" \
    -F "schoolCode=$IMPORT_SCHOOL_CODE")"
  local resp
  resp="$(cat "$tmp")"
  rm -f "$tmp"
  if [[ "$code" -lt 200 || "$code" -ge 300 ]]; then
    echo "Import submit failed for $job_type ($file_path), HTTP $code" >&2
    echo "$resp" >&2
    if [[ "$code" == "403" ]]; then
      echo "Hint: current user lacks IMPORT_EXPORT_WRITE for this school." >&2
      echo "Try with existing admin/super-admin creds:" >&2
      echo "  LOGIN_EMAIL=... LOGIN_PASSWORD=... AUTH_SCHOOL_CODE=PLATFORM IMPORT_SCHOOL_CODE=$IMPORT_SCHOOL_CODE ./onboard-and-import-phase3.sh" >&2
    fi
    exit 1
  fi
  echo "$resp"
}

wait_for_job() {
  local token="$1"
  local job_id="$2"
  local started
  started="$(date +%s)"
  while true; do
    local tmp
    tmp="$(mktemp)"
    local code
    code="$(curl -sS -o "$tmp" -w "%{http_code}" \
      -H "Authorization: Bearer $token" \
      "$API_BASE_URL/import-export/jobs/$job_id?schoolCode=$IMPORT_SCHOOL_CODE")"
    local resp
    resp="$(cat "$tmp")"
    rm -f "$tmp"
    if [[ "$code" -lt 200 || "$code" -ge 300 ]]; then
      echo "Failed to fetch job $job_id, HTTP $code" >&2
      echo "$resp" >&2
      exit 1
    fi
    local status
    status="$(json_get "$resp" "data.status")"
    local ok fail total
    ok="$(json_get "$resp" "data.successCount")"
    fail="$(json_get "$resp" "data.failCount")"
    total="$(json_get "$resp" "data.totalRows")"
    echo "  job=$job_id status=$status success=$ok failed=$fail total=$total"

    if [[ "$status" == "COMPLETED" ]]; then
      if [[ "${fail:-0}" != "0" ]]; then
        echo "Job $job_id completed with failed rows ($fail)." >&2
        echo "Check: $API_BASE_URL/import-export/jobs/$job_id/lines" >&2
        exit 1
      fi
      break
    fi
    if [[ "$status" == "FAILED" ]]; then
      echo "Job $job_id failed." >&2
      echo "Check: $API_BASE_URL/import-export/jobs/$job_id/lines" >&2
      exit 1
    fi

    local now elapsed
    now="$(date +%s)"
    elapsed=$((now - started))
    if (( elapsed > POLL_TIMEOUT_SECONDS )); then
      echo "Timed out waiting for job $job_id after ${POLL_TIMEOUT_SECONDS}s." >&2
      exit 1
    fi
    sleep "$POLL_SECONDS"
  done
}

map_job_type() {
  local filename="$1"
  case "$filename" in
    01_classes_sections.csv) echo "CLASSES" ;;
    02_teachers.csv) echo "TEACHERS" ;;
    03_staff.csv) echo "STAFF" ;;
    03_students.csv) echo "STUDENTS" ;;
    04_timetable.csv) echo "TIMETABLE" ;;
    05_fee_structures.csv) echo "FEE_STRUCTURES" ;;
    *)
      echo ""
      ;;
  esac
}

echo "==> Onboarding school"
echo "    schoolName=$SCHOOL_NAME"
echo "    schoolCode=$SCHOOL_CODE"
echo "    adminEmail=$ADMIN_EMAIL"

if [[ -n "$LOGIN_EMAIL" && -n "$LOGIN_PASSWORD" ]]; then
  echo "==> Skipping onboarding (using existing login credentials)"
  LOGIN_PAYLOAD="$(cat <<JSON
{
  "email": "$LOGIN_EMAIL",
  "password": "$LOGIN_PASSWORD",
  "schoolCode": "$AUTH_SCHOOL_CODE",
  "interfaceLocale": "en"
}
JSON
)"
  LOGIN_RESP="$(http_json "POST" "$API_BASE_URL/auth/login" "$LOGIN_PAYLOAD")"
  TOKEN="$(json_get "$LOGIN_RESP" "data.token")"
  REFRESH_TOKEN="$(json_get "$LOGIN_RESP" "data.refreshToken")"
else
  ONBOARD_PAYLOAD="$(cat <<JSON
{
  "schoolName": "$SCHOOL_NAME",
  "schoolCode": "$SCHOOL_CODE",
  "adminName": "$ADMIN_NAME",
  "adminEmail": "$ADMIN_EMAIL",
  "adminPassword": "$ADMIN_PASSWORD",
  "phone": "$ADMIN_PHONE",
  "address": "Sector 21, Noida, Uttar Pradesh",
  "interfaceLocale": "en",
  "academicYearName": "$ACADEMIC_YEAR_NAME",
  "academicYearStartDate": "$ACADEMIC_YEAR_START",
  "academicYearEndDate": "$ACADEMIC_YEAR_END"
}
JSON
)"

  ONBOARD_RESP="$(http_json "POST" "$API_BASE_URL/auth/onboard-tenant" "$ONBOARD_PAYLOAD")"
  TOKEN="$(json_get "$ONBOARD_RESP" "data.token")"
  REFRESH_TOKEN="$(json_get "$ONBOARD_RESP" "data.refreshToken")"

  if [[ -z "$TOKEN" ]]; then
    echo "Onboard response did not include token; attempting login..." >&2
    LOGIN_PAYLOAD="$(cat <<JSON
{
  "email": "$ADMIN_EMAIL",
  "password": "$ADMIN_PASSWORD",
  "schoolCode": "$SCHOOL_CODE",
  "interfaceLocale": "en"
}
JSON
)"
    LOGIN_RESP="$(http_json "POST" "$API_BASE_URL/auth/login" "$LOGIN_PAYLOAD")"
    TOKEN="$(json_get "$LOGIN_RESP" "data.token")"
    REFRESH_TOKEN="$(json_get "$LOGIN_RESP" "data.refreshToken")"
  fi
fi

if [[ -z "$TOKEN" ]]; then
  echo "Could not obtain auth token after onboarding/login." >&2
  exit 1
fi

echo "==> School onboarded and authenticated."
echo
echo "==> Importing CSVs from: $IMPORT_DIR"

FILES=(
  "01_classes_sections.csv"
  "02_teachers.csv"
  "03_staff.csv"
  "03_students.csv"
  "04_timetable.csv"
  "05_fee_structures.csv"
)

for f in "${FILES[@]}"; do
  path="$IMPORT_DIR/$f"
  if [[ ! -f "$path" ]]; then
    echo "Skipping missing file: $path"
    continue
  fi
  job_type="$(map_job_type "$f")"
  if [[ -z "$job_type" ]]; then
    echo "Skipping unmapped file: $f"
    continue
  fi

  echo
  echo "==> Submitting $f as jobType=$job_type"
  SUBMIT_RESP="$(submit_import "$TOKEN" "$job_type" "$path")"
  JOB_ID="$(json_get "$SUBMIT_RESP" "data.jobId")"
  if [[ -z "$JOB_ID" ]]; then
    echo "No jobId returned for $f" >&2
    echo "$SUBMIT_RESP" >&2
    exit 1
  fi
  wait_for_job "$TOKEN" "$JOB_ID"
  echo "    ✅ $f imported successfully"
done

echo
echo "==============================================="
echo "Onboarding + import completed successfully."
echo "School Code : $SCHOOL_CODE"
echo "Admin Email : $ADMIN_EMAIL"
echo "Admin Pass  : $ADMIN_PASSWORD"
echo "==============================================="

# Optional logout (ignore failures)
if [[ -n "$REFRESH_TOKEN" ]]; then
  LOGOUT_PAYLOAD="{\"refreshToken\":\"$REFRESH_TOKEN\"}"
  http_json "POST" "$API_BASE_URL/auth/logout" "$LOGOUT_PAYLOAD" "$TOKEN" >/dev/null || true
fi
