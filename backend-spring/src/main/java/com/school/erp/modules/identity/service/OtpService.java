package com.school.erp.modules.identity.service;

import com.school.erp.modules.identity.dto.PhoneAuthDTOs;
import com.school.erp.modules.identity.entity.OtpVerification;
import com.school.erp.modules.identity.enums.OtpChannel;
import com.school.erp.modules.identity.enums.OtpPurpose;
import com.school.erp.modules.identity.enums.OtpStatus;
import com.school.erp.modules.identity.repository.OtpVerificationRepository;
import com.school.erp.modules.notification.sms.SmsRequest;
import com.school.erp.modules.notification.sms.SmsResponse;
import com.school.erp.modules.notification.sms.SmsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * OTP generation / verification. Tenant is resolved from {@code schoolCode} (no JWT required).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final OtpVerificationRepository otpVerificationRepository;
    private final SmsService smsService;
    private final PasswordEncoder passwordEncoder;
    private final SchoolCodeTenantResolver schoolCodeTenantResolver;

    @Value("${app.otp.length:6}")
    private int otpLength;

    @Value("${app.otp.ttl.seconds:300}")
    private long otpTtlSeconds;

    @Value("${app.otp.max.attempts:3}")
    private int maxAttempts;

    @Value("${app.otp.resend.cooldown.seconds:60}")
    private long resendCooldownSeconds;

    @Value("${app.otp.rate.limit.window.minutes:60}")
    private int rateLimitWindowMinutes;

    @Value("${app.otp.rate.limit.max.requests:5}")
    private int rateLimitMaxRequests;

    @Value("${app.dev.mode:false}")
    private boolean devMode;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String OTP_MESSAGE_TEMPLATE = "Your %s OTP for %s is: %s. Valid for %d minutes. Do not share this code.";

    @Transactional
    public PhoneAuthDTOs.SendOtpResponse sendOtp(PhoneAuthDTOs.SendOtpRequest request) {
        String tenantId = schoolCodeTenantResolver.resolveTenantId(request.getSchoolCode());
        String requestId = request.getRequestId() != null ? request.getRequestId() : UUID.randomUUID().toString();
        String phone = request.getPhone().trim();

        log.info("OTP send phone={} purpose={} tenantId={} requestId={}", phone, request.getPurpose(), tenantId, requestId);

        if (!checkRateLimit(phone, tenantId)) {
            log.warn("OTP rate limit exceeded phone={}", phone);
            return PhoneAuthDTOs.SendOtpResponse.builder()
                    .success(false)
                    .message("Too many OTP requests. Please try again later.")
                    .requestId(requestId)
                    .canRetryAfterSeconds((long) resendCooldownSeconds)
                    .build();
        }

        Optional<OtpVerification> recentOtp = otpVerificationRepository.findLatestPendingOtp(
                phone,
                tenantId,
                OtpPurpose.valueOf(request.getPurpose().toUpperCase()),
                OtpStatus.PENDING,
                LocalDateTime.now()
        );

        if (recentOtp.isPresent()) {
            long secondsSinceLastOtp = java.time.Duration.between(recentOtp.get().getSentAt(), LocalDateTime.now()).getSeconds();
            if (secondsSinceLastOtp < resendCooldownSeconds) {
                long remainingSeconds = resendCooldownSeconds - secondsSinceLastOtp;
                log.warn("OTP cooldown active phone={} remainingSeconds={}", phone, remainingSeconds);
                return PhoneAuthDTOs.SendOtpResponse.builder()
                        .success(false)
                        .message("Please wait before requesting another OTP.")
                        .requestId(requestId)
                        .canRetryAfterSeconds(remainingSeconds)
                        .build();
            }
        }

        String otpCode = generateOtp();
        String otpHash = passwordEncoder.encode(otpCode);

        OtpVerification otpVerification = OtpVerification.builder()
                .tenantId(tenantId)
                .phone(phone)
                .otpCode(devMode ? otpCode : "")
                .otpHash(otpHash)
                .purpose(OtpPurpose.valueOf(request.getPurpose().toUpperCase()))
                .channel(request.getChannel() != null ? OtpChannel.valueOf(request.getChannel().toUpperCase()) : OtpChannel.SMS)
                .provider(smsService.getProviderName())
                .status(OtpStatus.PENDING)
                .attempts(0)
                .maxAttempts(maxAttempts)
                .expiresAt(LocalDateTime.now().plusSeconds(otpTtlSeconds))
                .sentAt(LocalDateTime.now())
                .requestId(requestId)
                .build();

        String message = String.format(
                OTP_MESSAGE_TEMPLATE,
                request.getPurpose().toUpperCase(),
                request.getSchoolCode(),
                otpCode,
                otpTtlSeconds / 60
        );

SmsRequest smsRequest = SmsRequest.builder()
                .to(phone)
                .message(message)
                .tenantId(tenantId)
                .correlationId(requestId)
                .build();

SmsResponse smsResponse = smsService.sendSms(smsRequest);

        otpVerification.setProviderMessageId(smsResponse.getMessageId());
        otpVerification.setProviderStatus(smsResponse.getProviderStatus());

        if (!smsResponse.isSuccess()) {
            otpVerification.setProviderError(smsResponse.getErrorMessage());
            otpVerification.setStatus(OtpStatus.FAILED);
            log.error("OTP SMS send failed: {}", smsResponse.getErrorMessage());
        }

        otpVerificationRepository.save(otpVerification);

        PhoneAuthDTOs.SendOtpResponse.SendOtpResponseBuilder responseBuilder = PhoneAuthDTOs.SendOtpResponse.builder()
                .success(smsResponse.isSuccess())
                .message(smsResponse.isSuccess() ? "OTP sent successfully" : "Failed to send OTP")
                .requestId(requestId)
                .expiresInSeconds(otpTtlSeconds)
                .canRetryAfterSeconds(resendCooldownSeconds);

        if (devMode && smsResponse.isSuccess()) {
            responseBuilder.devOtpCode(otpCode);
            log.info("DEV MODE OTP code={}", otpCode);
        }

        return responseBuilder.build();
    }

    @Transactional
    public PhoneAuthDTOs.VerifyOtpResponse verifyOtp(PhoneAuthDTOs.VerifyOtpRequest request) {
        String tenantId = schoolCodeTenantResolver.resolveTenantId(request.getSchoolCode());
        String phone = request.getPhone().trim();

        log.info("OTP verify phone={} purpose={} tenantId={}", phone, request.getPurpose(), tenantId);

        Optional<OtpVerification> otpOpt = otpVerificationRepository.findLatestPendingOtp(
                phone,
                tenantId,
                OtpPurpose.valueOf(request.getPurpose().toUpperCase()),
                OtpStatus.PENDING,
                LocalDateTime.now()
        );

        if (otpOpt.isEmpty()) {
            log.warn("OTP verify no pending record phone={}", phone);
            return PhoneAuthDTOs.VerifyOtpResponse.builder()
                    .verified(false)
                    .message("Invalid or expired OTP. Please request a new one.")
                    .remainingAttempts(0)
                    .build();
        }

        OtpVerification otp = otpOpt.get();

        if (otp.isExpired()) {
            otp.markAsExpired();
            otpVerificationRepository.save(otp);
            return PhoneAuthDTOs.VerifyOtpResponse.builder()
                    .verified(false)
                    .message("OTP has expired. Please request a new one.")
                    .remainingAttempts(0)
                    .build();
        }

        if (!otp.canRetry()) {
            otp.markAsFailed("Maximum attempts exceeded");
            otpVerificationRepository.save(otp);
            return PhoneAuthDTOs.VerifyOtpResponse.builder()
                    .verified(false)
                    .message("Maximum verification attempts exceeded. Please request a new OTP.")
                    .remainingAttempts(0)
                    .build();
        }

        boolean otpMatches = passwordEncoder.matches(request.getOtpCode(), otp.getOtpHash());

        if (otpMatches) {
            otp.markAsVerified();
            String exchange = UUID.randomUUID().toString().replace("-", "");
            otp.setExchangeToken(exchange);
            otpVerificationRepository.save(otp);

            log.info("OTP verified phone={} tenantId={}", phone, tenantId);

            return PhoneAuthDTOs.VerifyOtpResponse.builder()
                    .verified(true)
                    .message("OTP verified successfully")
                    .verificationToken(exchange)
                    .remainingAttempts(otp.getMaxAttempts() - otp.getAttempts())
                    .build();
        }

        otp.incrementAttempts();
        otpVerificationRepository.save(otp);

        int remainingAttempts = otp.getMaxAttempts() - otp.getAttempts();
        log.warn("OTP mismatch phone={} remainingAttempts={}", phone, remainingAttempts);

        return PhoneAuthDTOs.VerifyOtpResponse.builder()
                .verified(false)
                .message("Invalid OTP. Please try again.")
                .remainingAttempts(remainingAttempts)
                .build();
    }

    private String generateOtp() {
        StringBuilder otp = new StringBuilder();
        for (int i = 0; i < otpLength; i++) {
            otp.append(SECURE_RANDOM.nextInt(10));
        }
        return otp.toString();
    }

    private boolean checkRateLimit(String phone, String tenantId) {
        LocalDateTime windowStart = LocalDateTime.now().minusMinutes(rateLimitWindowMinutes);
        List<OtpVerification> recentOtps = otpVerificationRepository.findRecentOtpsByPhone(phone, tenantId, windowStart);
        return recentOtps.size() < rateLimitMaxRequests;
    }

    @Transactional
    public int cleanupExpiredOtps() {
        log.info("OTP cleanup: mark expired");
        int marked = otpVerificationRepository.markExpiredOtps(OtpStatus.PENDING, OtpStatus.EXPIRED, LocalDateTime.now());
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
        int deleted = otpVerificationRepository.cleanupOldOtps(cutoffDate);
        log.info("OTP cleanup marked={} softDeletedOld={}", marked, deleted);
        return marked + deleted;
    }
}
