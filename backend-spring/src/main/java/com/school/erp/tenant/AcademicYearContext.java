package com.school.erp.tenant;

/**
 * Request and worker thread context for the active academic year scope.
 */
public final class AcademicYearContext {

    private static final ThreadLocal<Long> ACADEMIC_YEAR_ID = new ThreadLocal<>();

    private AcademicYearContext() {
    }

    public static void setAcademicYearId(Long academicYearId) {
        ACADEMIC_YEAR_ID.set(academicYearId);
    }

    public static Long getAcademicYearId() {
        return ACADEMIC_YEAR_ID.get();
    }

    public static void clear() {
        ACADEMIC_YEAR_ID.remove();
    }
}
