package com.school.erp.common.exception;

/**
 * Authenticated user lacks permission for the operation. Maps to HTTP 403 (not 401) so clients
 * do not treat policy denials as expired credentials.
 */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
