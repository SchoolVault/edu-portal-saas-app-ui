#!/usr/bin/env bash
# Tenant isolation review helper — grep-based checklist for the Spring Boot backend.
# Does not prove correctness; human review is required for each hit.
#
# Usage (from repo root):
#   ./scripts/tenant-isolation-audit.sh
#   ./scripts/tenant-isolation-audit.sh path/to/backend-spring
#
# Requires: grep. Optional: ripgrep (rg) for faster searches.

set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="${1:-$ROOT/backend-spring}"
SRC="$BACKEND/src/main/java"

if [[ ! -d "$SRC" ]]; then
  echo "ERROR: Java sources not found at $SRC" >&2
  exit 1
fi

if command -v rg &>/dev/null; then
  RG=(rg --glob '*.java')
else
  RG=()
fi

echo "=============================================="
echo "Tenant isolation audit (grep checklist)"
echo "Backend: $BACKEND"
echo "=============================================="
echo ""

echo "## 1) findById( — review lines that are NOT findByIdAndTenantId..."
echo "    Prefer findByIdAndTenantId... or assert tenant after load."
echo "---"
if ((${#RG[@]})); then
  "${RG[@]}" -n 'findById\(' "$SRC" | rg -v 'findByIdAndTenantId' || true
else
  grep -rn --include='*.java' 'findById(' "$SRC" | grep -v 'findByIdAndTenantId' || true
fi
echo ""

echo "## 2) deleteById / getReferenceById / getOne — check call sites for tenant scope"
echo "---"
if ((${#RG[@]})); then
  "${RG[@]}" -nE '\b(deleteById|getReferenceById|getOne)\s*\(' "$SRC" || true
else
  grep -rnE --include='*.java' '(deleteById|getReferenceById|getOne)\s*\(' "$SRC" || true
fi
echo ""

echo "## 3) Repository methods: find* without \"tenant\" in the line (heuristic)"
echo "---"
if ((${#RG[@]})); then
  "${RG[@]}" -n '^\s*(Optional<|List<|Page<|Stream<|long |int |boolean ).*find[A-Za-z0-9]*\(' "$SRC" \
    | rg -vi 'tenant' || true
else
  grep -rn --include='*Repository.java' 'find' "$SRC" | grep -iv 'tenant' | head -200 || true
fi
echo ""

echo "## 4) Services under modules/ with no TenantContext reference (spot-check)"
echo "    Many services use repositories that already scope by tenant; verify per module."
echo "---"
while IFS= read -r -d '' f; do
  if ! grep -q 'TenantContext' "$f" 2>/dev/null; then
    echo "NO TenantContext string: ${f#$SRC/}"
  fi
done < <(find "$SRC/com/school/erp/modules" -name '*Service.java' -print0 2>/dev/null)
echo ""

echo "## 5) Controllers: @PathVariable id — ensure service layer scopes by tenant"
echo "---"
if ((${#RG[@]})); then
  "${RG[@]}" -n '@PathVariable.*\bid\b' "$SRC" || true
else
  grep -rn --include='*Controller.java' '@PathVariable' "$SRC" | grep -E 'id|Id' || true
fi
echo ""

echo "=============================================="
echo "Done. Next steps:"
echo "  - Triage section 1 first (highest leak risk)."
echo "  - Section 4: false positives if tenant is enforced only in repositories."
echo "  - Re-run: ./scripts/tenant-isolation-audit.sh"
echo "=============================================="
