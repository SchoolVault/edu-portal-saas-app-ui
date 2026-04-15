package com.school.erp.modules.identity.enums;

import lombok.Getter;

/**
 * Purpose for which OTP is generated.
 */
@Getter
public enum OtpPurpose {
    LOGIN("Login verification"),
    SIGNUP("Account signup verification"),
    PASSWORD_RESET("Password reset verification"),
    PHONE_VERIFY("Phone number verification"),
    EMAIL_VERIFY("Email verification"),
    TRANSACTION("Financial transaction verification");

    private final String description;

    OtpPurpose(String description) {
        this.description = description;
    }
}
