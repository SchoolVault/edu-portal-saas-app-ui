package com.school.erp.common.importer;

/**
 * What happened to one bulk-import row for ledger / rollback visibility.
 */
public enum ImportLineOutcome {
    /** New entity persisted. */
    CREATED,
    /** Existing row updated (UPSERT). */
    UPDATED,
    /** Existing row left as-is (SKIP_IF_EXISTS) — no data mutation. */
    SKIPPED
}
