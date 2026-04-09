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


    public static class ApiResponseBuilder<T> {
        private boolean success;
        private String message;
        private T data;
        private LocalDateTime timestamp;
        private List<String> errors;

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

        public ApiResponse<T> build() {
            return new ApiResponse<T>(this.success, this.message, this.data, this.timestamp, this.errors);
        }

        @Override
        public String toString() {
            return "ApiResponse.ApiResponseBuilder(success=" + this.success + ", message=" + this.message + ", data=" + this.data + ", timestamp=" + this.timestamp + ", errors=" + this.errors + ")";
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
        return result;
    }

    @Override
    public String toString() {
        return "ApiResponse(success=" + this.isSuccess() + ", message=" + this.getMessage() + ", data=" + this.getData() + ", timestamp=" + this.getTimestamp() + ", errors=" + this.getErrors() + ")";
    }

    public ApiResponse() {
    }

    public ApiResponse(final boolean success, final String message, final T data, final LocalDateTime timestamp, final List<String> errors) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.timestamp = timestamp;
        this.errors = errors;
    }
}
