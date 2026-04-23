package com.school.erp.modules.auth.service;

import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.config.AuthEmailVerificationProperties;
import com.school.erp.modules.auth.dto.AuthDTOs;
import com.school.erp.modules.auth.entity.EmailVerificationToken;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.EmailVerificationTokenRepository;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.platform.port.AuditTrailPort;
import com.school.erp.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class EmailVerificationService {
    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository tokenRepository;
    private final AuthEmailVerificationProperties properties;
    private final AuditTrailPort auditTrailPort;

    public EmailVerificationService(UserRepository userRepository,
                                    EmailVerificationTokenRepository tokenRepository,
                                    AuthEmailVerificationProperties properties,
                                    AuditTrailPort auditTrailPort) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.properties = properties;
        this.auditTrailPort = auditTrailPort;
    }

    @Transactional
    public AuthDTOs.EmailVerificationRequestResponse requestVerificationForCurrentUser() {
        String tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();
        if (tenantId == null || userId == null) {
            throw new BusinessException("Session not available");
        }
        User user = userRepository.findByIdAndTenantIdAndIsDeletedFalse(userId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new BusinessException("Add an email address to your profile before requesting verification.");
        }
        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new BusinessException("Email is already verified.");
        }
        tokenRepository.findFirstByTenantIdAndUserIdAndIsDeletedFalseOrderByCreatedAtDesc(tenantId, userId)
                .ifPresent(lastToken -> {
                    int cooldown = Math.max(0, properties.getRequestCooldownSeconds());
                    if (cooldown > 0 && lastToken.getCreatedAt() != null) {
                        LocalDateTime retryAt = lastToken.getCreatedAt().plusSeconds(cooldown);
                        if (retryAt.isAfter(LocalDateTime.now())) {
                            long waitSeconds = java.time.Duration.between(LocalDateTime.now(), retryAt).getSeconds();
                            throw new BusinessException("Please wait " + Math.max(1, waitSeconds) + " seconds before requesting another verification link.");
                        }
                    }
                });
        String rawToken = UUID.randomUUID() + "-" + UUID.randomUUID();
        String hash = sha256Hex(rawToken);
        EmailVerificationToken row = new EmailVerificationToken();
        row.setTenantId(tenantId);
        row.setUserId(userId);
        row.setTokenHash(hash);
        row.setExpiresAt(LocalDateTime.now().plusHours(Math.max(1, properties.getTokenTtlHours())));
        row.setIsDeleted(false);
        tokenRepository.save(row);

        if (properties.isExposePlainTokenInApiResponse()) {
            log.warn("Email verification token for userId={} tenant={} (dev only): {}", userId, tenantId, rawToken);
        } else {
            log.info("Email verification token issued userId={} tenant={}", userId, tenantId);
        }
        auditTrailPort.logAction(
                Enums.AuditAction.UPDATE,
                "AUTH",
                "Email verification link requested for user " + userId,
                userId,
                "USER",
                null,
                user.getEmail());

        AuthDTOs.EmailVerificationRequestResponse res = new AuthDTOs.EmailVerificationRequestResponse();
        res.setMessage("Verification link has been prepared. In production this is sent by email.");
        if (properties.isExposePlainTokenInApiResponse()) {
            res.setDevOneTimeToken(rawToken);
        }
        return res;
    }

    @Transactional
    public AuthDTOs.UserProfile confirmToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new BusinessException("Token is required");
        }
        String hash = sha256Hex(rawToken.trim());
        EmailVerificationToken row = tokenRepository
                .findFirstByTokenHashAndIsDeletedFalseAndConsumedAtIsNullOrderByIdDesc(hash)
                .orElseThrow(() -> new BusinessException("Invalid or expired verification token"));
        if (row.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Verification token has expired. Request a new one.");
        }
        String tenantId = row.getTenantId();
        String priorTenant = TenantContext.getTenantId();
        try {
            TenantContext.setTenantId(tenantId);
            User user = userRepository.findByIdAndTenantIdAndIsDeletedFalse(row.getUserId(), tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", row.getUserId()));
            user.setEmailVerified(true);
            userRepository.save(user);
            row.setConsumedAt(LocalDateTime.now());
            tokenRepository.save(row);
            log.info("Email verified userId={} tenant={}", user.getId(), tenantId);
            auditTrailPort.logAction(
                    Enums.AuditAction.UPDATE,
                    "AUTH",
                    "Email verified for user " + user.getId(),
                    user.getId(),
                    "USER",
                    null,
                    user.getEmail());
            return toProfile(user);
        } finally {
            TenantContext.setTenantId(priorTenant);
        }
    }

    private static AuthDTOs.UserProfile toProfile(User user) {
        return AuthDTOs.UserProfile.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name().toLowerCase())
                .tenantId(user.getTenantId())
                .avatar(user.getAvatar())
                .interfaceLocale(com.school.erp.common.locale.InterfaceLocale.orDefault(user.getPreferredLocale()))
                .emailVerified(Boolean.TRUE.equals(user.getEmailVerified()))
                .phoneVerified(Boolean.TRUE.equals(user.getPhoneVerified()))
                .build();
    }

    private static String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
