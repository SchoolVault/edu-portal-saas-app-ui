package com.school.erp.modules.auth.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Locale;
import java.util.Optional;

/**
 * Creates or reuses portal {@link User} rows for bulk onboarding (parents, teachers, library staff).
 */
@Service
public class PortalUserProvisioningService {
    private static final String ALPHANUM = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final TenantConfigRepository tenantConfigRepository;
    private final PasswordEncoder passwordEncoder;

    public PortalUserProvisioningService(UserRepository userRepository,
                                       TenantConfigRepository tenantConfigRepository,
                                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.tenantConfigRepository = tenantConfigRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public record ProvisionResult(Long userId, String plainPassword, boolean createdNew) {
    }

    @Transactional
    public ProvisionResult ensureParentUser(String tenantId, String email, String name, String phone) {
        return ensureUser(tenantId, email, name, phone, Enums.Role.PARENT);
    }

    @Transactional
    public ProvisionResult ensureStaffUser(String tenantId, String email, String name, String phone, Enums.Role role) {
        if (role != Enums.Role.TEACHER && role != Enums.Role.LIBRARY_STAFF) {
            throw new IllegalArgumentException("Unsupported portal role: " + role);
        }
        return ensureUser(tenantId, email, name, phone, role);
    }

    private ProvisionResult ensureUser(String tenantId, String email, String name, String phone, Enums.Role role) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        Optional<User> existing = userRepository.findByEmailAndTenantIdAndIsDeletedFalse(normalizedEmail, tenantId);
        if (existing.isPresent()) {
            User u = existing.get();
            if (u.getRole() != role) {
                throw new com.school.erp.common.exception.BusinessException(
                        "Email already registered with a different role in this school: " + normalizedEmail);
            }
            return new ProvisionResult(u.getId(), null, false);
        }
        String schoolCode = tenantConfigRepository.findByTenantId(tenantId)
                .map(c -> c.getSchoolCode())
                .orElseThrow(() -> new com.school.erp.common.exception.ResourceNotFoundException("Tenant settings not found"));
        String plain = randomPassword(12);
        User user = User.builder()
                .name(name != null && !name.isBlank() ? name.trim() : normalizedEmail)
                .email(normalizedEmail)
                .password(passwordEncoder.encode(plain))
                .phone(phone != null ? phone.trim() : null)
                .role(role)
                .schoolCode(schoolCode)
                .build();
        user.setTenantId(tenantId);
        user.setIsActive(true);
        user.setIsDeleted(false);
        userRepository.save(user);
        return new ProvisionResult(user.getId(), plain, true);
    }

    private static String randomPassword(int len) {
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) {
            sb.append(ALPHANUM.charAt(RANDOM.nextInt(ALPHANUM.length())));
        }
        return sb.toString();
    }
}
