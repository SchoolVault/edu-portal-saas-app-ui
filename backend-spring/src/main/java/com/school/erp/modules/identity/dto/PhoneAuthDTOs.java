package com.school.erp.modules.identity.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTOs for phone-based authentication flows.
 * Supports OTP generation, verification, and phone login.
 */
public class PhoneAuthDTOs {

    /**
     * Request to send OTP to a phone number.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SendOtpRequest {
        @NotBlank(message = "Phone number is required")
        @Size(min = 8, max = 32, message = "Phone number is invalid")
        private String phone;

        @NotBlank(message = "School code is required")
        @Size(min = 3, max = 50, message = "School code must be between 3 and 50 characters")
        private String schoolCode;

        @NotBlank(message = "Purpose is required")
        private String purpose; // LOGIN, SIGNUP, PASSWORD_RESET

        private String channel; // SMS, WHATSAPP (default: SMS)

        private String requestId; // Optional correlation ID for tracing
    }

    /**
     * Response after sending OTP.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SendOtpResponse {
        private boolean success;
        private String message;
        private String requestId;
        private Long expiresInSeconds;

        @JsonProperty("canRetryAfterSeconds")
        private Long canRetryAfterSeconds;

        // For development/testing only - should be removed in production
        @JsonProperty("devOtpCode")
        private String devOtpCode;
    }

    /**
     * Request to verify OTP.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VerifyOtpRequest {
        @NotBlank(message = "Phone number is required")
        @Size(min = 8, max = 32, message = "Phone number is invalid")
        private String phone;

        @NotBlank(message = "School code is required")
        private String schoolCode;

        @NotBlank(message = "OTP code is required")
        @Size(min = 4, max = 6, message = "OTP must be 4-6 digits")
        private String otpCode;

        @NotBlank(message = "Purpose is required")
        private String purpose; // LOGIN, SIGNUP, PASSWORD_RESET

        private String requestId; // Optional correlation ID
    }

    /**
     * Response after verifying OTP.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VerifyOtpResponse {
        private boolean verified;
        private String message;
        private Integer remainingAttempts;
        private String verificationToken; // Temporary token to exchange for JWT
    }

    /**
     * Phone login request (after OTP verification).
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PhoneLoginRequest {
        @NotBlank(message = "Phone number is required")
        @Size(min = 8, max = 32, message = "Phone number is invalid")
        private String phone;

        @NotBlank(message = "School code is required")
        private String schoolCode;

        @NotBlank(message = "Verification token is required")
        private String verificationToken;

        private String interfaceLocale; // en, hi
    }

    /**
     * Reset password after a PASSWORD_RESET OTP has been verified.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PasswordResetRequest {
        @NotBlank(message = "Phone number is required")
        @Size(min = 8, max = 32, message = "Phone number is invalid")
        private String phone;

        @NotBlank(message = "School code is required")
        private String schoolCode;

        @NotBlank(message = "Verification token is required")
        private String verificationToken;

        @NotBlank(message = "New password is required")
        @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
        private String newPassword;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PasswordResetResponse {
        private boolean success;
        private String message;
    }

    /**
     * Phone login response (same structure as email login).
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PhoneLoginResponse {
        private String token;
        private String refreshToken;
        private UserSummary user;
    }

    /**
     * User summary for login response.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserSummary {
        private Long id;
        private String email;
        private String name;
        private String phone;
        private String role;
        private String tenantId;
        private String avatar;
        private String interfaceLocale;
    }

    /**
     * Request to resend OTP.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ResendOtpRequest {
        @NotBlank(message = "Phone number is required")
        @Size(min = 8, max = 32, message = "Phone number is invalid")
        private String phone;

        @NotBlank(message = "School code is required")
        private String schoolCode;

        @NotBlank(message = "Purpose is required")
        private String purpose;

        private String channel;
    }
}
