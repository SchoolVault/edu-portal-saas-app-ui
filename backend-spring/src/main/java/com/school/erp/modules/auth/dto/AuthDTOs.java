package com.school.erp.modules.auth.dto;

import com.school.erp.common.enums.Enums;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class AuthDTOs {

    public static class LoginRequest {
        @Email(message = "Invalid email")
        private String email;
        private String phone;
        @NotBlank(message = "Password is required")
        private String password;
        @NotBlank(message = "School code is required")
        private String schoolCode;
        /** Optional UI language (e.g. en, hi). When valid, persisted on successful login. */
        private String interfaceLocale;

        @AssertTrue(message = "Either email or phone is required")
        public boolean isLoginIdentifierPresent() {
            boolean hasEmail = email != null && !email.isBlank();
            boolean hasPhone = phone != null && !phone.isBlank();
            return hasEmail || hasPhone;
        }

        public static class LoginRequestBuilder {
            private String email;
            private String phone;
            private String password;
            private String schoolCode;
            private String interfaceLocale;

            LoginRequestBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public AuthDTOs.LoginRequest.LoginRequestBuilder email(final String email) {
                this.email = email;
                return this;
            }

            public AuthDTOs.LoginRequest.LoginRequestBuilder phone(final String phone) {
                this.phone = phone;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AuthDTOs.LoginRequest.LoginRequestBuilder password(final String password) {
                this.password = password;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AuthDTOs.LoginRequest.LoginRequestBuilder schoolCode(final String schoolCode) {
                this.schoolCode = schoolCode;
                return this;
            }

            public AuthDTOs.LoginRequest.LoginRequestBuilder interfaceLocale(final String interfaceLocale) {
                this.interfaceLocale = interfaceLocale;
                return this;
            }

            public AuthDTOs.LoginRequest build() {
                return new AuthDTOs.LoginRequest(this.email, this.phone, this.password, this.schoolCode, this.interfaceLocale);
            }

            @Override
            public String toString() {
                return "AuthDTOs.LoginRequest.LoginRequestBuilder(email=" + this.email + ", phone=" + this.phone + ", password=" + this.password + ", schoolCode=" + this.schoolCode + ", interfaceLocale=" + this.interfaceLocale + ")";
            }
        }

        public static AuthDTOs.LoginRequest.LoginRequestBuilder builder() {
            return new AuthDTOs.LoginRequest.LoginRequestBuilder();
        }

        public String getEmail() {
            return this.email;
        }

        public String getPhone() {
            return this.phone;
        }

        public String getPassword() {
            return this.password;
        }

        public String getSchoolCode() {
            return this.schoolCode;
        }

        public String getInterfaceLocale() {
            return this.interfaceLocale;
        }

        public void setEmail(final String email) {
            this.email = email;
        }

        public void setPhone(final String phone) {
            this.phone = phone;
        }

        public void setPassword(final String password) {
            this.password = password;
        }

        public void setSchoolCode(final String schoolCode) {
            this.schoolCode = schoolCode;
        }

        public void setInterfaceLocale(final String interfaceLocale) {
            this.interfaceLocale = interfaceLocale;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof AuthDTOs.LoginRequest)) return false;
            final AuthDTOs.LoginRequest other = (AuthDTOs.LoginRequest) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$email = this.getEmail();
            final Object other$email = other.getEmail();
            if (this$email == null ? other$email != null : !this$email.equals(other$email)) return false;
            final Object this$phone = this.getPhone();
            final Object other$phone = other.getPhone();
            if (this$phone == null ? other$phone != null : !this$phone.equals(other$phone)) return false;
            final Object this$password = this.getPassword();
            final Object other$password = other.getPassword();
            if (this$password == null ? other$password != null : !this$password.equals(other$password)) return false;
            final Object this$schoolCode = this.getSchoolCode();
            final Object other$schoolCode = other.getSchoolCode();
            if (this$schoolCode == null ? other$schoolCode != null : !this$schoolCode.equals(other$schoolCode)) return false;
            final Object this$interfaceLocale = this.getInterfaceLocale();
            final Object other$interfaceLocale = other.getInterfaceLocale();
            if (this$interfaceLocale == null ? other$interfaceLocale != null : !this$interfaceLocale.equals(other$interfaceLocale)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof AuthDTOs.LoginRequest;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $email = this.getEmail();
            result = result * PRIME + ($email == null ? 43 : $email.hashCode());
            final Object $phone = this.getPhone();
            result = result * PRIME + ($phone == null ? 43 : $phone.hashCode());
            final Object $password = this.getPassword();
            result = result * PRIME + ($password == null ? 43 : $password.hashCode());
            final Object $schoolCode = this.getSchoolCode();
            result = result * PRIME + ($schoolCode == null ? 43 : $schoolCode.hashCode());
            final Object $interfaceLocale = this.getInterfaceLocale();
            result = result * PRIME + ($interfaceLocale == null ? 43 : $interfaceLocale.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "AuthDTOs.LoginRequest(email=" + this.getEmail() + ", phone=" + this.getPhone() + ", password=" + this.getPassword() + ", schoolCode=" + this.getSchoolCode() + ", interfaceLocale=" + this.getInterfaceLocale() + ")";
        }

        public LoginRequest() {
        }

        public LoginRequest(final String email, final String phone, final String password, final String schoolCode, final String interfaceLocale) {
            this.email = email;
            this.phone = phone;
            this.password = password;
            this.schoolCode = schoolCode;
            this.interfaceLocale = interfaceLocale;
        }
    }


    public static class RegisterRequest {
        @NotBlank
        private String name;
        @NotBlank
        @Email
        private String email;
        @NotBlank
        private String password;
        private String phone;
        private Enums.Role role;
        @NotBlank
        private String schoolCode;
        @NotBlank
        private String tenantId;


        public static class RegisterRequestBuilder {
            private String name;
            private String email;
            private String password;
            private String phone;
            private Enums.Role role;
            private String schoolCode;
            private String tenantId;

            RegisterRequestBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public AuthDTOs.RegisterRequest.RegisterRequestBuilder name(final String name) {
                this.name = name;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AuthDTOs.RegisterRequest.RegisterRequestBuilder email(final String email) {
                this.email = email;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AuthDTOs.RegisterRequest.RegisterRequestBuilder password(final String password) {
                this.password = password;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AuthDTOs.RegisterRequest.RegisterRequestBuilder phone(final String phone) {
                this.phone = phone;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AuthDTOs.RegisterRequest.RegisterRequestBuilder role(final Enums.Role role) {
                this.role = role;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AuthDTOs.RegisterRequest.RegisterRequestBuilder schoolCode(final String schoolCode) {
                this.schoolCode = schoolCode;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AuthDTOs.RegisterRequest.RegisterRequestBuilder tenantId(final String tenantId) {
                this.tenantId = tenantId;
                return this;
            }

            public AuthDTOs.RegisterRequest build() {
                return new AuthDTOs.RegisterRequest(this.name, this.email, this.password, this.phone, this.role, this.schoolCode, this.tenantId);
            }

            @Override
            public String toString() {
                return "AuthDTOs.RegisterRequest.RegisterRequestBuilder(name=" + this.name + ", email=" + this.email + ", password=" + this.password + ", phone=" + this.phone + ", role=" + this.role + ", schoolCode=" + this.schoolCode + ", tenantId=" + this.tenantId + ")";
            }
        }

        public static AuthDTOs.RegisterRequest.RegisterRequestBuilder builder() {
            return new AuthDTOs.RegisterRequest.RegisterRequestBuilder();
        }

        public String getName() {
            return this.name;
        }

        public String getEmail() {
            return this.email;
        }

        public String getPassword() {
            return this.password;
        }

        public String getPhone() {
            return this.phone;
        }

        public Enums.Role getRole() {
            return this.role;
        }

        public String getSchoolCode() {
            return this.schoolCode;
        }

        public String getTenantId() {
            return this.tenantId;
        }

        public void setName(final String name) {
            this.name = name;
        }

        public void setEmail(final String email) {
            this.email = email;
        }

        public void setPassword(final String password) {
            this.password = password;
        }

        public void setPhone(final String phone) {
            this.phone = phone;
        }

        public void setRole(final Enums.Role role) {
            this.role = role;
        }

        public void setSchoolCode(final String schoolCode) {
            this.schoolCode = schoolCode;
        }

        public void setTenantId(final String tenantId) {
            this.tenantId = tenantId;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof AuthDTOs.RegisterRequest)) return false;
            final AuthDTOs.RegisterRequest other = (AuthDTOs.RegisterRequest) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$name = this.getName();
            final Object other$name = other.getName();
            if (this$name == null ? other$name != null : !this$name.equals(other$name)) return false;
            final Object this$email = this.getEmail();
            final Object other$email = other.getEmail();
            if (this$email == null ? other$email != null : !this$email.equals(other$email)) return false;
            final Object this$password = this.getPassword();
            final Object other$password = other.getPassword();
            if (this$password == null ? other$password != null : !this$password.equals(other$password)) return false;
            final Object this$phone = this.getPhone();
            final Object other$phone = other.getPhone();
            if (this$phone == null ? other$phone != null : !this$phone.equals(other$phone)) return false;
            final Object this$role = this.getRole();
            final Object other$role = other.getRole();
            if (this$role == null ? other$role != null : !this$role.equals(other$role)) return false;
            final Object this$schoolCode = this.getSchoolCode();
            final Object other$schoolCode = other.getSchoolCode();
            if (this$schoolCode == null ? other$schoolCode != null : !this$schoolCode.equals(other$schoolCode)) return false;
            final Object this$tenantId = this.getTenantId();
            final Object other$tenantId = other.getTenantId();
            if (this$tenantId == null ? other$tenantId != null : !this$tenantId.equals(other$tenantId)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof AuthDTOs.RegisterRequest;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $name = this.getName();
            result = result * PRIME + ($name == null ? 43 : $name.hashCode());
            final Object $email = this.getEmail();
            result = result * PRIME + ($email == null ? 43 : $email.hashCode());
            final Object $password = this.getPassword();
            result = result * PRIME + ($password == null ? 43 : $password.hashCode());
            final Object $phone = this.getPhone();
            result = result * PRIME + ($phone == null ? 43 : $phone.hashCode());
            final Object $role = this.getRole();
            result = result * PRIME + ($role == null ? 43 : $role.hashCode());
            final Object $schoolCode = this.getSchoolCode();
            result = result * PRIME + ($schoolCode == null ? 43 : $schoolCode.hashCode());
            final Object $tenantId = this.getTenantId();
            result = result * PRIME + ($tenantId == null ? 43 : $tenantId.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "AuthDTOs.RegisterRequest(name=" + this.getName() + ", email=" + this.getEmail() + ", password=" + this.getPassword() + ", phone=" + this.getPhone() + ", role=" + this.getRole() + ", schoolCode=" + this.getSchoolCode() + ", tenantId=" + this.getTenantId() + ")";
        }

        public RegisterRequest() {
        }

        public RegisterRequest(final String name, final String email, final String password, final String phone, final Enums.Role role, final String schoolCode, final String tenantId) {
            this.name = name;
            this.email = email;
            this.password = password;
            this.phone = phone;
            this.role = role;
            this.schoolCode = schoolCode;
            this.tenantId = tenantId;
        }
    }


    public static class LoginResponse {
        private String token;
        private String refreshToken;
        private UserProfile user;


        public static class LoginResponseBuilder {
            private String token;
            private String refreshToken;
            private UserProfile user;

            LoginResponseBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public AuthDTOs.LoginResponse.LoginResponseBuilder token(final String token) {
                this.token = token;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AuthDTOs.LoginResponse.LoginResponseBuilder refreshToken(final String refreshToken) {
                this.refreshToken = refreshToken;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AuthDTOs.LoginResponse.LoginResponseBuilder user(final UserProfile user) {
                this.user = user;
                return this;
            }

            public AuthDTOs.LoginResponse build() {
                return new AuthDTOs.LoginResponse(this.token, this.refreshToken, this.user);
            }

            @Override
            public String toString() {
                return "AuthDTOs.LoginResponse.LoginResponseBuilder(token=" + this.token + ", refreshToken=" + this.refreshToken + ", user=" + this.user + ")";
            }
        }

        public static AuthDTOs.LoginResponse.LoginResponseBuilder builder() {
            return new AuthDTOs.LoginResponse.LoginResponseBuilder();
        }

        public String getToken() {
            return this.token;
        }

        public String getRefreshToken() {
            return this.refreshToken;
        }

        public UserProfile getUser() {
            return this.user;
        }

        public void setToken(final String token) {
            this.token = token;
        }

        public void setRefreshToken(final String refreshToken) {
            this.refreshToken = refreshToken;
        }

        public void setUser(final UserProfile user) {
            this.user = user;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof AuthDTOs.LoginResponse)) return false;
            final AuthDTOs.LoginResponse other = (AuthDTOs.LoginResponse) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$token = this.getToken();
            final Object other$token = other.getToken();
            if (this$token == null ? other$token != null : !this$token.equals(other$token)) return false;
            final Object this$refreshToken = this.getRefreshToken();
            final Object other$refreshToken = other.getRefreshToken();
            if (this$refreshToken == null ? other$refreshToken != null : !this$refreshToken.equals(other$refreshToken)) return false;
            final Object this$user = this.getUser();
            final Object other$user = other.getUser();
            if (this$user == null ? other$user != null : !this$user.equals(other$user)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof AuthDTOs.LoginResponse;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $token = this.getToken();
            result = result * PRIME + ($token == null ? 43 : $token.hashCode());
            final Object $refreshToken = this.getRefreshToken();
            result = result * PRIME + ($refreshToken == null ? 43 : $refreshToken.hashCode());
            final Object $user = this.getUser();
            result = result * PRIME + ($user == null ? 43 : $user.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "AuthDTOs.LoginResponse(token=" + this.getToken() + ", refreshToken=" + this.getRefreshToken() + ", user=" + this.getUser() + ")";
        }

        public LoginResponse() {
        }

        public LoginResponse(final String token, final String refreshToken, final UserProfile user) {
            this.token = token;
            this.refreshToken = refreshToken;
            this.user = user;
        }
    }


    public static class UserProfile {
        private Long id;
        private String name;
        private String email;
        private String phone;
        private String role;
        private String tenantId;
        private String avatar;
        private String interfaceLocale;

        public static class UserProfileBuilder {
            private Long id;
            private String name;
            private String email;
            private String phone;
            private String role;
            private String tenantId;
            private String avatar;
            private String interfaceLocale;

            UserProfileBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public AuthDTOs.UserProfile.UserProfileBuilder id(final Long id) {
                this.id = id;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AuthDTOs.UserProfile.UserProfileBuilder name(final String name) {
                this.name = name;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AuthDTOs.UserProfile.UserProfileBuilder email(final String email) {
                this.email = email;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AuthDTOs.UserProfile.UserProfileBuilder phone(final String phone) {
                this.phone = phone;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AuthDTOs.UserProfile.UserProfileBuilder role(final String role) {
                this.role = role;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AuthDTOs.UserProfile.UserProfileBuilder tenantId(final String tenantId) {
                this.tenantId = tenantId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AuthDTOs.UserProfile.UserProfileBuilder avatar(final String avatar) {
                this.avatar = avatar;
                return this;
            }

            public AuthDTOs.UserProfile.UserProfileBuilder interfaceLocale(final String interfaceLocale) {
                this.interfaceLocale = interfaceLocale;
                return this;
            }

            public AuthDTOs.UserProfile build() {
                return new AuthDTOs.UserProfile(this.id, this.name, this.email, this.phone, this.role, this.tenantId, this.avatar, this.interfaceLocale);
            }

            @Override
            public String toString() {
                return "AuthDTOs.UserProfile.UserProfileBuilder(id=" + this.id + ", name=" + this.name + ", email=" + this.email + ", phone=" + this.phone + ", role=" + this.role + ", tenantId=" + this.tenantId + ", avatar=" + this.avatar + ", interfaceLocale=" + this.interfaceLocale + ")";
            }
        }

        public static AuthDTOs.UserProfile.UserProfileBuilder builder() {
            return new AuthDTOs.UserProfile.UserProfileBuilder();
        }

        public Long getId() {
            return this.id;
        }

        public String getName() {
            return this.name;
        }

        public String getEmail() {
            return this.email;
        }

        public String getPhone() {
            return this.phone;
        }

        public String getRole() {
            return this.role;
        }

        public String getTenantId() {
            return this.tenantId;
        }

        public String getAvatar() {
            return this.avatar;
        }

        public String getInterfaceLocale() {
            return this.interfaceLocale;
        }

        public void setId(final Long id) {
            this.id = id;
        }

        public void setName(final String name) {
            this.name = name;
        }

        public void setEmail(final String email) {
            this.email = email;
        }

        public void setPhone(final String phone) {
            this.phone = phone;
        }

        public void setRole(final String role) {
            this.role = role;
        }

        public void setTenantId(final String tenantId) {
            this.tenantId = tenantId;
        }

        public void setAvatar(final String avatar) {
            this.avatar = avatar;
        }

        public void setInterfaceLocale(final String interfaceLocale) {
            this.interfaceLocale = interfaceLocale;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof AuthDTOs.UserProfile)) return false;
            final AuthDTOs.UserProfile other = (AuthDTOs.UserProfile) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$id = this.getId();
            final Object other$id = other.getId();
            if (this$id == null ? other$id != null : !this$id.equals(other$id)) return false;
            final Object this$name = this.getName();
            final Object other$name = other.getName();
            if (this$name == null ? other$name != null : !this$name.equals(other$name)) return false;
            final Object this$email = this.getEmail();
            final Object other$email = other.getEmail();
            if (this$email == null ? other$email != null : !this$email.equals(other$email)) return false;
            final Object this$phone = this.getPhone();
            final Object other$phone = other.getPhone();
            if (this$phone == null ? other$phone != null : !this$phone.equals(other$phone)) return false;
            final Object this$role = this.getRole();
            final Object other$role = other.getRole();
            if (this$role == null ? other$role != null : !this$role.equals(other$role)) return false;
            final Object this$tenantId = this.getTenantId();
            final Object other$tenantId = other.getTenantId();
            if (this$tenantId == null ? other$tenantId != null : !this$tenantId.equals(other$tenantId)) return false;
            final Object this$avatar = this.getAvatar();
            final Object other$avatar = other.getAvatar();
            if (this$avatar == null ? other$avatar != null : !this$avatar.equals(other$avatar)) return false;
            final Object this$interfaceLocale = this.getInterfaceLocale();
            final Object other$interfaceLocale = other.getInterfaceLocale();
            if (this$interfaceLocale == null ? other$interfaceLocale != null : !this$interfaceLocale.equals(other$interfaceLocale)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof AuthDTOs.UserProfile;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $id = this.getId();
            result = result * PRIME + ($id == null ? 43 : $id.hashCode());
            final Object $name = this.getName();
            result = result * PRIME + ($name == null ? 43 : $name.hashCode());
            final Object $email = this.getEmail();
            result = result * PRIME + ($email == null ? 43 : $email.hashCode());
            final Object $phone = this.getPhone();
            result = result * PRIME + ($phone == null ? 43 : $phone.hashCode());
            final Object $role = this.getRole();
            result = result * PRIME + ($role == null ? 43 : $role.hashCode());
            final Object $tenantId = this.getTenantId();
            result = result * PRIME + ($tenantId == null ? 43 : $tenantId.hashCode());
            final Object $avatar = this.getAvatar();
            result = result * PRIME + ($avatar == null ? 43 : $avatar.hashCode());
            final Object $interfaceLocale = this.getInterfaceLocale();
            result = result * PRIME + ($interfaceLocale == null ? 43 : $interfaceLocale.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "AuthDTOs.UserProfile(id=" + this.getId() + ", name=" + this.getName() + ", email=" + this.getEmail() + ", phone=" + this.getPhone() + ", role=" + this.getRole() + ", tenantId=" + this.getTenantId() + ", avatar=" + this.getAvatar() + ", interfaceLocale=" + this.getInterfaceLocale() + ")";
        }

        public UserProfile() {
        }

        public UserProfile(final Long id, final String name, final String email, final String phone, final String role, final String tenantId, final String avatar, final String interfaceLocale) {
            this.id = id;
            this.name = name;
            this.email = email;
            this.phone = phone;
            this.role = role;
            this.tenantId = tenantId;
            this.avatar = avatar;
            this.interfaceLocale = interfaceLocale;
        }
    }


    public static class ChangePasswordRequest {
        @NotBlank
        private String currentPassword;
        @NotBlank
        private String newPassword;


        public static class ChangePasswordRequestBuilder {
            private String currentPassword;
            private String newPassword;

            ChangePasswordRequestBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public AuthDTOs.ChangePasswordRequest.ChangePasswordRequestBuilder currentPassword(final String currentPassword) {
                this.currentPassword = currentPassword;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AuthDTOs.ChangePasswordRequest.ChangePasswordRequestBuilder newPassword(final String newPassword) {
                this.newPassword = newPassword;
                return this;
            }

            public AuthDTOs.ChangePasswordRequest build() {
                return new AuthDTOs.ChangePasswordRequest(this.currentPassword, this.newPassword);
            }

            @Override
            public String toString() {
                return "AuthDTOs.ChangePasswordRequest.ChangePasswordRequestBuilder(currentPassword=" + this.currentPassword + ", newPassword=" + this.newPassword + ")";
            }
        }

        public static AuthDTOs.ChangePasswordRequest.ChangePasswordRequestBuilder builder() {
            return new AuthDTOs.ChangePasswordRequest.ChangePasswordRequestBuilder();
        }

        public String getCurrentPassword() {
            return this.currentPassword;
        }

        public String getNewPassword() {
            return this.newPassword;
        }

        public void setCurrentPassword(final String currentPassword) {
            this.currentPassword = currentPassword;
        }

        public void setNewPassword(final String newPassword) {
            this.newPassword = newPassword;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof AuthDTOs.ChangePasswordRequest)) return false;
            final AuthDTOs.ChangePasswordRequest other = (AuthDTOs.ChangePasswordRequest) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$currentPassword = this.getCurrentPassword();
            final Object other$currentPassword = other.getCurrentPassword();
            if (this$currentPassword == null ? other$currentPassword != null : !this$currentPassword.equals(other$currentPassword)) return false;
            final Object this$newPassword = this.getNewPassword();
            final Object other$newPassword = other.getNewPassword();
            if (this$newPassword == null ? other$newPassword != null : !this$newPassword.equals(other$newPassword)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof AuthDTOs.ChangePasswordRequest;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $currentPassword = this.getCurrentPassword();
            result = result * PRIME + ($currentPassword == null ? 43 : $currentPassword.hashCode());
            final Object $newPassword = this.getNewPassword();
            result = result * PRIME + ($newPassword == null ? 43 : $newPassword.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "AuthDTOs.ChangePasswordRequest(currentPassword=" + this.getCurrentPassword() + ", newPassword=" + this.getNewPassword() + ")";
        }

        public ChangePasswordRequest() {
        }

        public ChangePasswordRequest(final String currentPassword, final String newPassword) {
            this.currentPassword = currentPassword;
            this.newPassword = newPassword;
        }
    }


    public static class UpdateProfileRequest {
        private String name;
        private String phone;
        private String avatar;


        public static class UpdateProfileRequestBuilder {
            private String name;
            private String phone;
            private String avatar;

            UpdateProfileRequestBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public AuthDTOs.UpdateProfileRequest.UpdateProfileRequestBuilder name(final String name) {
                this.name = name;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AuthDTOs.UpdateProfileRequest.UpdateProfileRequestBuilder phone(final String phone) {
                this.phone = phone;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AuthDTOs.UpdateProfileRequest.UpdateProfileRequestBuilder avatar(final String avatar) {
                this.avatar = avatar;
                return this;
            }

            public AuthDTOs.UpdateProfileRequest build() {
                return new AuthDTOs.UpdateProfileRequest(this.name, this.phone, this.avatar);
            }

            @Override
            public String toString() {
                return "AuthDTOs.UpdateProfileRequest.UpdateProfileRequestBuilder(name=" + this.name + ", phone=" + this.phone + ", avatar=" + this.avatar + ")";
            }
        }

        public static AuthDTOs.UpdateProfileRequest.UpdateProfileRequestBuilder builder() {
            return new AuthDTOs.UpdateProfileRequest.UpdateProfileRequestBuilder();
        }

        public String getName() {
            return this.name;
        }

        public String getPhone() {
            return this.phone;
        }

        public String getAvatar() {
            return this.avatar;
        }

        public void setName(final String name) {
            this.name = name;
        }

        public void setPhone(final String phone) {
            this.phone = phone;
        }

        public void setAvatar(final String avatar) {
            this.avatar = avatar;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof AuthDTOs.UpdateProfileRequest)) return false;
            final AuthDTOs.UpdateProfileRequest other = (AuthDTOs.UpdateProfileRequest) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$name = this.getName();
            final Object other$name = other.getName();
            if (this$name == null ? other$name != null : !this$name.equals(other$name)) return false;
            final Object this$phone = this.getPhone();
            final Object other$phone = other.getPhone();
            if (this$phone == null ? other$phone != null : !this$phone.equals(other$phone)) return false;
            final Object this$avatar = this.getAvatar();
            final Object other$avatar = other.getAvatar();
            if (this$avatar == null ? other$avatar != null : !this$avatar.equals(other$avatar)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof AuthDTOs.UpdateProfileRequest;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $name = this.getName();
            result = result * PRIME + ($name == null ? 43 : $name.hashCode());
            final Object $phone = this.getPhone();
            result = result * PRIME + ($phone == null ? 43 : $phone.hashCode());
            final Object $avatar = this.getAvatar();
            result = result * PRIME + ($avatar == null ? 43 : $avatar.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "AuthDTOs.UpdateProfileRequest(name=" + this.getName() + ", phone=" + this.getPhone() + ", avatar=" + this.getAvatar() + ")";
        }

        public UpdateProfileRequest() {
        }

        public UpdateProfileRequest(final String name, final String phone, final String avatar) {
            this.name = name;
            this.phone = phone;
            this.avatar = avatar;
        }
    }


    public static class RefreshTokenRequest {
        @NotBlank
        private String refreshToken;


        public static class RefreshTokenRequestBuilder {
            private String refreshToken;

            RefreshTokenRequestBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public AuthDTOs.RefreshTokenRequest.RefreshTokenRequestBuilder refreshToken(final String refreshToken) {
                this.refreshToken = refreshToken;
                return this;
            }

            public AuthDTOs.RefreshTokenRequest build() {
                return new AuthDTOs.RefreshTokenRequest(this.refreshToken);
            }

            @Override
            public String toString() {
                return "AuthDTOs.RefreshTokenRequest.RefreshTokenRequestBuilder(refreshToken=" + this.refreshToken + ")";
            }
        }

        public static AuthDTOs.RefreshTokenRequest.RefreshTokenRequestBuilder builder() {
            return new AuthDTOs.RefreshTokenRequest.RefreshTokenRequestBuilder();
        }

        public String getRefreshToken() {
            return this.refreshToken;
        }

        public void setRefreshToken(final String refreshToken) {
            this.refreshToken = refreshToken;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof AuthDTOs.RefreshTokenRequest)) return false;
            final AuthDTOs.RefreshTokenRequest other = (AuthDTOs.RefreshTokenRequest) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$refreshToken = this.getRefreshToken();
            final Object other$refreshToken = other.getRefreshToken();
            if (this$refreshToken == null ? other$refreshToken != null : !this$refreshToken.equals(other$refreshToken)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof AuthDTOs.RefreshTokenRequest;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $refreshToken = this.getRefreshToken();
            result = result * PRIME + ($refreshToken == null ? 43 : $refreshToken.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "AuthDTOs.RefreshTokenRequest(refreshToken=" + this.getRefreshToken() + ")";
        }

        public RefreshTokenRequest() {
        }

        public RefreshTokenRequest(final String refreshToken) {
            this.refreshToken = refreshToken;
        }
    }


    public static class TokenResponse {
        private String token;
        private String refreshToken;


        public static class TokenResponseBuilder {
            private String token;
            private String refreshToken;

            TokenResponseBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public AuthDTOs.TokenResponse.TokenResponseBuilder token(final String token) {
                this.token = token;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AuthDTOs.TokenResponse.TokenResponseBuilder refreshToken(final String refreshToken) {
                this.refreshToken = refreshToken;
                return this;
            }

            public AuthDTOs.TokenResponse build() {
                return new AuthDTOs.TokenResponse(this.token, this.refreshToken);
            }

            @Override
            public String toString() {
                return "AuthDTOs.TokenResponse.TokenResponseBuilder(token=" + this.token + ", refreshToken=" + this.refreshToken + ")";
            }
        }

        public static AuthDTOs.TokenResponse.TokenResponseBuilder builder() {
            return new AuthDTOs.TokenResponse.TokenResponseBuilder();
        }

        public String getToken() {
            return this.token;
        }

        public String getRefreshToken() {
            return this.refreshToken;
        }

        public void setToken(final String token) {
            this.token = token;
        }

        public void setRefreshToken(final String refreshToken) {
            this.refreshToken = refreshToken;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof AuthDTOs.TokenResponse)) return false;
            final AuthDTOs.TokenResponse other = (AuthDTOs.TokenResponse) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$token = this.getToken();
            final Object other$token = other.getToken();
            if (this$token == null ? other$token != null : !this$token.equals(other$token)) return false;
            final Object this$refreshToken = this.getRefreshToken();
            final Object other$refreshToken = other.getRefreshToken();
            if (this$refreshToken == null ? other$refreshToken != null : !this$refreshToken.equals(other$refreshToken)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof AuthDTOs.TokenResponse;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $token = this.getToken();
            result = result * PRIME + ($token == null ? 43 : $token.hashCode());
            final Object $refreshToken = this.getRefreshToken();
            result = result * PRIME + ($refreshToken == null ? 43 : $refreshToken.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "AuthDTOs.TokenResponse(token=" + this.getToken() + ", refreshToken=" + this.getRefreshToken() + ")";
        }

        public TokenResponse() {
        }

        public TokenResponse(final String token, final String refreshToken) {
            this.token = token;
            this.refreshToken = refreshToken;
        }
    }
}
