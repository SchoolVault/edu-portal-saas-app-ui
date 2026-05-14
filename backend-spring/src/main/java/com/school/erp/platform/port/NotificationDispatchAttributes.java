package com.school.erp.platform.port;

import com.school.erp.tenant.AcademicYearContext;

/**
 * Cross-cutting metadata for notification outbox enqueue. Keeps the dispatch port signature stable as
 * new dimensions are added (campaign linkage, trace ids, locale overrides, etc.): extend this type
 * rather than growing {@link NotificationDispatchPort} parameter lists.
 *
 * <p>Academic year: when non-null, the value is persisted on {@code notification_outbox} and used at
 * delivery time for academic-year-scoped side effects (e.g. in-app {@code Notification} rows). When
 * null, delivery may resolve the tenant's current academic year as a backward-compatible fallback.
 */
public record NotificationDispatchAttributes(Long academicYearId, String smsTemplateId, String smsTemplateVariablesJson) {

    public static final NotificationDispatchAttributes EMPTY = new NotificationDispatchAttributes(null, null, null);

    public static NotificationDispatchAttributes empty() {
        return EMPTY;
    }

    /** @param academicYearId nullable — treated as {@link #empty()} when null */
    public static NotificationDispatchAttributes academicYearOrEmpty(Long academicYearId) {
        return academicYearId == null ? EMPTY : new NotificationDispatchAttributes(academicYearId, null, null);
    }

    /**
     * Uses the academic year already bound to the worker / HTTP thread (see {@link AcademicYearContext}),
     * if any.
     */
    public static NotificationDispatchAttributes inheritFromThread() {
        return academicYearOrEmpty(AcademicYearContext.getAcademicYearId());
    }

    /**
     * Prefer an explicit year from domain data (e.g. announcement row); if absent, use thread context
     * (HTTP filter or job that set {@link AcademicYearContext}).
     */
    public static NotificationDispatchAttributes preferExplicitOrThread(Long explicitAcademicYearId) {
        Long thread = AcademicYearContext.getAcademicYearId();
        Long chosen = explicitAcademicYearId != null ? explicitAcademicYearId : thread;
        return academicYearOrEmpty(chosen);
    }

    public static NotificationDispatchAttributes smsTemplate(String smsTemplateId, String smsTemplateVariablesJson) {
        if (smsTemplateId == null || smsTemplateId.isBlank()) {
            return EMPTY;
        }
        return new NotificationDispatchAttributes(null, smsTemplateId.trim(), smsTemplateVariablesJson);
    }

    public NotificationDispatchAttributes withAcademicYear(Long yearId) {
        return new NotificationDispatchAttributes(yearId, smsTemplateId, smsTemplateVariablesJson);
    }
}
