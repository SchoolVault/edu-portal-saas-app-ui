package com.school.erp.modules.reports.dto;

/**
 * Time window for the admin dashboard attendance doughnut (aligned with UI labels).
 */
public enum AdminAttendanceOverviewScope {
    TODAY,
    WEEK_TO_DATE,
    MONTH_TO_DATE;

    public static AdminAttendanceOverviewScope fromQueryParam(String raw) {
        if (raw == null || raw.isBlank()) {
            return MONTH_TO_DATE;
        }
        String u = raw.trim().toUpperCase().replace('-', '_');
        return switch (u) {
            case "TODAY" -> TODAY;
            case "WEEK_TO_DATE", "WEEK" -> WEEK_TO_DATE;
            case "MONTH_TO_DATE", "MONTH" -> MONTH_TO_DATE;
            default -> MONTH_TO_DATE;
        };
    }
}
