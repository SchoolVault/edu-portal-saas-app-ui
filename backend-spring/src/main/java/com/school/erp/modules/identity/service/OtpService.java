package com.school.erp.modules.identity.service;

import com.school.erp.common.util.InternationalPhone;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.modules.identity.dto.PhoneAuthDTOs;
import com.school.erp.modules.identity.entity.OtpVerification;
import com.school.erp.modules.identity.enums.OtpChannel;
import com.school.erp.modules.identity.enums.OtpPurpose;
import com.school.erp.modules.identity.enums.OtpStatus;
import com.school.erp.modules.identity.repository.OtpVerificationRepository;
import com.school.erp.modules.notification.sms.SmsRequest;
import com.school.erp.modules.notification.sms.SmsResponse;
import com.school.erp.modules.notification.sms.SmsService;
import com.school.erp.modules.notification.sms.SmsTemplate;
import com.school.erp.modules.settings.entity.TenantConfig;
import com.school.erp.platform.port.NotificationDispatchAttributes;
import com.school.erp.platform.port.NotificationDispatchPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
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
    private final NotificationDispatchPort notificationDispatchPort;
    private final SchoolCodeTenantResolver schoolCodeTenantResolver;
    private final ObjectMapper objectMapper;

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

    @Value("${app.otp.rate.limit.max.requests:20}")
    private int rateLimitMaxRequests;

    @Value("${app.dev.mode:false}")
    private boolean devMode;

    @Value("${app.otp.hash.secret:school-erp-otp-v1}")
    private String otpHashSecret;

    @Value("${app.sms.msg91.otp-template-id:}")
    private String defaultOtpTemplateId;

    @Value("${app.sms.msg91.templates.login:}")
    private String loginOtpTemplateId;

    @Value("${app.sms.msg91.templates.password-reset:}")
    private String passwordResetOtpTemplateId;

    @Value("${app.sms.msg91.templates.forgot-password:${app.sms.msg91.templates.password-reset:}}")
    private String forgotPasswordOtpTemplateId;

    @Value("${app.sms.msg91.templates.signup:}")
    private String signupOtpTemplateId;

    @Value("${app.sms.msg91.templates.phone-verify:}")
    private String phoneVerifyOtpTemplateId;

    @Value("${app.sms.msg91.templates.email-verify:}")
    private String emailVerifyOtpTemplateId;

    @Value("${app.sms.msg91.templates.transaction:}")
    private String transactionOtpTemplateId;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String OTP_MESSAGE_TEMPLATE = "Your %s OTP for %s is: %s. Valid for %d minutes. Do not share this code.";

    @Transactional
    public PhoneAuthDTOs.SendOtpResponse sendOtp(PhoneAuthDTOs.SendOtpRequest request) {
        String tenantId = schoolCodeTenantResolver.resolveTenantId(request.getSchoolCode());
        String requestId = request.getRequestId() != null ? request.getRequestId().trim() : UUID.randomUUID().toString();
        String national = InternationalPhone.nationalIndiaMobile10(request.getPhone().trim());
        if (national == null) {
            log.warn("OTP send rejected: invalid phone raw={}", request.getPhone());
            return PhoneAuthDTOs.SendOtpResponse.builder()
                    .success(false)
                    .message(InternationalPhone.importPhoneInvalidMessage())
                    .requestId(requestId)
                    .canRetryAfterSeconds(0L)
                    .build();
        }
        List<String> phoneKeys = InternationalPhone.compatibleLookupKeys("+91-" + national);
        OtpPurpose otpPurpose = OtpPurpose.valueOf(request.getPurpose().toUpperCase(Locale.ROOT));

        if (request.getRequestId() != null && !request.getRequestId().isBlank()) {
            Optional<OtpVerification> existing = otpVerificationRepository.findByRequestIdAndIsDeletedFalse(requestId);
            if (existing.isPresent() && existing.get().getTenantId().equals(tenantId) && existing.get().getPhone().equals(national)) {
                OtpVerification row = existing.get();
                boolean accepted = row.getStatus() == OtpStatus.PENDING;
                return PhoneAuthDTOs.SendOtpResponse.builder()
                        .success(accepted)
                        .message(accepted ? "OTP request already accepted" : "OTP request already processed")
                        .requestId(requestId)
                        .expiresInSeconds(accepted ? java.time.Duration.between(LocalDateTime.now(), row.getExpiresAt()).getSeconds() : 0L)
                        .canRetryAfterSeconds(resendCooldownSeconds)
                        .build();
            }
        }

        log.info("OTP send phone={} purpose={} tenantId={} requestId={}", national, otpPurpose, tenantId, requestId);

        if (!checkRateLimit(phoneKeys, tenantId)) {
            log.warn("OTP rate limit exceeded phone={}", national);
            return PhoneAuthDTOs.SendOtpResponse.builder()
                    .success(false)
                    .message("Too many OTP requests. Please try again later.")
                    .requestId(requestId)
                    .canRetryAfterSeconds((long) resendCooldownSeconds)
                    .build();
        }

        Optional<OtpVerification> recentOtp = otpVerificationRepository.findLatestPendingOtp(
                phoneKeys,
                tenantId,
                otpPurpose,
                OtpStatus.PENDING,
                LocalDateTime.now()
        );

        if (recentOtp.isPresent()) {
            long secondsSinceLastOtp = java.time.Duration.between(recentOtp.get().getSentAt(), LocalDateTime.now()).getSeconds();
            if (secondsSinceLastOtp < resendCooldownSeconds) {
                long remainingSeconds = resendCooldownSeconds - secondsSinceLastOtp;
                log.warn("OTP cooldown active phone={} remainingSeconds={}", national, remainingSeconds);
                return PhoneAuthDTOs.SendOtpResponse.builder()
                        .success(false)
                        .message("Please wait before requesting another OTP.")
                        .requestId(requestId)
                        .canRetryAfterSeconds(remainingSeconds)
                        .build();
            }
        }

        String otpCode = generateOtp();
        String otpHash = hashOtp(otpCode, tenantId, national, requestId);

        OtpVerification otpVerification = OtpVerification.builder()
                .tenantId(tenantId)
                .phone(national)
                .otpCode(otpCode)
                .otpHash(otpHash)
                .purpose(otpPurpose)
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

        SmsTemplate smsTemplate = resolveOtpTemplate(otpPurpose, request.getSchoolCode(), otpCode);
        SmsRequest smsRequest = SmsRequest.builder()
                .to(InternationalPhone.toSmsAddress("+91-" + national))
                .message(message)
                .tenantId(tenantId)
                .correlationId(requestId)
                .template(smsTemplate)
                .build();

        SmsResponse smsResponse = smsService.sendSms(smsRequest);
        otpVerification.setProviderMessageId(smsResponse.getMessageId());
        otpVerification.setProviderStatus(smsResponse.getProviderStatus());
        if (!smsResponse.isSuccess()) {
            otpVerification.setProviderStatus("FAILED");
            otpVerification.setProviderError(smsResponse.getErrorMessage());
            otpVerification.setStatus(OtpStatus.FAILED);
            log.error("OTP direct send failed requestId={} providerStatus={} reason={}",
                    requestId, smsResponse.getProviderStatus(), smsResponse.getErrorMessage());
            enqueueOtpFallback(tenantId, otpPurpose, national, requestId, message, smsTemplate);
        }

        otpVerificationRepository.save(otpVerification);

        boolean accepted = otpVerification.getStatus() == OtpStatus.PENDING;
        PhoneAuthDTOs.SendOtpResponse.SendOtpResponseBuilder responseBuilder = PhoneAuthDTOs.SendOtpResponse.builder()
                .success(accepted)
                .message(accepted ? "OTP accepted for delivery" : "Failed to send OTP")
                .requestId(requestId)
                .expiresInSeconds(otpTtlSeconds)
                .canRetryAfterSeconds(resendCooldownSeconds);

        if (devMode && accepted) {
            responseBuilder.devOtpCode(otpCode);
            log.info("DEV MODE OTP code={}", otpCode);
        }

        return responseBuilder.build();
    }

    private SmsTemplate resolveOtpTemplate(OtpPurpose purpose, String schoolCode, String otpCode) {
        String templateId = resolveTemplateIdByPurpose(purpose);
        if (templateId == null || templateId.isBlank()) {
            return null;
        }
        String schoolName = schoolCodeTenantResolver.resolveWorkspace(schoolCode)
                .map(TenantConfig::getSchoolName)
                .orElse(schoolCode);
        Map<String, String> variables = new LinkedHashMap<>();
        variables.put("school", schoolName == null ? "" : schoolName.trim());
        variables.put("otp", otpCode);
        return SmsTemplate.builder()
                .templateId(templateId)
                .variables(variables)
                .build();
    }

    private String resolveTemplateIdByPurpose(OtpPurpose purpose) {
        String resolved = switch (purpose) {
            case LOGIN -> loginOtpTemplateId;
            case PASSWORD_RESET -> (forgotPasswordOtpTemplateId != null && !forgotPasswordOtpTemplateId.isBlank()
                    ? forgotPasswordOtpTemplateId
                    : passwordResetOtpTemplateId);
            case SIGNUP -> signupOtpTemplateId;
            case PHONE_VERIFY -> phoneVerifyOtpTemplateId;
            case EMAIL_VERIFY -> emailVerifyOtpTemplateId;
            case TRANSACTION -> transactionOtpTemplateId;
        };
        if (resolved != null && !resolved.isBlank()) {
            return resolved.trim();
        }
        return defaultOtpTemplateId == null ? null : defaultOtpTemplateId.trim();
    }

    private String buildOtpDedupeKey(String tenantId, String national, OtpPurpose purpose, String requestId) {
        return "otp:" + tenantId + ":" + national + ":" + purpose.name() + ":" + requestId;
    }

    private void enqueueOtpFallback(
            String tenantId,
            OtpPurpose otpPurpose,
            String national,
            String requestId,
            String message,
            SmsTemplate template) {
        try {
            NotificationDispatchAttributes attrs = NotificationDispatchAttributes.empty();
            if (template != null && template.getTemplateId() != null && !template.getTemplateId().isBlank()) {
                String variablesJson = objectMapper.writeValueAsString(template.getVariables());
                attrs = NotificationDispatchAttributes.smsTemplate(template.getTemplateId(), variablesJson);
            }
            notificationDispatchPort.enqueue(
                    tenantId,
                    "OTP_" + otpPurpose.name(),
                    "SMS",
                    null,
                    InternationalPhone.toSmsAddress("+91-" + national),
                    "OTP Verification",
                    message,
                    buildOtpDedupeKey(tenantId, national, otpPurpose, requestId),
                    requestId,
                    attrs);
            log.info("OTP fallback enqueued requestId={} purpose={}", requestId, otpPurpose);
        } catch (JsonProcessingException ex) {
            log.warn("OTP fallback serialize failed requestId={}: {}", requestId, ex.getMessage());
        } catch (Exception ex) {
            log.warn("OTP fallback enqueue failed requestId={}: {}", requestId, ex.getMessage());
        }
    }

    @Transactional
    public PhoneAuthDTOs.VerifyOtpResponse verifyOtp(PhoneAuthDTOs.VerifyOtpRequest request) {
        String tenantId = schoolCodeTenantResolver.resolveTenantId(request.getSchoolCode());
        String national = InternationalPhone.nationalIndiaMobile10(request.getPhone().trim());
        if (national == null) {
            log.warn("OTP verify rejected: invalid phone");
            return PhoneAuthDTOs.VerifyOtpResponse.builder()
                    .verified(false)
                    .message(InternationalPhone.importPhoneInvalidMessage())
                    .remainingAttempts(0)
                    .build();
        }
        List<String> phoneKeys = InternationalPhone.compatibleLookupKeys("+91-" + national);

        log.info("OTP verify phone={} purpose={} tenantId={}", national, request.getPurpose(), tenantId);

        Optional<OtpVerification> otpOpt = otpVerificationRepository.findLatestPendingOtp(
                phoneKeys,
                tenantId,
                OtpPurpose.valueOf(request.getPurpose().toUpperCase()),
                OtpStatus.PENDING,
                LocalDateTime.now()
        );

        if (otpOpt.isEmpty()) {
            log.warn("OTP verify no pending record phone={}", national);
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

        boolean otpMatches = matchesOtp(request.getOtpCode(), otp.getOtpHash(), otp.getTenantId(), national, otp.getRequestId());

        if (otpMatches) {
            otp.markAsVerified();
            String exchange = UUID.randomUUID().toString().replace("-", "");
            otp.setExchangeToken(exchange);
            otpVerificationRepository.save(otp);

            log.info("OTP verified phone={} tenantId={}", national, tenantId);

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
        log.warn("OTP mismatch phone={} remainingAttempts={}", national, remainingAttempts);

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

    private String hashOtp(String otpCode, String tenantId, String national, String requestId) {
        try {
            String material = otpHashSecret + "|" + tenantId + "|" + national + "|" + requestId + "|" + otpCode;
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(material.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.Base64.getEncoder().encodeToString(hash);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to hash OTP", ex);
        }
    }

    private boolean matchesOtp(String inputOtp, String storedHash, String tenantId, String national, String requestId) {
        if (inputOtp == null || storedHash == null) {
            return false;
        }
        String inputHash = hashOtp(inputOtp, tenantId, national, requestId);
        return MessageDigest.isEqual(
                inputHash.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                storedHash.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    private boolean checkRateLimit(List<String> phoneKeys, String tenantId) {
        LocalDateTime windowStart = LocalDateTime.now().minusMinutes(rateLimitWindowMinutes);
        List<OtpVerification> recentOtps = otpVerificationRepository.findRecentOtpsByPhoneIn(phoneKeys, tenantId, windowStart);
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
