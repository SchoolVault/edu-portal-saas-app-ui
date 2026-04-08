package com.school.erp.modules.auth.dto;

import com.school.erp.common.enums.Enums;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

public class AuthDTOs {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class LoginRequest {
        @NotBlank(message = "Email is required") @Email private String email;
        @NotBlank(message = "Password is required") private String password;
        @NotBlank(message = "School code is required") private String schoolCode;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RegisterRequest {
        @NotBlank private String name;
        @NotBlank @Email private String email;
        @NotBlank private String password;
        private String phone;
        private Enums.Role role;
        @NotBlank private String schoolCode;
        @NotBlank private String tenantId;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class LoginResponse {
        private String token;
        private String refreshToken;
        private UserProfile user;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserProfile {
        private Long id; private String name; private String email; private String phone;
        private String role; private String tenantId; private String avatar;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ChangePasswordRequest {
        @NotBlank private String currentPassword;
        @NotBlank private String newPassword;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UpdateProfileRequest {
        private String name; private String phone; private String avatar;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RefreshTokenRequest {
        @NotBlank private String refreshToken;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TokenResponse {
        private String token; private String refreshToken;
    }
}
