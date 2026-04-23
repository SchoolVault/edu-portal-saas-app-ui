package com.school.erp.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthIdentityDTOs {

    public static class SetPasswordRequest {
        @NotBlank
        @Size(min = 8, max = 128)
        private String newPassword;

        public String getNewPassword() {
            return newPassword;
        }

        public void setNewPassword(String newPassword) {
            this.newPassword = newPassword;
        }
    }

    public static class ChangeEmailRequest {
        @NotBlank
        @Email
        @Size(max = 150)
        private String email;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }

    public static class ChangePhoneRequest {
        @NotBlank
        @Size(min = 8, max = 32)
        private String phone;

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }
    }

    public static class IdentityUpdateResponse {
        private AuthDTOs.UserProfile user;
        private String message;
        private String devVerificationToken;

        public AuthDTOs.UserProfile getUser() {
            return user;
        }

        public void setUser(AuthDTOs.UserProfile user) {
            this.user = user;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public String getDevVerificationToken() {
            return devVerificationToken;
        }

        public void setDevVerificationToken(String devVerificationToken) {
            this.devVerificationToken = devVerificationToken;
        }
    }
}
