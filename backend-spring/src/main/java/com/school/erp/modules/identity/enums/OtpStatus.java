package com.school.erp.modules.identity.enums;

import lombok.Getter;

/**
 * OTP verification status.
 */
@Getter
public enum OtpStatus {
    PENDING("Awaiting verification"),
    VERIFIED("Successfully verified"),
    EXPIRED("OTP has expired"),
    FAILED("Verification failed");

    private final String description;

    OtpStatus(String description) {
        this.description = description;
    }

    public boolean isTerminal() {
        return this == VERIFIED || this == EXPIRED || this == FAILED;
    }
}
