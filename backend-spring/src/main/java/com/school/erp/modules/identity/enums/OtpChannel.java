package com.school.erp.modules.identity.enums;

import lombok.Getter;

/**
 * Channel through which OTP is sent.
 */
@Getter
public enum OtpChannel {
    SMS("SMS Text Message"),
    WHATSAPP("WhatsApp Message"),
    VOICE("Voice Call"),
    EMAIL("Email");

    private final String description;

    OtpChannel(String description) {
        this.description = description;
    }
}
