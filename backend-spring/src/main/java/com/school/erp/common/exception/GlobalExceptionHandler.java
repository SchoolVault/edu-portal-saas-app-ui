package com.school.erp.common.exception;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.common.logging.MdcKeys;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err(ex.getMessage(), ApiErrorCode.RESOURCE_NOT_FOUND));
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ApiResponse<Void>> handleDuplicate(DuplicateResourceException ex) {
        log.warn("Duplicate resource: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(err(ex.getMessage(), ApiErrorCode.DUPLICATE_RESOURCE));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrity(DataIntegrityViolationException ex) {
        String root = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage();
        log.warn("Data integrity violation: {}", root);
        String msg = "This record conflicts with existing data (duplicate or invalid reference).";
        if (root != null) {
            if (root.contains("uk_users_tenant_phone_active")) {
                msg = "This mobile number is already registered for this school workspace.";
            } else if (root.contains("uk_guardians_tenant_user_active")) {
                msg = "A guardian profile is already linked to this portal user.";
            } else if (root.contains("uk_sgm_student_guardian_active")) {
                msg = "This guardian is already linked to this student.";
            }
        }
        return ResponseEntity.status(HttpStatus.CONFLICT).body(err(msg, ApiErrorCode.DUPLICATE_RESOURCE));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex) {
        log.warn("Auth failed: invalid credentials uri={}", currentRequestUri());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err("Invalid credentials", ApiErrorCode.UNAUTHORIZED));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
        log.warn("Access denied uri={} msg={}", currentRequestUri(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(err("Access denied", ApiErrorCode.FORBIDDEN));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnauthorized(UnauthorizedException ex) {
        log.warn("Unauthorized uri={} msg={}", currentRequestUri(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err(ex.getMessage(), ApiErrorCode.UNAUTHORIZED));
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusiness(BusinessException ex) {
        log.warn("Business error: {}", ex.getMessage());
        ApiErrorCode code = ex.getApiErrorCode() != null ? ex.getApiErrorCode() : ApiErrorCode.BUSINESS_RULE_VIOLATION;
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err(ex.getMessage(), code));
    }

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ApiResponse<Void>> handleRateLimit(RateLimitExceededException ex) {
        log.warn("Rate limit uri={} msg={}", currentRequestUri(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(err(ex.getMessage(), ApiErrorCode.RATE_LIMIT_EXCEEDED));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult().getFieldErrors().stream().map(FieldError::getDefaultMessage).collect(Collectors.toList());
        log.warn("Validation failed uri={} fields={}", currentRequestUri(), errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error("Validation failed", ApiErrorCode.VALIDATION_FAILED.name(), traceId(), errors));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(ConstraintViolationException ex) {
        List<String> errors = ex.getConstraintViolations().stream().map(v -> v.getPropertyPath() + ": " + v.getMessage()).collect(Collectors.toList());
        log.warn("Constraint violation uri={} details={}", currentRequestUri(), errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error("Validation failed", ApiErrorCode.VALIDATION_FAILED.name(), traceId(), errors));
    }

    private static String currentRequestUri() {
        try {
            var attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) {
                return "?";
            }
            HttpServletRequest req = attrs.getRequest();
            return req.getMethod() + " " + req.getRequestURI();
        } catch (Exception e) {
            return "?";
        }
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneral(Exception ex) {
        log.error("Unexpected error: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err("An unexpected error occurred", ApiErrorCode.INTERNAL_ERROR));
    }

    private static ApiResponse<Void> err(String message, ApiErrorCode code) {
        return ApiResponse.error(message, code.name(), traceId());
    }

    private static String traceId() {
        String id = MDC.get(MdcKeys.TRACE_ID);
        return id != null && !id.isBlank() ? id : null;
    }
}
