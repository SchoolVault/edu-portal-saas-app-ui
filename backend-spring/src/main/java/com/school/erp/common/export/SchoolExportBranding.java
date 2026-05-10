package com.school.erp.common.export;

/**
 * Minimal school context for document headers (CSV preamble / PDF title blocks).
 */
public record SchoolExportBranding(String schoolName, String schoolCode) {

    public SchoolExportBranding {
        schoolName = schoolName != null ? schoolName.trim() : "";
        schoolCode = schoolCode != null ? schoolCode.trim() : "";
    }

    public static SchoolExportBranding empty() {
        return new SchoolExportBranding("", "");
    }

    public String displaySchoolLine() {
        if (schoolName.isEmpty() && schoolCode.isEmpty()) {
            return "";
        }
        if (schoolCode.isEmpty()) {
            return "School: " + schoolName;
        }
        if (schoolName.isEmpty()) {
            return "School code: " + schoolCode;
        }
        return "School: " + schoolName + " · Code: " + schoolCode;
    }
}
