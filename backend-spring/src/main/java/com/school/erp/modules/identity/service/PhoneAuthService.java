package com.school.erp.modules.identity.service;

import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.UnauthorizedException;
import com.school.erp.common.locale.InterfaceLocale;
import com.school.erp.modules.auth.dto.AuthDTOs;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.auth.service.AuthService;
import com.school.erp.modules.identity.dto.PhoneAuthDTOs;
import com.school.erp.modules.identity.entity.OtpVerification;
import com.school.erp.modules.identity.enums.OtpStatus;
import com.school.erp.modules.identity.repository.OtpVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;

/**
 * Completes phone OTP login: validates exchange token from {@link OtpService}, issues same session as password login.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PhoneAuthService {

    private final OtpVerificationRepository otpVerificationRepository;
    private final UserRepository userRepository;
    private final SchoolCodeTenantResolver schoolCodeTenantResolver;
    private final AuthService authService;

    @Value("${app.otp.exchange.ttl.seconds:600}")
    private long exchangeTtlSeconds;

    @Transactional
    public AuthDTOs.LoginResponse loginWithOtpExchange(PhoneAuthDTOs.PhoneLoginRequest request) {
        String schoolCode = request.getSchoolCode().trim().toUpperCase(Locale.ROOT);
        String phone = request.getPhone().trim();
        String token = request.getVerificationToken().trim();

        String tenantId = schoolCodeTenantResolver.resolveTenantId(schoolCode);
        schoolCodeTenantResolver.resolveWorkspace(schoolCode).ifPresent(workspace -> {
            if (Boolean.TRUE.equals(workspace.getIsDeleted()) || !Boolean.TRUE.equals(workspace.getIsActive())) {
                throw new BusinessException("This school workspace is suspended or closed. Contact support.");
            }
        });

        OtpVerification otp = otpVerificationRepository
                .findByExchangeTokenAndPhoneAndTenantIdAndIsDeletedFalse(token, phone, tenantId)
                .orElseThrow(() -> new UnauthorizedException("Invalid or expired verification. Request a new OTP."));

        if (otp.getStatus() != OtpStatus.VERIFIED || otp.getVerifiedAt() == null) {
            throw new UnauthorizedException("Invalid or expired verification. Request a new OTP.");
        }
        if (otp.getVerifiedAt().isBefore(LocalDateTime.now().minusSeconds(exchangeTtlSeconds))) {
            throw new UnauthorizedException("Verification expired. Request a new OTP.");
        }

        User user = userRepository.findByPhoneAndSchoolCodeAndIsDeletedFalse(phone, schoolCode)
                .orElseThrow(() -> new UnauthorizedException("No account for this phone and school code"));
        if (!user.getTenantId().equals(tenantId)) {
            throw new UnauthorizedException("No account for this phone and school code");
        }
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new BusinessException("Account is deactivated. Contact admin.");
        }

        otp.setExchangeToken(null);
        otpVerificationRepository.save(otp);

        String locale = InterfaceLocale.normalize(request.getInterfaceLocale());
        return authService.issueSessionAfterSuccessfulAuth(user, locale);
    }
}
