package com.school.erp.common.exception;

/**
 * Domain rule failure (HTTP 400). Optional {@link ApiErrorCode} lets clients map messages to i18n keys.
 */
public class BusinessException extends RuntimeException {

    private final ApiErrorCode apiErrorCode;

    public BusinessException(String message) {
        this(message, null);
    }

    public BusinessException(String message, ApiErrorCode apiErrorCode) {
        super(message);
        this.apiErrorCode = apiErrorCode;
    }

    /** When non-null, returned in {@code ApiResponse.errorCode} for UI translation. */
    public ApiErrorCode getApiErrorCode() {
        return apiErrorCode;
    }
}
