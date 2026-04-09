package com.school.erp.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthManagementDTOs {

    public static class OnboardTenantRequest {
        @NotBlank
        private String schoolName;
        @NotBlank
        @Size(min = 3, max = 20)
        private String schoolCode;
        @NotBlank
        private String adminName;
        @NotBlank
        @Email
        private String adminEmail;
        @NotBlank
        @Size(min = 8, max = 128)
        private String adminPassword;
        private String phone;
        private String address;

        public String getSchoolName() {
            return schoolName;
        }

        public void setSchoolName(String schoolName) {
            this.schoolName = schoolName;
        }

        public String getSchoolCode() {
            return schoolCode;
        }

        public void setSchoolCode(String schoolCode) {
            this.schoolCode = schoolCode;
        }

        public String getAdminName() {
            return adminName;
        }

        public void setAdminName(String adminName) {
            this.adminName = adminName;
        }

        public String getAdminEmail() {
            return adminEmail;
        }

        public void setAdminEmail(String adminEmail) {
            this.adminEmail = adminEmail;
        }

        public String getAdminPassword() {
            return adminPassword;
        }

        public void setAdminPassword(String adminPassword) {
            this.adminPassword = adminPassword;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getAddress() {
            return address;
        }

        public void setAddress(String address) {
            this.address = address;
        }
    }

    public static class LogoutRequest {
        @NotBlank
        private String refreshToken;

        public String getRefreshToken() {
            return refreshToken;
        }

        public void setRefreshToken(String refreshToken) {
            this.refreshToken = refreshToken;
        }
    }
}
