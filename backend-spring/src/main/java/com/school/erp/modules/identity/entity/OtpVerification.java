package com.school.erp.modules.identity.entity;

import com.school.erp.modules.identity.enums.OtpChannel;
import com.school.erp.modules.identity.enums.OtpPurpose;
import com.school.erp.modules.identity.enums.OtpStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * OTP Verification entity for phone/email OTP tracking.
 * Supports multiple channels (SMS, WhatsApp, Email) and providers (Twilio, AWS SNS).
 * Includes security features like attempt tracking and expiry.
 */
@Entity
@Table(name = "otp_verifications",
    indexes = {
        @Index(name = "idx_otp_phone_status", columnList = "phone, status, expires_at"),
        @Index(name = "idx_otp_tenant", columnList = "tenant_id, created_at"),
        @Index(name = "idx_otp_expires", columnList = "expires_at, status"),
        @Index(name = "idx_otp_request", columnList = "request_id")
    })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    // ========== Identity ==========

    @Column(name = "phone", nullable = false, length = 32)
    private String phone;

    @Column(name = "otp_code", nullable = false, length = 16)
    private String otpCode;

    @Column(name = "otp_hash", nullable = false)
    private String otpHash; // Hashed OTP for verification

    // ========== Metadata ==========

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "purpose", nullable = false, length = 50)
    private OtpPurpose purpose;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "channel", length = 20)
    @Builder.Default
    private OtpChannel channel = OtpChannel.SMS;

    @Column(name = "provider", length = 50)
    @Builder.Default
    private String provider = "MOCK";

    // ========== Status Tracking ==========

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "status", length = 20)
    @Builder.Default
    private OtpStatus status = OtpStatus.PENDING;

    @Column(name = "attempts")
    @Builder.Default
    private Integer attempts = 0;

    @Column(name = "max_attempts")
    @Builder.Default
    private Integer maxAttempts = 3;

    // ========== Timestamps ==========

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "sent_at")
    @Builder.Default
    private LocalDateTime sentAt = LocalDateTime.now();

    // ========== Request Context ==========

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "request_id", length = 100)
    private String requestId; // Correlation ID for tracing

    // ========== Provider Response ==========

    @Column(name = "provider_message_id")
    private String providerMessageId;

    @Column(name = "provider_status", length = 50)
    private String providerStatus;

    @Column(name = "provider_error", columnDefinition = "TEXT")
    private String providerError;

    @Column(name = "exchange_token", length = 64)
    private String exchangeToken;

    @Column(name = "is_deleted")
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    public boolean isVerified() {
        return status == OtpStatus.VERIFIED;
    }

    public boolean canRetry() {
        return attempts < maxAttempts && !isExpired();
    }

    public void incrementAttempts() {
        this.attempts++;
        this.updatedAt = LocalDateTime.now();
    }

    public void markAsVerified() {
        this.status = OtpStatus.VERIFIED;
        this.verifiedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void markAsExpired() {
        this.status = OtpStatus.EXPIRED;
        this.updatedAt = LocalDateTime.now();
    }

    public void markAsFailed(String reason) {
        this.status = OtpStatus.FAILED;
        this.providerError = reason;
        this.updatedAt = LocalDateTime.now();
    }
}
