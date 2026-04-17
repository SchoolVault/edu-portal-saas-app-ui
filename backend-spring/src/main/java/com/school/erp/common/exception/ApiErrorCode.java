package com.school.erp.common.exception;

/**
 * Stable API error codes returned in {@link com.school.erp.common.dto.ApiResponse#getErrorCode()}.
 */
public enum ApiErrorCode {
    RESOURCE_NOT_FOUND,
    DUPLICATE_RESOURCE,
    UNAUTHORIZED,
    FORBIDDEN,
    BUSINESS_RULE_VIOLATION,
    RATE_LIMIT_EXCEEDED,
    VALIDATION_FAILED,
    /** Leave type {@code OTHER} submitted without a sufficient free-text reason. */
    LEAVE_OTHER_REASON_REQUIRED,
    /**
     * Timetable / cover / slot overlap — client may retry with an explicit replace token when the domain allows it.
     */
    SCHEDULING_CONFLICT,
    /** Recurring timetable: class period taken or teacher double-booked; client may pass replaceTimetableEntryId. */
    TIMETABLE_SLOT_CONFLICT,
    INTERNAL_ERROR
}
