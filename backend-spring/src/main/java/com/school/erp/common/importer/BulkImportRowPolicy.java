package com.school.erp.common.importer;

import java.util.Locale;

/**
 * How a bulk-import row behaves when a natural key (admission number / email) already exists.
 */
public enum BulkImportRowPolicy {
    CREATE_ONLY,
    UPSERT,
    SKIP_IF_EXISTS;

    public static BulkImportRowPolicy fromCsv(String raw) {
        if (raw == null || raw.isBlank()) {
            return CREATE_ONLY;
        }
        return switch (raw.trim().toUpperCase(Locale.ROOT)) {
            case "UPSERT", "U", "UPDATE" -> UPSERT;
            case "SKIP", "SKIP_IF_EXISTS", "IGNORE" -> SKIP_IF_EXISTS;
            default -> CREATE_ONLY;
        };
    }
}
