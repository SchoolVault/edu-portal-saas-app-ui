package com.school.erp.modules.importexport.service;

import java.util.Map;

/**
 * Single source for Classes/Sections header normalization.
 *
 * <p>Input is the sales-facing CSV contract (snake_case with (R)/(O) markers). Output keys are the stable
 * internal keys used by validators/executor/dry-run.
 */
public final class ClassImportCanonicalRow {

    private ClassImportCanonicalRow() {
    }

    public static void normalize(Map<String, String> row) {
        if (row == null || row.isEmpty()) {
            return;
        }
        mergeInto(row, "academicyearid", "academic_year", "academic_year (O)");
        mergeInto(row, "classcode", "class_code", "class_code (O)");
        mergeInto(row, "classname", "class_name", "class_name (R)");
        mergeInto(row, "grade", "grade", "grade (R)");
        mergeInto(row, "sectioncode", "section_code", "section_code (O)");
        mergeInto(row, "sectionname", "section_name", "section_name (O)");
        mergeInto(row, "classcapacity", "class_capacity", "class_capacity (O)");
        mergeInto(row, "sectioncapacity", "section_capacity", "section_capacity (O)");
        mergeInto(row, "importmode", "import_mode", "import_mode (O)");
    }

    private static void mergeInto(Map<String, String> row, String targetKey, String... sourceKeys) {
        String merged = pickFirstNonBlank(row, sourceKeys);
        if (merged != null) {
            row.put(targetKey, merged);
        }
    }

    private static String pickFirstNonBlank(Map<String, String> row, String... keys) {
        for (String key : keys) {
            if (key == null || !row.containsKey(key)) {
                continue;
            }
            String v = row.get(key);
            if (v != null && !v.trim().isEmpty()) {
                return v.trim();
            }
        }
        return null;
    }
}
