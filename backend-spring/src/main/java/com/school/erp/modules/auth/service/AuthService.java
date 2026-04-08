package com.school.erp.modules.auth.service;

import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.DuplicateResourceException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.exception.UnauthorizedException;
import com.school.erp.modules.auth.dto.AuthDTOs;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
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

    @Transactional(readOnly = true)
    public AuthDTOs.LoginResponse login(AuthDTOs.LoginRequest request) {
        User user = userRepository.findByEmailAndSchoolCodeAndIsDeletedFalse(
                        request.getEmail(), request.getSchoolCode())
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials or school code"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid credentials or school code");
        }

        if (!user.getIsActive()) {
            throw new BusinessException("Account is deactivated. Contact admin.");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getTenantId(),
                user.getEmail(), user.getRole().name(), user.getName());

        return AuthDTOs.LoginResponse.builder()
                .token(token)
                .user(toProfile(user))
                .build();
    }

    @Transactional
    public AuthDTOs.UserProfile register(AuthDTOs.RegisterRequest request) {
        if (userRepository.existsByEmailAndTenantId(request.getEmail(), request.getTenantId())) {
            throw new DuplicateResourceException("Email already registered in this school");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(request.getRole() != null ? request.getRole() : com.school.erp.common.enums.Enums.Role.PARENT)
                .schoolCode(request.getSchoolCode())
                .build();
        user.setTenantId(request.getTenantId());
        user.setIsActive(true);
        user.setIsDeleted(false);

        userRepository.save(user);
        log.info("User registered: {} in tenant {}", user.getEmail(), user.getTenantId());
        return toProfile(user);
    }

    @Transactional(readOnly = true)
    public AuthDTOs.UserProfile getProfile() {
        String tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();
        User user = userRepository.findByIdAndTenantIdAndIsDeletedFalse(userId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        return toProfile(user);
    }

    private AuthDTOs.UserProfile toProfile(User user) {
        return AuthDTOs.UserProfile.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name().toLowerCase())
                .tenantId(user.getTenantId())
                .avatar(user.getAvatar())
                .build();
    }
}
