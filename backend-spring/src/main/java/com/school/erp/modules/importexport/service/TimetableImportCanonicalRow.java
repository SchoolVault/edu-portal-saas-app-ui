package com.school.erp.modules.importexport.service;

import java.util.Locale;
import java.util.Map;

/**
 * Canonical/legacy alias bridge for timetable imports.
 */
public final class TimetableImportCanonicalRow {

    private TimetableImportCanonicalRow() {
    }

    public static void normalize(Map<String, String> row) {
        if (row == null || row.isEmpty()) {
            return;
        }
        mergeInto(row, "academicyearid", "academic_year_id", "academicyearid");
        mergeInto(row, "importmode", "import_mode", "importmode");
        mergeInto(row, "dayofweek", "day_of_week", "dayofweek");
        mergeInto(row, "period", "period_no", "period");
        mergeInto(row, "starttime", "start_time", "starttime");
        mergeInto(row, "endtime", "end_time", "endtime");
        mergeInto(row, "room", "room_code", "room");
        mergeInto(row, "subjectname", "subject_code", "subject_name", "subjectname");
        mergeInto(row, "classid", "class_id", "classid");
        mergeInto(row, "sectionid", "section_id", "sectionid");
        mergeInto(row, "classname", "class_ref", "class_name", "classname");
        mergeInto(row, "sectionname", "section_ref", "section_name", "sectionname");
        String classId = pickFirstNonBlank(row, "classid");
        String className = pickFirstNonBlank(row, "classname");
        if (classId == null && looksNumeric(className)) {
            row.put("classid", className);
        }
        String sectionId = pickFirstNonBlank(row, "sectionid");
        String sectionName = pickFirstNonBlank(row, "sectionname");
        if (sectionId == null && looksNumeric(sectionName)) {
            row.put("sectionid", sectionName);
        }

        String refType = pickFirstNonBlank(row, "teacher_ref_type");
        String ref = pickFirstNonBlank(row, "teacher_ref");
        if (ref != null) {
            String normalizedType = refType != null ? refType.trim().toUpperCase(Locale.ROOT) : inferTeacherRefType(ref);
            switch (normalizedType) {
                case "ID" -> row.put("teacherid", ref);
                case "PHONE", "MOBILE" -> row.put("teacherphone", ref);
                case "EMAIL" -> row.put("teacheremail", ref);
                case "EMPLOYEE_CODE", "EMPLOYEE", "EMP_CODE", "CODE" -> row.put("teacheremployeecode", ref);
                default -> {
                    // Fall back by pattern to keep onboarding resilient.
                    if (ref.contains("@")) {
                        row.put("teacheremail", ref);
                    } else if (looksNumeric(ref)) {
                        row.put("teacherid", ref);
                    } else {
                        row.put("teacherphone", ref);
                    }
                }
            }
        }
    }

    private static String inferTeacherRefType(String ref) {
        if (ref == null) {
            return "";
        }
        String r = ref.trim();
        // Timetable refs default to immutable employee code for resilient re-imports.
        if (r.matches("(?i)^[A-Z][A-Z0-9_-]{1,63}$")) {
            return "EMPLOYEE_CODE";
        }
        if (r.contains("@")) {
            return "EMAIL";
        }
        if (looksNumeric(r)) {
            return "PHONE";
        }
        return "EMPLOYEE_CODE";
    }

    private static boolean looksNumeric(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }
        for (char c : value.trim().toCharArray()) {
            if (!Character.isDigit(c)) {
                return false;
            }
        }
        return true;
    }

    private static void mergeInto(Map<String, String> row, String targetKey, String... keysInPriorityOrder) {
        String merged = pickFirstNonBlank(row, keysInPriorityOrder);
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
