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
    INTERNAL_ERROR
}
