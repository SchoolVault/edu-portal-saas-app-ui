package com.school.erp.modules.importexport.service;

import com.school.erp.common.importer.ImportLineOutcome;

/**
 * Non-destructive operator hints (manual follow-up; product does not auto-delete business rows).
 */
public final class ImportRollbackGuidanceFactory {

    private ImportRollbackGuidanceFactory() {
    }

    public static String build(String entityType, ImportLineOutcome outcome, String naturalKey) {
        if (outcome == ImportLineOutcome.SKIPPED) {
            return "No change was made for this row. Your existing " + entityType + " record was kept.";
        }
        if (outcome == ImportLineOutcome.UPDATED) {
            return "An existing " + entityType + " record was updated. If this update was not expected, open the " + entityType
                    + " screen and edit the record, then re-import with corrected data if needed.";
        }
        return "A new " + entityType + " record was created. If this should not exist, archive or delete it from the " + entityType
                + " screen and then re-import with corrected data.";
    }
}
