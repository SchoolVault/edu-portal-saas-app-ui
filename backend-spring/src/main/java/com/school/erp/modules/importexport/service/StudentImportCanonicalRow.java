package com.school.erp.modules.importexport.service;

import java.util.Locale;
import java.util.Map;

/**
 * Merges ERP-style canonical student CSV keys ({@code snake_case}) with legacy import keys so one row shape
 * resolves to a single execution path. Canonical keys win when both are present.
 *
 * <p>{@code class_id} / {@code section_id} may be set to {@code AUTO} — same as blank: IDs are ignored and placement
 * uses {@code classname}/{@code sectionname} (and academic year) via {@link BulkImportAcademicResolver}.
 */
public final class StudentImportCanonicalRow {

    private StudentImportCanonicalRow() {
    }

    /**
     * Populates legacy executor keys ({@code firstname}, {@code parentphone}, {@code academicyearid}, …) from
     * canonical aliases. Safe to call repeatedly.
     */
    public static void normalize(Map<String, String> row) {
        if (row == null || row.isEmpty()) {
            return;
        }
        mergeInto(row, "academicyearid", "academic_year_id", "academicyearid");
        mergeInto(row, "importmode", "import_mode", "importmode");
        mergeInto(row, "firstname", "first_name", "firstname");
        mergeInto(row, "lastname", "last_name", "lastname");
        mergeInto(row, "email", "student_email", "email");
        // Omit separate student mobile column — optional legacy key "phone" still maps to learner contact if schools keep it.
        mergeInto(row, "dateofbirth", "date_of_birth", "dateofbirth");
        mergeInto(row, "gender", "student_gender", "gender");
        mergeInto(row, "classid", "class_id", "classid");
        mergeInto(row, "sectionid", "section_id", "sectionid");
        mergeInto(row, "classname", "class_name", "classname");
        mergeInto(row, "sectionname", "section_name", "sectionname");
        mergeInto(row, "rollnumber", "roll_number", "rollnumber");
        mergeInto(row, "admissionnumber", "admission_number", "admissionnumber");
        mergeInto(row, "admissiondate", "admission_date", "admissiondate");
        mergeInto(row, "parentname", "primary_guardian_name", "guardian_name", "parentname");
        mergeInto(row, "parentemail", "primary_guardian_email", "guardian_email", "parentemail");
        mergeInto(row, "parentphone", "primary_guardian_phone", "guardian_phone", "parentphone");
        mergeInto(row, "parentcode", "parent_code", "primary_guardian_code", "parentcode");
        mergeInto(row, "parentid", "parent_id", "parentid");
        mergeInto(row, "createparentportal", "create_parent_portal", "createparentportal");
        mergeInto(row, "notifycredentials", "notify_credentials", "notifycredentials");
        mergeInto(row, "address", "address");
        mergeInto(row, "bloodgroup", "blood_group", "bloodgroup");
    }

    private static void mergeInto(Map<String, String> row, String legacyKey, String... keysInPriorityOrder) {
        String merged = pickFirstNonBlank(row, keysInPriorityOrder);
        if (merged != null) {
            row.put(legacyKey, merged);
        }
    }

    private static String pickFirstNonBlank(Map<String, String> row, String... keys) {
        for (String key : keys) {
            if (key == null) {
                continue;
            }
            if (!row.containsKey(key)) {
                continue;
            }
            String v = row.get(key);
            if (v != null && !v.trim().isEmpty()) {
                return v.trim();
            }
        }
        return null;
    }

    /** Raw relation token if present ({@link com.school.erp.modules.importexport.service.ImportBulkRowValidator}). */
    public static String rawPrimaryGuardianRelation(Map<String, String> row) {
        String v = pickFirstNonBlank(row, "primary_guardian_relation", "guardian_relation");
        if (v == null) {
            return null;
        }
        String t = v.trim().toUpperCase(Locale.ROOT);
        return t.isEmpty() ? null : t;
    }
}
