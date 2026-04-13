package com.school.erp.modules.auth.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.enums.Enums;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "users", uniqueConstraints = {@UniqueConstraint(columnNames = {"tenant_id", "email"})}, indexes = {@Index(name = "idx_user_tenant", columnList = "tenant_id"), @Index(name = "idx_user_email", columnList = "tenant_id, email")})
public class User extends BaseEntity {
    @Column(nullable = false, length = 100)
    private String name;
    @Column(nullable = false, length = 150)
    private String email;
    @Column(nullable = false)
    private String password;
    @Column(length = 20)
    private String phone;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private Enums.Role role;
    @Column(length = 100)
    private String schoolCode;
    @Column(length = 500)
    private String avatar;
    @Column(name = "preferred_locale", nullable = false, length = 16)
    private String preferredLocale = "en";

    public static class UserBuilder {
        private String name;
        private String email;
        private String password;
        private String phone;
        private Enums.Role role;
        private String schoolCode;
        private String avatar;
        private String preferredLocale;

        UserBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public User.UserBuilder name(final String name) {
            this.name = name;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public User.UserBuilder email(final String email) {
            this.email = email;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public User.UserBuilder password(final String password) {
            this.password = password;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public User.UserBuilder phone(final String phone) {
            this.phone = phone;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public User.UserBuilder role(final Enums.Role role) {
            this.role = role;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public User.UserBuilder schoolCode(final String schoolCode) {
            this.schoolCode = schoolCode;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public User.UserBuilder avatar(final String avatar) {
            this.avatar = avatar;
            return this;
        }

        public User.UserBuilder preferredLocale(final String preferredLocale) {
            this.preferredLocale = preferredLocale;
            return this;
        }

        public User build() {
            User u = new User(this.name, this.email, this.password, this.phone, this.role, this.schoolCode, this.avatar);
            if (this.preferredLocale != null && !this.preferredLocale.isBlank()) {
                u.setPreferredLocale(this.preferredLocale);
            }
            return u;
        }

        @Override
        public String toString() {
            return "User.UserBuilder(name=" + this.name + ", email=" + this.email + ", password=" + this.password + ", phone=" + this.phone + ", role=" + this.role + ", schoolCode=" + this.schoolCode + ", avatar=" + this.avatar + ", preferredLocale=" + this.preferredLocale + ")";
        }
    }

    public static User.UserBuilder builder() {
        return new User.UserBuilder();
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

    public String getAvatar() {
        return this.avatar;
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

    public void setAvatar(final String avatar) {
        this.avatar = avatar;
    }

    public String getPreferredLocale() {
        return this.preferredLocale;
    }

    public void setPreferredLocale(final String preferredLocale) {
        this.preferredLocale = preferredLocale != null && !preferredLocale.isBlank() ? preferredLocale : "en";
    }

    public User() {
    }

    public User(final String name, final String email, final String password, final String phone, final Enums.Role role, final String schoolCode, final String avatar) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.phone = phone;
        this.role = role;
        this.schoolCode = schoolCode;
        this.avatar = avatar;
        this.preferredLocale = "en";
    }
}
