package com.school.erp.modules.importexport;

import java.util.Locale;

public enum ImportJobType {
    STUDENTS,
    TEACHERS,
    STAFF,
    CLASSES,
    TIMETABLE;

    public static ImportJobType fromParam(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("jobType is required");
        }
        return ImportJobType.valueOf(raw.trim().toUpperCase(Locale.ROOT));
    }

    public String csvEntryName() {
        return switch (this) {
            case STUDENTS -> "students.csv";
            case TEACHERS -> "teachers.csv";
            case STAFF -> "staff.csv";
            case CLASSES -> "classes.csv";
            case TIMETABLE -> "timetable.csv";
        };
    }
}
