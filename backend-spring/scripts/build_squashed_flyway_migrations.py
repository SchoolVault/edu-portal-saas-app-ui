#!/usr/bin/env python3
"""
Builds a fresh Flyway chain (V1–V10) from the legacy V1–V38 scripts.

Rules:
- Applies migrations in numeric version order (not lexicographic).
- Omits V37/V38 (reminder policy tables created then removed — net zero).
- Merges V35+V36 into V33: payment_webhook_events uses VARCHAR(64) payload_sha256 and INT http_status.
- Does not copy standalone V35/V36 files into the squashed output.

Output: ./generated/squashed_migrations/V1__core_init_seed.sql … V10__….sql (not on classpath — safe to review before copy)

Run from backend-spring/scripts/:  python3 build_squashed_flyway_migrations.py
Then: cp generated/squashed_migrations/V*.sql ../src/main/resources/db/migration/
"""
from __future__ import annotations

import os
import re
import shutil
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
_DEFAULT_MIG = SCRIPT_DIR.parent / "src/main/resources/db/migration"
# After squash, repo only has V1–V10; to regenerate, export legacy V1–V38 from git and set:
#   LEGACY_MIGRATION_DIR=/path/to/folder/with/V33__payment_webhook_events.sql ...
MIGRATION_DIR = Path(os.environ.get("LEGACY_MIGRATION_DIR", str(_DEFAULT_MIG))).resolve()
OUT_DIR = SCRIPT_DIR / "generated" / "squashed_migrations"
NUM_BUCKETS = 10


def version_key(path: Path) -> int:
    m = re.match(r"V(\d+)__", path.name)
    if not m:
        return 99999
    return int(m.group(1))


def load_linearized_sql() -> list[tuple[int, str, str]]:
    """Return list of (version, filename, sql_text)."""
    paths = sorted(MIGRATION_DIR.glob("V*.sql"), key=version_key)
    rows: list[tuple[int, str, str]] = []
    # Merged into V33 content; V37/V38 = transient reminder tables (net zero).
    skip_names = {
        "V35__payment_webhook_http_status_int.sql",
        "V36__payment_webhook_payload_sha256_varchar.sql",
        "V37__reminder_policies_and_scheduled_generic.sql",
        "V38__drop_reminder_policy_tables.sql",
        # Hand-maintained after the bundled baseline; do not fold into V1–V10 rebuild
        "V11__query_performance_indexes.sql",
    }
    for p in paths:
        if p.name in skip_names:
            continue
        v = version_key(p)
        text = p.read_text(encoding="utf-8")
        if v == 33:
            text = text.replace(
                "payload_sha256 CHAR(64) NOT NULL",
                "payload_sha256 VARCHAR(64) NOT NULL",
            )
            text = text.replace("http_status SMALLINT", "http_status INT")
        rows.append((v, p.name, text))
    return rows


def split_into_buckets(rows: list[tuple[int, str, str]], n: int) -> list[list[tuple[int, str, str]]]:
    """Split rows into n non-empty buckets when possible (even remainder distribution)."""
    if not rows:
        return [[] for _ in range(n)]
    base, extra = divmod(len(rows), n)
    buckets: list[list[tuple[int, str, str]]] = []
    i = 0
    for b in range(n):
        take = base + (1 if b < extra else 0)
        buckets.append(rows[i : i + take])
        i += take
    return buckets


def main() -> int:
    if not MIGRATION_DIR.is_dir():
        print(f"Missing migration dir: {MIGRATION_DIR}", file=sys.stderr)
        return 1

    rows = load_linearized_sql()
    buckets = split_into_buckets(rows, NUM_BUCKETS)

    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)
    OUT_DIR.mkdir(parents=True)

    labels = [
        "core_init_seed",
        "auth_exams_fees_chat",
        "assignments_docs_transport",
        "leave_library_hostel_transport_fleet",
        "exams_roles_platform_jobs",
        "timetable_vehicle_password_catalog_ops",
        "demo_academic_seed_enrich",
        "outbox_import_demo_jobs",
        "salary_outbox_payment_webhook",
        "fee_attempt_indexes",
    ]

    for idx, bucket in enumerate(buckets, start=1):
        label = labels[idx - 1] if idx <= len(labels) else f"part_{idx}"
        parts: list[str] = [
            f"-- Flyway baseline (part {idx}/{NUM_BUCKETS}): {label}",
            "-- Regenerate from legacy scripts: backend-spring/scripts/build_squashed_flyway_migrations.py",
            "",
        ]
        for ver, name, sql in bucket:
            parts.append(f"-- >>> Legacy V{ver}: {name}")
            parts.append(sql.strip())
            parts.append("")
        out_path = OUT_DIR / f"V{idx}__{label}.sql"
        out_path.write_text("\n".join(parts).rstrip() + "\n", encoding="utf-8")
        print(f"Wrote {out_path.name} ({len(bucket)} legacy script(s))")

    print("\nNext steps (operator):")
    print(f"  1. Review SQL under {OUT_DIR}")
    print("  2. Backup and remove legacy scripts from src/main/resources/db/migration/")
    print("  3. cp generated/squashed_migrations/V*.sql ../src/main/resources/db/migration/")
    print("  4. Empty target DB, redeploy (Flyway runs V1–V10 only).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
