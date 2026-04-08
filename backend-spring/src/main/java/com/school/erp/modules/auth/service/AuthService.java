package com.school.erp.modules.auth.service;

import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.DuplicateResourceException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.exception.UnauthorizedException;
import com.school.erp.modules.auth.dto.AuthDTOs;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.audit.service.AuditService;
import com.school.erp.security.JwtUtil;
import com.school.erp.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public AuthDTOs.LoginResponse login(AuthDTOs.LoginRequest request) {
        User user = userRepository.findByEmailAndSchoolCodeAndIsDeletedFalse(request.getEmail(), request.getSchoolCode())
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials or school code"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword()))
            throw new UnauthorizedException("Invalid credentials or school code");
        if (!user.getIsActive()) throw new BusinessException("Account is deactivated. Contact admin.");

        String token = jwtUtil.generateToken(user.getId(), user.getTenantId(), user.getEmail(), user.getRole().name(), user.getName());
        String refreshToken = "refresh-" + token.substring(token.length() - 20);

        // Log login
        try {
            TenantContext.setTenantId(user.getTenantId());
            TenantContext.setUserId(user.getId());
            auditService.logLogin(user.getEmail());
        } catch (Exception e) { log.debug("Audit log skipped: {}", e.getMessage()); }

        return AuthDTOs.LoginResponse.builder().token(token).refreshToken(refreshToken).user(toProfile(user)).build();
    }

    @Transactional
    public AuthDTOs.UserProfile register(AuthDTOs.RegisterRequest request) {
        if (userRepository.existsByEmailAndTenantId(request.getEmail(), request.getTenantId()))
            throw new DuplicateResourceException("Email already registered in this school");
        User user = User.builder()
                .name(request.getName()).email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(request.getRole() != null ? request.getRole() : com.school.erp.common.enums.Enums.Role.PARENT)
                .schoolCode(request.getSchoolCode()).build();
        user.setTenantId(request.getTenantId()); user.setIsActive(true); user.setIsDeleted(false);
        userRepository.save(user);
        log.info("User registered: {} role={} tenant={}", user.getEmail(), user.getRole(), user.getTenantId());
        return toProfile(user);
    }

    @Transactional(readOnly = true)
    public AuthDTOs.UserProfile getProfile() {
        User user = userRepository.findByIdAndTenantIdAndIsDeletedFalse(TenantContext.getUserId(), TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("User", TenantContext.getUserId()));
        return toProfile(user);
    }

    @Transactional
    public AuthDTOs.UserProfile updateProfile(AuthDTOs.UpdateProfileRequest request) {
        User user = userRepository.findByIdAndTenantIdAndIsDeletedFalse(TenantContext.getUserId(), TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("User", TenantContext.getUserId()));
        if (request.getName() != null) user.setName(request.getName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getAvatar() != null) user.setAvatar(request.getAvatar());
        userRepository.save(user);
        return toProfile(user);
    }

    @Transactional
    public void changePassword(AuthDTOs.ChangePasswordRequest request) {
        User user = userRepository.findByIdAndTenantIdAndIsDeletedFalse(TenantContext.getUserId(), TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("User", TenantContext.getUserId()));
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword()))
            throw new BusinessException("Current password is incorrect");
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed for user: {}", user.getEmail());
    }

    @Transactional
    public AuthDTOs.TokenResponse refreshToken(AuthDTOs.RefreshTokenRequest request) {
        // In production: validate refresh token from DB/Redis
        // For now: extract user from the refresh token pattern
        String email = TenantContext.getTenantId() != null ? 
            userRepository.findByIdAndTenantIdAndIsDeletedFalse(TenantContext.getUserId(), TenantContext.getTenantId())
                .map(User::getEmail).orElse(null) : null;
        if (email == null) throw new UnauthorizedException("Invalid refresh token");
        User user = userRepository.findByEmailAndTenantIdAndIsDeletedFalse(email, TenantContext.getTenantId())
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));
        String newToken = jwtUtil.generateToken(user.getId(), user.getTenantId(), user.getEmail(), user.getRole().name(), user.getName());
        return AuthDTOs.TokenResponse.builder().token(newToken).refreshToken(request.getRefreshToken()).build();
    }

    private AuthDTOs.UserProfile toProfile(User user) {
        return AuthDTOs.UserProfile.builder()
                .id(user.getId()).name(user.getName()).email(user.getEmail()).phone(user.getPhone())
                .role(user.getRole().name().toLowerCase()).tenantId(user.getTenantId()).avatar(user.getAvatar()).build();
    }
}
