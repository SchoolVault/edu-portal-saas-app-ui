package com.school.erp.modules.auth.dto;

import com.school.erp.common.enums.Enums;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

public class AuthDTOs {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class LoginRequest {
        @NotBlank(message = "Email is required") @Email
        private String email;
        @NotBlank(message = "Password is required")
        private String password;
        @NotBlank(message = "School code is required")
        private String schoolCode;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RegisterRequest {
        @NotBlank(message = "Name is required")
        private String name;
        @NotBlank(message = "Email is required") @Email
        private String email;
        @NotBlank(message = "Password is required")
        private String password;
        private String phone;
        private Enums.Role role;
        @NotBlank(message = "School code is required")
        private String schoolCode;
        @NotBlank(message = "Tenant ID is required")
        private String tenantId;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class LoginResponse {
        private String token;
        private UserProfile user;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserProfile {
        private Long id;
        private String name;
        private String email;
        private String phone;
        private String role;
        private String tenantId;
        private String avatar;
    }
}
