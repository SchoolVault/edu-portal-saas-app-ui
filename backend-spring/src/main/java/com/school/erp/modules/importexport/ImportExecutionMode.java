package com.school.erp.modules.importexport;

import com.school.erp.common.exception.BusinessException;

/**
 * How an import job commits: per-row isolated transactions vs one atomic transaction (all-or-nothing).
 */
public enum ImportExecutionMode {

    /** Each line in its own transaction; partial success allowed. */
    BEST_EFFORT,

    /**
     * Entire job in one database transaction: any line failure rolls back all prior rows for this job.
     * Suitable for smaller files; large files may hit lock duration / timeout limits.
     */
    ALL_OR_NOTHING;

    public static ImportExecutionMode fromParam(String raw) {
        if (raw == null || raw.isBlank()) {
            return BEST_EFFORT;
        }
        try {
            return valueOf(raw.trim().toUpperCase(java.util.Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("Invalid executionMode: " + raw + ". Use BEST_EFFORT or ALL_OR_NOTHING.");
        }
    }
}
