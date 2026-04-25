package com.school.erp.modules.auth.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.DuplicateResourceException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.util.InternationalPhone;
import com.school.erp.common.util.PhoneNormalization;
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

    /**
     * Parent onboarding for bulk import: prefers email when present; otherwise matches/creates by verified mobile within tenant.
     */
    @Transactional
    public ProvisionResult ensureParentUserForImport(String tenantId, String name, String email, String phone) {
        String normPhone = PhoneNormalization.trimToNull(phone);
        if (normPhone == null) {
            throw new BusinessException("parentphone is required to create or link a parent portal user");
        }
        Optional<User> byPhone = userRepository.findByPhoneAndTenantIdAndIsDeletedFalse(normPhone, tenantId);
        if (byPhone.isPresent()) {
            User u = byPhone.get();
            if (u.getRole() != Enums.Role.PARENT) {
                throw new BusinessException("This mobile number is already registered with a different role in this school");
            }
            String normalizedEmail = email != null ? email.trim().toLowerCase(Locale.ROOT) : null;
            // Phone is the household source-of-truth; attach email only when account does not already have one.
            if (normalizedEmail != null && !normalizedEmail.isBlank() && (u.getEmail() == null || u.getEmail().isBlank())) {
                if (userRepository.existsByEmailAndTenantIdAndIsDeletedFalse(normalizedEmail, tenantId)) {
                    throw new DuplicateResourceException("User email already exists in this school: " + normalizedEmail);
                }
                u.setEmail(normalizedEmail);
                userRepository.save(u);
            }
            return new ProvisionResult(u.getId(), null, false);
        }
        String normalizedEmail = email != null ? email.trim().toLowerCase(Locale.ROOT) : null;
        if (normalizedEmail != null && !normalizedEmail.isBlank()) {
            if (userRepository.existsByEmailAndTenantIdAndIsDeletedFalse(normalizedEmail, tenantId)) {
                throw new DuplicateResourceException("User email already exists in this school: " + normalizedEmail);
            }
        }
        String schoolCode = tenantConfigRepository.findByTenantId(tenantId)
                .map(c -> c.getSchoolCode())
                .orElseThrow(() -> new ResourceNotFoundException("Tenant settings not found"));
        String plain = randomPassword(12);
        User user = User.builder()
                .name(name != null && !name.isBlank() ? name.trim() : "Parent")
                .email(null)
                .password(passwordEncoder.encode(plain))
                .phone(normPhone)
                .role(Enums.Role.PARENT)
                .schoolCode(schoolCode)
                .build();
        user.setTenantId(tenantId);
        user.setIsActive(true);
        user.setIsDeleted(false);
        userRepository.save(user);
        boolean disclosePassword = normalizedEmail != null && !normalizedEmail.isBlank();
        return new ProvisionResult(user.getId(), disclosePassword ? plain : null, true);
    }

    @Transactional
    public ProvisionResult ensureStaffUser(String tenantId, String email, String name, String phone, Enums.Role role) {
        if (role != Enums.Role.TEACHER && role != Enums.Role.LIBRARY_STAFF) {
            throw new IllegalArgumentException("Unsupported portal role: " + role);
        }
        return ensureUser(tenantId, email, name, phone, role);
    }

    /**
     * Import-safe staff provisioning.
     * - mobile is mandatory (used for OTP login)
     * - email is optional (enables email/password login when present)
     * - when {@code importPassword} is provided, it becomes the login password
     */
    @Transactional
    public ProvisionResult ensureStaffUserForImport(
            String tenantId,
            String email,
            String name,
            String phone,
            Enums.Role role,
            String importPassword) {
        if (role != Enums.Role.TEACHER && role != Enums.Role.LIBRARY_STAFF) {
            throw new IllegalArgumentException("Unsupported portal role: " + role);
        }
        String canonicalPhone = InternationalPhone.canonical(phone != null ? phone.trim() : null);
        if (canonicalPhone == null) {
            throw new BusinessException(InternationalPhone.invalidMessage());
        }
        String normalizedEmail = email != null ? email.trim().toLowerCase(Locale.ROOT) : null;
        String explicitPassword = importPassword != null ? importPassword.trim() : null;
        if (explicitPassword != null && explicitPassword.isEmpty()) {
            explicitPassword = null;
        }
        if (normalizedEmail != null && normalizedEmail.isBlank()) {
            normalizedEmail = null;
        }
        if (normalizedEmail != null) {
            Optional<User> byEmail = userRepository.findByEmailAndTenantIdAndIsDeletedFalse(normalizedEmail, tenantId);
            if (byEmail.isPresent()) {
                User user = byEmail.get();
                if (user.getRole() != role) {
                    throw new BusinessException("Email already registered with a different role in this school: " + normalizedEmail);
                }
                if (!canonicalPhone.equals(user.getPhone()) && userRepository.existsByPhoneAndTenantIdAndIsDeletedFalse(canonicalPhone, tenantId)) {
                    throw new DuplicateResourceException("This mobile number is already registered for this school workspace");
                }
                user.setPhone(canonicalPhone);
                if (explicitPassword != null) {
                    user.setPassword(passwordEncoder.encode(explicitPassword));
                }
                userRepository.save(user);
                return new ProvisionResult(user.getId(), explicitPassword, false);
            }
        }
        Optional<User> byPhone = userRepository.findByPhoneAndTenantIdAndIsDeletedFalse(canonicalPhone, tenantId);
        if (byPhone.isPresent()) {
            User user = byPhone.get();
            if (user.getRole() != role) {
                throw new BusinessException("This mobile number is already registered with a different role in this school");
            }
            if (normalizedEmail != null && user.getEmail() == null) {
                if (userRepository.existsByEmailAndTenantIdAndIsDeletedFalse(normalizedEmail, tenantId)) {
                    throw new DuplicateResourceException("User email already exists in this school: " + normalizedEmail);
                }
                user.setEmail(normalizedEmail);
            }
            if (explicitPassword != null) {
                user.setPassword(passwordEncoder.encode(explicitPassword));
            }
            userRepository.save(user);
            return new ProvisionResult(user.getId(), explicitPassword, false);
        }
        String schoolCode = tenantConfigRepository.findByTenantId(tenantId)
                .map(c -> c.getSchoolCode())
                .orElseThrow(() -> new ResourceNotFoundException("Tenant settings not found"));
        String storedPassword = explicitPassword != null ? explicitPassword : randomPassword(12);
        User user = User.builder()
                .name(name != null && !name.isBlank() ? name.trim() : "Staff")
                .email(normalizedEmail)
                .password(passwordEncoder.encode(storedPassword))
                .phone(canonicalPhone)
                .role(role)
                .schoolCode(schoolCode)
                .build();
        user.setTenantId(tenantId);
        user.setIsActive(true);
        user.setIsDeleted(false);
        userRepository.save(user);
        // Never disclose auto-generated passwords; only return an explicit import password to callers.
        return new ProvisionResult(user.getId(), explicitPassword, true);
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
        String normPhone = PhoneNormalization.trimToNull(phone);
        if (normPhone != null && userRepository.existsByPhoneAndTenantIdAndIsDeletedFalse(normPhone, tenantId)) {
            throw new DuplicateResourceException("This mobile number is already registered for this school workspace");
        }
        String plain = randomPassword(12);
        User user = User.builder()
                .name(name != null && !name.isBlank() ? name.trim() : normalizedEmail)
                .email(normalizedEmail)
                .password(passwordEncoder.encode(plain))
                .phone(normPhone)
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
