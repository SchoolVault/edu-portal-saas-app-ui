package com.school.erp.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;
    private List<String> errors;
    /** Stable machine-readable code for clients (i18n, support); null on success responses. */
    private String errorCode;
    /** Same id as {@code X-Request-Id} / MDC {@code traceId} for support correlation. */
    private String traceId;

    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder().success(true).message("Success").data(data).timestamp(LocalDateTime.now()).build();
    }

    public static <T> ApiResponse<T> ok(T data, String message) {
        return ApiResponse.<T>builder().success(true).message(message).data(data).timestamp(LocalDateTime.now()).build();
    }

    public static <T> ApiResponse<T> created(T data) {
        return ApiResponse.<T>builder().success(true).message("Created successfully").data(data).timestamp(LocalDateTime.now()).build();
    }

    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder().success(false).message(message).timestamp(LocalDateTime.now()).build();
    }

    public static <T> ApiResponse<T> error(String message, List<String> errors) {
        return ApiResponse.<T>builder().success(false).message(message).errors(errors).timestamp(LocalDateTime.now()).build();
    }

    public static <T> ApiResponse<T> error(String message, String errorCode, String traceId) {
        return ApiResponse.<T>builder().success(false).message(message).errorCode(errorCode).traceId(traceId).timestamp(LocalDateTime.now()).build();
    }

    public static <T> ApiResponse<T> error(String message, String errorCode, String traceId, List<String> errors) {
        return ApiResponse.<T>builder().success(false).message(message).errorCode(errorCode).traceId(traceId).errors(errors).timestamp(LocalDateTime.now()).build();
    }

    /**
     * Error envelope with structured {@code data} (e.g. conflict metadata). HTTP status is chosen by the controller advice.
     */
    public static <T> ApiResponse<T> errorWithPayload(String message, String errorCode, String traceId, T payload) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .errorCode(errorCode)
                .traceId(traceId)
                .data(payload)
                .timestamp(LocalDateTime.now())
                .build();
    }


    public static class ApiResponseBuilder<T> {
        private boolean success;
        private String message;
        private T data;
        private LocalDateTime timestamp;
        private List<String> errors;
        private String errorCode;
        private String traceId;

        ApiResponseBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public ApiResponse.ApiResponseBuilder<T> success(final boolean success) {
            this.success = success;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public ApiResponse.ApiResponseBuilder<T> message(final String message) {
            this.message = message;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public ApiResponse.ApiResponseBuilder<T> data(final T data) {
            this.data = data;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public ApiResponse.ApiResponseBuilder<T> timestamp(final LocalDateTime timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public ApiResponse.ApiResponseBuilder<T> errors(final List<String> errors) {
            this.errors = errors;
            return this;
        }

        public ApiResponse.ApiResponseBuilder<T> errorCode(final String errorCode) {
            this.errorCode = errorCode;
            return this;
        }

        public ApiResponse.ApiResponseBuilder<T> traceId(final String traceId) {
            this.traceId = traceId;
            return this;
        }

        public ApiResponse<T> build() {
            return new ApiResponse<T>(this.success, this.message, this.data, this.timestamp, this.errors, this.errorCode, this.traceId);
        }

        @Override
        public String toString() {
            return "ApiResponse.ApiResponseBuilder(success=" + this.success + ", message=" + this.message + ", data=" + this.data + ", timestamp=" + this.timestamp + ", errors=" + this.errors + ", errorCode=" + this.errorCode + ", traceId=" + this.traceId + ")";
        }
    }

    public static <T> ApiResponse.ApiResponseBuilder<T> builder() {
        return new ApiResponse.ApiResponseBuilder<T>();
    }

    public boolean isSuccess() {
        return this.success;
    }

    public String getMessage() {
        return this.message;
    }

    public T getData() {
        return this.data;
    }

    public LocalDateTime getTimestamp() {
        return this.timestamp;
    }

    public List<String> getErrors() {
        return this.errors;
    }

    public String getErrorCode() {
        return this.errorCode;
    }

    public String getTraceId() {
        return this.traceId;
    }

    public void setSuccess(final boolean success) {
        this.success = success;
    }

    public void setMessage(final String message) {
        this.message = message;
    }

    public void setData(final T data) {
        this.data = data;
    }

    public void setTimestamp(final LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public void setErrors(final List<String> errors) {
        this.errors = errors;
    }

    public void setErrorCode(final String errorCode) {
        this.errorCode = errorCode;
    }

    public void setTraceId(final String traceId) {
        this.traceId = traceId;
    }

    @Override
    public boolean equals(final Object o) {
        if (o == this) return true;
        if (!(o instanceof ApiResponse)) return false;
        final ApiResponse<?> other = (ApiResponse<?>) o;
        if (!other.canEqual((Object) this)) return false;
        if (this.isSuccess() != other.isSuccess()) return false;
        final Object this$message = this.getMessage();
        final Object other$message = other.getMessage();
        if (this$message == null ? other$message != null : !this$message.equals(other$message)) return false;
        final Object this$data = this.getData();
        final Object other$data = other.getData();
        if (this$data == null ? other$data != null : !this$data.equals(other$data)) return false;
        final Object this$timestamp = this.getTimestamp();
        final Object other$timestamp = other.getTimestamp();
        if (this$timestamp == null ? other$timestamp != null : !this$timestamp.equals(other$timestamp)) return false;
        final Object this$errors = this.getErrors();
        final Object other$errors = other.getErrors();
        if (this$errors == null ? other$errors != null : !this$errors.equals(other$errors)) return false;
        final Object this$errorCode = this.getErrorCode();
        final Object other$errorCode = other.getErrorCode();
        if (this$errorCode == null ? other$errorCode != null : !this$errorCode.equals(other$errorCode)) return false;
        final Object this$traceId = this.getTraceId();
        final Object other$traceId = other.getTraceId();
        if (this$traceId == null ? other$traceId != null : !this$traceId.equals(other$traceId)) return false;
        return true;
    }

    protected boolean canEqual(final Object other) {
        return other instanceof ApiResponse;
    }

    @Override
    public int hashCode() {
        final int PRIME = 59;
        int result = 1;
        result = result * PRIME + (this.isSuccess() ? 79 : 97);
        final Object $message = this.getMessage();
        result = result * PRIME + ($message == null ? 43 : $message.hashCode());
        final Object $data = this.getData();
        result = result * PRIME + ($data == null ? 43 : $data.hashCode());
        final Object $timestamp = this.getTimestamp();
        result = result * PRIME + ($timestamp == null ? 43 : $timestamp.hashCode());
        final Object $errors = this.getErrors();
        result = result * PRIME + ($errors == null ? 43 : $errors.hashCode());
        final Object $errorCode = this.getErrorCode();
        result = result * PRIME + ($errorCode == null ? 43 : $errorCode.hashCode());
        final Object $traceId = this.getTraceId();
        result = result * PRIME + ($traceId == null ? 43 : $traceId.hashCode());
        return result;
    }

    @Override
    public String toString() {
        return "ApiResponse(success=" + this.isSuccess() + ", message=" + this.getMessage() + ", data=" + this.getData() + ", timestamp=" + this.getTimestamp() + ", errors=" + this.getErrors() + ", errorCode=" + this.getErrorCode() + ", traceId=" + this.getTraceId() + ")";
    }

    public ApiResponse() {
    }

    public ApiResponse(final boolean success, final String message, final T data, final LocalDateTime timestamp, final List<String> errors,
                       final String errorCode, final String traceId) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.timestamp = timestamp;
        this.errors = errors;
        this.errorCode = errorCode;
        this.traceId = traceId;
    }
}
