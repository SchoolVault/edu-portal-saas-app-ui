package com.school.erp.common.exception;

/**
 * Domain scheduling conflict (HTTP 409). Carries an optional machine-readable payload for the client
 * (e.g. which attendance-cover row blocks the requested slot) so the UI can offer a controlled replace flow.
 */
public class SchedulingConflictException extends RuntimeException {

    private final ApiErrorCode apiErrorCode;
    private final Object payload;

    public SchedulingConflictException(String message, ApiErrorCode apiErrorCode, Object payload) {
        super(message);
        this.apiErrorCode = apiErrorCode != null ? apiErrorCode : ApiErrorCode.SCHEDULING_CONFLICT;
        this.payload = payload;
    }

    public ApiErrorCode getApiErrorCode() {
        return apiErrorCode;
    }

    /** Optional structured body mirrored in {@code ApiResponse.data} on error responses. */
    public Object getPayload() {
        return payload;
    }
}
