package com.school.erp.modules.auth.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.locale.InterfaceLocale;
import com.school.erp.common.util.InternationalPhone;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.DuplicateResourceException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.exception.UnauthorizedException;
import com.school.erp.modules.auth.dto.AuthDTOs;
import com.school.erp.modules.auth.dto.AuthManagementDTOs;
import com.school.erp.modules.auth.dto.AuthPersonalProfileDTOs;
import com.school.erp.modules.auth.dto.AuthProfileDTOs;
import com.school.erp.modules.auth.dto.UserPreferencesRequest;
import com.school.erp.modules.auth.entity.RefreshToken;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.RefreshTokenRepository;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.platform.port.AuditTrailPort;
import com.school.erp.modules.academic.entity.ClassTeacherAssignment;
import com.school.erp.modules.academic.entity.AcademicYear;
import com.school.erp.modules.academic.entity.Section;
import com.school.erp.modules.academic.entity.SchoolClass;
import com.school.erp.modules.academic.repository.AcademicYearRepository;
import com.school.erp.modules.academic.repository.ClassTeacherAssignmentRepository;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
import com.school.erp.modules.academic.repository.SectionRepository;
import com.school.erp.modules.settings.entity.TenantConfig;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.modules.guardian.service.GuardianService;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.modules.timetable.repository.TimetableRepository;
import com.school.erp.security.JwtUtil;
import com.school.erp.tenant.TenantContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuthService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AuthService.class);
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final TenantConfigRepository tenantConfigRepository;
    private final GuardianService guardianService;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SectionRepository sectionRepository;
    private final AcademicYearRepository academicYearRepository;
    private final ClassTeacherAssignmentRepository classTeacherAssignmentRepository;
    private final TimetableRepository timetableRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuditTrailPort auditTrailPort;

    @Transactional
    public AuthDTOs.LoginResponse login(AuthDTOs.LoginRequest request) {
        String schoolCode = request.getSchoolCode().trim().toUpperCase(Locale.ROOT);
        log.debug("Login attempt schoolCode={}", schoolCode);
        User user;
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            String canonicalPhone = InternationalPhone.canonical(request.getPhone().trim());
            if (canonicalPhone == null) {
                throw new BusinessException(InternationalPhone.invalidMessage());
            }
            user = userRepository
                    .findFirstBySchoolCodeAndPhoneInAndIsDeletedFalseOrderByIdAsc(
                            schoolCode, InternationalPhone.compatibleLookupKeys(canonicalPhone))
                    .orElseThrow(() -> new UnauthorizedException("Invalid credentials or school code"));
        } else {
            user = userRepository.findByEmailAndSchoolCodeAndIsDeletedFalse(request.getEmail().trim().toLowerCase(Locale.ROOT), schoolCode)
                    .orElseThrow(() -> new UnauthorizedException("Invalid credentials or school code"));
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid credentials or school code");
        }
        if (!user.getIsActive()) {
            throw new BusinessException("Account is deactivated. Contact admin.");
        }
        if (user.getRole() != Enums.Role.SUPER_ADMIN) {
            TenantConfig workspace = tenantConfigRepository.findByTenantId(user.getTenantId())
                    .orElseThrow(() -> new BusinessException("School workspace is not available."));
            if (Boolean.TRUE.equals(workspace.getIsDeleted()) || !Boolean.TRUE.equals(workspace.getIsActive())) {
                throw new BusinessException("This school workspace is suspended or closed. Contact support.");
            }
        }
        return issueSessionAfterSuccessfulAuth(user, InterfaceLocale.normalize(request.getInterfaceLocale()));
    }

    /**
     * Issues JWT + refresh and profile after password or OTP verification (shared by {@link #login} and phone OTP flow).
     */
    @Transactional
    public AuthDTOs.LoginResponse issueSessionAfterSuccessfulAuth(User user, String interfaceLocaleFromClient) {
        String subject = JwtUtil.principalSubject(user.getEmail(), user.getPhone(), user.getId());
        String token = jwtUtil.generateToken(user.getId(), user.getTenantId(), subject, user.getRole().name(), user.getName(), resolveJwtPermissions(user));
        String refreshToken = issueRefreshToken(user);
        try {
            TenantContext.setTenantId(user.getTenantId());
            TenantContext.setUserId(user.getId());
            TenantContext.setUserRole(user.getRole() != null ? user.getRole().name() : null);
            TenantContext.setUserDisplayName(user.getName());
            String auditLoginKey = user.getEmail() != null && !user.getEmail().isBlank() ? user.getEmail() : subject;
            TenantContext.setUserPrincipal(auditLoginKey);
            auditTrailPort.logLogin(auditLoginKey);
        } catch (Exception e) {
            log.debug("Audit log skipped: {}", e.getMessage());
        }
        log.info("Login successful userId={} tenantId={} role={}", user.getId(), user.getTenantId(), user.getRole());
        if (interfaceLocaleFromClient != null) {
            user.setPreferredLocale(interfaceLocaleFromClient);
            userRepository.save(user);
        }
        return AuthDTOs.LoginResponse.builder().token(token).refreshToken(refreshToken).user(toProfile(user)).build();
    }

    @Transactional
    public AuthDTOs.UserProfile register(AuthDTOs.RegisterRequest request) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) throw new UnauthorizedException("Tenant context not found");
        if (userRepository.existsByEmailAndTenantId(request.getEmail(), tenantId)) throw new DuplicateResourceException("Email already registered in this school");
        String regPhone = request.getPhone() == null || request.getPhone().isBlank()
                ? null
                : InternationalPhone.canonical(request.getPhone().trim());
        if (request.getPhone() != null && !request.getPhone().isBlank() && regPhone == null) {
            throw new BusinessException(InternationalPhone.invalidMessage());
        }
        if (regPhone != null) {
            for (String key : InternationalPhone.compatibleLookupKeys(regPhone)) {
                if (userRepository.existsByPhoneAndTenantIdAndIsDeletedFalse(key, tenantId)) {
                    throw new DuplicateResourceException("This mobile number is already registered in this school");
                }
            }
        }
        TenantConfig tenantConfig = tenantConfigRepository.findByTenantId(tenantId).orElseThrow(() -> new ResourceNotFoundException("Tenant settings not configured"));
        User user = User.builder().name(request.getName()).email(request.getEmail()).password(passwordEncoder.encode(request.getPassword())).phone(regPhone).role(request.getRole() != null ? request.getRole() : com.school.erp.common.enums.Enums.Role.PARENT).schoolCode(tenantConfig.getSchoolCode()).build();
        user.setTenantId(tenantId);
        user.setIsActive(true);
        user.setIsDeleted(false);
        userRepository.save(user);
        log.info("User registered: {} role={} tenant={}", user.getEmail(), user.getRole(), user.getTenantId());
        return toProfile(user);
    }

    @Transactional
    public AuthDTOs.LoginResponse onboardTenant(AuthManagementDTOs.OnboardTenantRequest request) {
        TenantAndAdminCreated created = createTenantAndAdminAccount(request);
        User admin = created.admin();
        String subject = JwtUtil.principalSubject(admin.getEmail(), admin.getPhone(), admin.getId());
        String token = jwtUtil.generateToken(admin.getId(), admin.getTenantId(), subject, admin.getRole().name(), admin.getName(), jwtPermissionsCsv(admin.getRole()));
        String refreshToken = issueRefreshToken(admin);
        return AuthDTOs.LoginResponse.builder().token(token).refreshToken(refreshToken).user(toProfile(admin)).build();
    }

    /**
     * Super-admin safe onboarding path: creates tenant + first admin account without issuing a login session.
     */
    @Transactional
    public OnboardTenantResult onboardTenantWithoutLogin(AuthManagementDTOs.OnboardTenantRequest request) {
        TenantAndAdminCreated created = createTenantAndAdminAccount(request);
        return new OnboardTenantResult(toProfile(created.admin()), created.academicYearId());
    }

    private TenantAndAdminCreated createTenantAndAdminAccount(AuthManagementDTOs.OnboardTenantRequest request) {
        log.info("Onboarding tenant schoolCode={}", request.getSchoolCode());
        String normalizedSchoolCode = request.getSchoolCode().trim().toUpperCase(Locale.ROOT);
        if (tenantConfigRepository.existsBySchoolCode(normalizedSchoolCode)) {
            log.warn("Onboard rejected: school code already exists {}", normalizedSchoolCode);
            throw new DuplicateResourceException("School code already in use");
        }
        String tenantId = buildTenantId(normalizedSchoolCode);

        String adminPhone = InternationalPhone.canonical(request.getPhone().trim());
        if (adminPhone == null) {
            throw new BusinessException(InternationalPhone.invalidMessage());
        }
        for (String key : InternationalPhone.compatibleLookupKeys(adminPhone)) {
            if (userRepository.existsByPhoneAndTenantIdAndIsDeletedFalse(key, tenantId)) {
                throw new DuplicateResourceException("This mobile number is already registered in this school");
            }
        }

        TenantConfig config = new TenantConfig();
        config.setTenantId(tenantId);
        config.setSchoolName(request.getSchoolName().trim());
        config.setSchoolCode(normalizedSchoolCode);
        config.setAddress(request.getAddress());
        config.setPhone(adminPhone);
        config.setEmail(request.getAdminEmail());
        config.setPrimaryColor("#1B3A30");
        config.setSecondaryColor("#C05C3D");
        config.setFeaturesJson("{\"student\":true,\"teacher\":true,\"attendance\":true,\"fees\":true,"
                + "\"directory\":true,\"payroll\":true,\"communication\":true,\"audit\":true,"
                + "\"chat\":false,\"transport\":false,\"hostel\":false,\"library\":false,"
                + "\"operationsHub\":false,\"importExport\":false,\"exams\":false,\"documents\":false,"
                + "\"reports\":false,\"leave\":false}");
        tenantConfigRepository.save(config);

        String adminEmailRaw = request.getAdminEmail() == null ? "" : request.getAdminEmail().trim();
        String adminEmail = adminEmailRaw.isEmpty() ? syntheticAdminEmail(normalizedSchoolCode, adminPhone) : adminEmailRaw.toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailAndTenantId(adminEmail, tenantId)) {
            throw new DuplicateResourceException("Email already registered in this school");
        }

        User admin = User.builder()
                .name(request.getAdminName().trim())
                .email(adminEmail)
                .password(passwordEncoder.encode(request.getAdminPassword()))
                .phone(adminPhone)
                .role(com.school.erp.common.enums.Enums.Role.ADMIN)
                .schoolCode(normalizedSchoolCode)
                .preferredLocale(com.school.erp.common.locale.InterfaceLocale.orDefault(request.getInterfaceLocale()))
                .build();
        admin.setTenantId(tenantId);
        admin.setIsActive(true);
        admin.setIsDeleted(false);
        admin.setAuthProvider("PHONE");
        userRepository.save(admin);
        AcademicYear academicYear = createInitialAcademicYear(tenantId, request);
        log.info("Tenant onboarded tenantId={} schoolCode={} adminUserId={}", tenantId, normalizedSchoolCode, admin.getId());
        return new TenantAndAdminCreated(tenantId, normalizedSchoolCode, admin, academicYear.getId());
    }

    private AcademicYear createInitialAcademicYear(String tenantId, AuthManagementDTOs.OnboardTenantRequest request) {
        LocalDate start = request.getAcademicYearStartDate();
        LocalDate end = request.getAcademicYearEndDate();
        if (start == null || end == null) {
            LocalDate now = LocalDate.now();
            int startYear = now.getMonthValue() >= 4 ? now.getYear() : now.getYear() - 1;
            start = LocalDate.of(startYear, 4, 1);
            end = LocalDate.of(startYear + 1, 3, 31);
        }
        if (!end.isAfter(start)) {
            throw new BusinessException("Academic year end date must be after start date.");
        }
        String normalizedName = request.getAcademicYearName() != null && !request.getAcademicYearName().isBlank()
                ? request.getAcademicYearName().trim()
                : (start.getYear() + "-" + end.getYear());
        AcademicYear ay = AcademicYear.builder()
                .name(normalizedName)
                .startDate(start)
                .endDate(end)
                .isCurrent(true)
                .build();
        ay.setTenantId(tenantId);
        return academicYearRepository.save(ay);
    }

    private record TenantAndAdminCreated(String tenantId, String schoolCode, User admin, Long academicYearId) {}
    public record OnboardTenantResult(AuthDTOs.UserProfile user, Long academicYearId) {}

    @Transactional(readOnly = true)
    public AuthDTOs.UserProfile getProfile() {
        Long uid = TenantContext.getUserId();
        log.debug("Loading auth profile userId={}", uid);
        User user = userRepository.findByIdAndTenantIdAndIsDeletedFalse(uid, TenantContext.getTenantId()).orElseThrow(() -> new ResourceNotFoundException("User", uid));
        return toProfile(user);
    }

    @Transactional(readOnly = true)
    public AuthProfileDTOs.ProfileSummaryResponse getProfileSummary() {
        String tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();
        User user = userRepository.findByIdAndTenantIdAndIsDeletedFalse(userId, tenantId).orElseThrow(() -> new ResourceNotFoundException("User", userId));
        TenantConfig config = tenantConfigRepository.findByTenantId(tenantId).orElse(null);

        AuthProfileDTOs.ProfileSummaryResponse response = new AuthProfileDTOs.ProfileSummaryResponse();
        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setPhone(user.getPhone());
        response.setRole(user.getRole() != null ? user.getRole().name().toLowerCase() : "");
        response.setTenantId(user.getTenantId());
        response.setAvatar(user.getAvatar());
        response.setInterfaceLocale(InterfaceLocale.orDefault(user.getPreferredLocale()));
        if (config != null) {
            response.setSchoolName(config.getSchoolName());
            response.setSchoolCode(config.getSchoolCode());
            response.setSchoolEmail(config.getEmail());
            response.setSchoolPhone(config.getPhone());
            response.setSchoolAddress(config.getAddress());
            response.setPrimaryColor(config.getPrimaryColor());
            response.setSecondaryColor(config.getSecondaryColor());
        }

        switch (user.getRole()) {
            case SUPER_ADMIN -> {
                response.setUserTitle("Platform super administrator");
                response.setSchoolName("SchoolVault platform operations");
                response.setSchoolCode("PLATFORM");
                response.setSchoolEmail("platform@schoolvault.edu");
                response.setPrimaryColor("#0F172A");
                response.setSecondaryColor("#0EA5E9");
                response.setPlatformWorkspaceCount((int) tenantConfigRepository.findAll().stream()
                        .filter(c -> !Boolean.TRUE.equals(c.getIsDeleted()))
                        .count());
            }
            case ADMIN -> {
                response.setUserTitle("School Administrator");
                response.setManagedStudentCount(studentRepository.countByTenantIdAndIsDeletedFalse(tenantId));
                response.setManagedTeacherCount(teacherRepository.countByTenantIdAndIsDeletedFalse(tenantId));
            }
            case TEACHER -> teacherRepository.findByTenantIdAndUserIdAndIsDeletedFalse(tenantId, userId)
                    .ifPresent(teacher -> applyTeacherProfileShell(tenantId, teacher, response));
            case PARENT -> {
                response.setUserTitle("Parent Account");
                long linkedChildren = guardianService.findStudentsForParentUser(tenantId, userId).stream()
                        .filter(s -> s.getStatus() == Enums.StudentStatus.ACTIVE)
                        .count();
                response.setChildCount(linkedChildren);
            }
            case LIBRARY_STAFF -> response.setUserTitle("Library Staff");
            default -> response.setUserTitle("School User");
        }
        return response;
    }

    @Transactional
    public AuthDTOs.UserProfile updatePreferences(UserPreferencesRequest request) {
        String tag = InterfaceLocale.normalize(request.getInterfaceLocale());
        if (tag == null) {
            throw new BusinessException("Unsupported interface language. Supported: en, hi.");
        }
        User user = userRepository.findByIdAndTenantIdAndIsDeletedFalse(TenantContext.getUserId(), TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("User", TenantContext.getUserId()));
        user.setPreferredLocale(tag);
        userRepository.save(user);
        log.info("User preferences updated userId={} interfaceLocale={}", user.getId(), tag);
        return toProfile(user);
    }

    @Transactional
    public AuthDTOs.UserProfile updateProfile(AuthDTOs.UpdateProfileRequest request) {
        String tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();
        User user = userRepository.findByIdAndTenantIdAndIsDeletedFalse(userId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        if (request.getName() != null) {
            String name = request.getName().trim();
            if (name.isBlank()) {
                throw new BusinessException("Name cannot be empty.");
            }
            user.setName(name);
        }
        if (request.getPhone() != null) {
            String canonicalPhone = request.getPhone().isBlank() ? null : InternationalPhone.canonical(request.getPhone().trim());
            if (!request.getPhone().isBlank() && canonicalPhone == null) {
                throw new BusinessException(InternationalPhone.invalidMessage());
            }
            if (canonicalPhone != null) {
                ensurePhoneNotUsedByAnotherUser(tenantId, userId, canonicalPhone);
            }
            user.setPhone(canonicalPhone);
        }
        if (request.getAvatar() != null) {
            user.setAvatar(trimToNull(request.getAvatar()));
        }
        if (user.getRole() == Enums.Role.TEACHER) {
            teacherRepository.findByTenantIdAndUserIdAndIsDeletedFalse(tenantId, userId).ifPresent(teacher -> {
                if (request.getPhone() != null) {
                    teacher.setPhone(user.getPhone());
                }
                if (request.getAvatar() != null) {
                    teacher.setAvatar(user.getAvatar());
                }
                teacherRepository.save(teacher);
            });
        }
        userRepository.save(user);
        return toProfile(user);
    }

    @Transactional(readOnly = true)
    public AuthPersonalProfileDTOs.PersonalProfileResponse getPersonalProfileDetails() {
        User user = userRepository.findByIdAndTenantIdAndIsDeletedFalse(TenantContext.getUserId(), TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("User", TenantContext.getUserId()));
        return toPersonalProfile(user);
    }

    @Transactional
    public AuthPersonalProfileDTOs.PersonalProfileResponse updatePersonalProfileDetails(AuthPersonalProfileDTOs.UpdatePersonalProfileRequest request) {
        String tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();
        User user = userRepository.findByIdAndTenantIdAndIsDeletedFalse(userId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (request.getName() != null) {
            String name = request.getName().trim();
            if (name.isBlank()) {
                throw new BusinessException("Name cannot be empty.");
            }
            user.setName(name);
        }
        if (request.getAvatar() != null) {
            user.setAvatar(trimToNull(request.getAvatar()));
        }
        if (request.getPhone() != null) {
            String canonicalPhone = request.getPhone().isBlank() ? null : InternationalPhone.canonical(request.getPhone().trim());
            if (!request.getPhone().isBlank() && canonicalPhone == null) {
                throw new BusinessException(InternationalPhone.invalidMessage());
            }
            if (canonicalPhone != null) {
                ensurePhoneNotUsedByAnotherUser(tenantId, userId, canonicalPhone);
            }
            user.setPhone(canonicalPhone);
        }

        if (user.getRole() == Enums.Role.TEACHER) {
            var teacher = teacherRepository.findByTenantIdAndUserIdAndIsDeletedFalse(tenantId, userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Teacher profile", userId));
            if (request.getQualification() != null) {
                teacher.setQualification(trimToNull(request.getQualification()));
            }
            if (request.getSpecialization() != null) {
                teacher.setSpecialization(trimToNull(request.getSpecialization()));
            }
            if (request.getBankAccountHolder() != null) {
                teacher.setBankAccountHolder(trimToNull(request.getBankAccountHolder()));
            }
            if (request.getBankName() != null) {
                teacher.setBankName(trimToNull(request.getBankName()));
            }
            if (request.getBankAccountNumber() != null) {
                teacher.setBankAccountNumber(trimToNull(request.getBankAccountNumber()));
            }
            if (request.getBankIfsc() != null) {
                teacher.setBankIfsc(trimToNull(request.getBankIfsc()));
            }
            if (request.getPhone() != null) {
                teacher.setPhone(user.getPhone());
            }
            if (request.getAvatar() != null) {
                teacher.setAvatar(user.getAvatar());
            }
            teacherRepository.save(teacher);
        }

        userRepository.save(user);
        return toPersonalProfile(user);
    }

    @Transactional
    public void changePassword(AuthDTOs.ChangePasswordRequest request) {
        User user = userRepository.findByIdAndTenantIdAndIsDeletedFalse(TenantContext.getUserId(), TenantContext.getTenantId()).orElseThrow(() -> new ResourceNotFoundException("User", TenantContext.getUserId()));
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) throw new BusinessException("Current password is incorrect");
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed for user: {}", user.getEmail());
    }

    @Transactional
    public AuthDTOs.TokenResponse refreshToken(AuthDTOs.RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByTokenAndIsDeletedFalse(request.getRefreshToken()).orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));
        if (!refreshToken.isActive()) throw new UnauthorizedException("Refresh token expired or revoked");
        User user = userRepository.findByIdAndTenantIdAndIsDeletedFalse(refreshToken.getUserId(), refreshToken.getTenantId()).orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));
        revokeToken(refreshToken);
        String subject = JwtUtil.principalSubject(user.getEmail(), user.getPhone(), user.getId());
        String newToken = jwtUtil.generateToken(user.getId(), user.getTenantId(), subject, user.getRole().name(), user.getName(), resolveJwtPermissions(user));
        String newRefreshToken = issueRefreshToken(user);
        return AuthDTOs.TokenResponse.builder().token(newToken).refreshToken(newRefreshToken).build();
    }

    @Transactional
    public void logout(String token) {
        refreshTokenRepository.findByTokenAndIsDeletedFalse(token).ifPresent(this::revokeToken);
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
                .interfaceLocale(InterfaceLocale.orDefault(user.getPreferredLocale()))
                .build();
    }

    private AuthPersonalProfileDTOs.PersonalProfileResponse toPersonalProfile(User user) {
        AuthPersonalProfileDTOs.PersonalProfileResponse out = new AuthPersonalProfileDTOs.PersonalProfileResponse();
        out.setId(user.getId());
        out.setName(user.getName());
        out.setEmail(user.getEmail());
        out.setPhone(user.getPhone());
        out.setRole(user.getRole() != null ? user.getRole().name().toLowerCase() : "");
        out.setTenantId(user.getTenantId());
        out.setAvatar(user.getAvatar());
        out.setInterfaceLocale(InterfaceLocale.orDefault(user.getPreferredLocale()));

        if (user.getRole() == Enums.Role.TEACHER) {
            teacherRepository.findByTenantIdAndUserIdAndIsDeletedFalse(user.getTenantId(), user.getId()).ifPresent(t -> {
                out.setQualification(t.getQualification());
                out.setSpecialization(t.getSpecialization());
                out.setBankAccountHolder(t.getBankAccountHolder());
                out.setBankName(t.getBankName());
                out.setBankAccountNumber(t.getBankAccountNumber());
                out.setBankIfsc(t.getBankIfsc());
            });
            out.setEditableScopes(List.of("name", "phone", "avatar", "qualification", "specialization", "bank"));
        } else if (user.getRole() == Enums.Role.PARENT || user.getRole() == Enums.Role.ADMIN || user.getRole() == Enums.Role.SUPER_ADMIN) {
            out.setEditableScopes(List.of("name", "phone", "avatar"));
        } else {
            out.setEditableScopes(List.of("name", "avatar"));
        }
        return out;
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private void ensurePhoneNotUsedByAnotherUser(String tenantId, Long currentUserId, String canonicalPhone) {
        for (String key : InternationalPhone.compatibleLookupKeys(canonicalPhone)) {
            User existing = userRepository.findByPhoneAndTenantIdAndIsDeletedFalse(key, tenantId).orElse(null);
            if (existing != null && !Objects.equals(existing.getId(), currentUserId)) {
                throw new DuplicateResourceException("This mobile number is already registered in this school");
            }
        }
    }

    private String issueRefreshToken(User user) {
        refreshTokenRepository.findByTenantIdAndUserIdAndIsDeletedFalse(user.getTenantId(), user.getId()).forEach(this::revokeToken);
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setTenantId(user.getTenantId());
        refreshToken.setUserId(user.getId());
        refreshToken.setToken(UUID.randomUUID().toString() + UUID.randomUUID());
        refreshToken.setExpiresAt(LocalDateTime.now().plusDays(7));
        refreshToken.setIsActive(true);
        refreshToken.setIsDeleted(false);
        refreshTokenRepository.save(refreshToken);
        return refreshToken.getToken();
    }

    private void revokeToken(RefreshToken token) {
        token.setRevokedAt(LocalDateTime.now());
        token.setIsActive(false);
        token.setIsDeleted(true);
        refreshTokenRepository.save(token);
    }

    private String resolveJwtPermissions(User user) {
        String csv = jwtPermissionsCsv(user.getRole());
        if (user.getRole() != Enums.Role.TEACHER || user.getTenantId() == null || user.getTenantId().isBlank()) {
            return csv;
        }
        return teacherRepository.findByTenantIdAndUserIdAndIsDeletedFalse(user.getTenantId(), user.getId())
                .filter(t -> t.getLibraryStaffRole() != null)
                .map(t -> appendPermissionCsv(csv, "LIBRARY_MANAGE,LIBRARY_CIRCULATION"))
                .orElse(csv);
    }

    private static String appendPermissionCsv(String existing, String add) {
        if (add == null || add.isBlank()) {
            return existing != null ? existing : "";
        }
        if (existing == null || existing.isBlank()) {
            return add;
        }
        return existing + "," + add;
    }

    private static String jwtPermissionsCsv(Enums.Role role) {
        if (role == null) {
            return "";
        }
        return switch (role) {
            case LIBRARY_STAFF -> "LIBRARY_MANAGE,LIBRARY_CIRCULATION";
            case ADMIN -> "TENANT_ADMIN";
            case SUPER_ADMIN -> "PLATFORM_ADMIN";
            case TEACHER, PARENT, STUDENT -> "";
        };
    }

    private String buildTenantId(String schoolCode) {
        return "tenant_" + schoolCode.toLowerCase(Locale.ROOT) + "_" + UUID.randomUUID().toString().substring(0, 8);
    }

    private static String syntheticAdminEmail(String schoolCode, String phoneRaw) {
        String digits = phoneRaw == null ? "" : phoneRaw.replaceAll("\\D+", "");
        if (digits.isEmpty()) {
            digits = "nophone";
        }
        return digits + "." + schoolCode.toLowerCase(Locale.ROOT) + "@phone.schoolvault.local";
    }

    public AuthService(
            final UserRepository userRepository,
            final RefreshTokenRepository refreshTokenRepository,
            final TenantConfigRepository tenantConfigRepository,
            final GuardianService guardianService,
            final StudentRepository studentRepository,
            final TeacherRepository teacherRepository,
            final SchoolClassRepository schoolClassRepository,
            final SectionRepository sectionRepository,
            final AcademicYearRepository academicYearRepository,
            final ClassTeacherAssignmentRepository classTeacherAssignmentRepository,
            final TimetableRepository timetableRepository,
            final PasswordEncoder passwordEncoder,
            final JwtUtil jwtUtil,
            final AuditTrailPort auditTrailPort) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.tenantConfigRepository = tenantConfigRepository;
        this.guardianService = guardianService;
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.sectionRepository = sectionRepository;
        this.academicYearRepository = academicYearRepository;
        this.classTeacherAssignmentRepository = classTeacherAssignmentRepository;
        this.timetableRepository = timetableRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.auditTrailPort = auditTrailPort;
    }

    /**
     * Teacher shell card: timetable breadth + homeroom rows from {@link ClassTeacherAssignment} (section-aware),
     * aligned with dashboard / reports. Header UI uses {@link AuthProfileDTOs.ProfileSummaryResponse#getClassTeacherOf()}
     * and {@link AuthProfileDTOs.ProfileSummaryResponse#getPrimaryTeachingSubject()}.
     */
    private void applyTeacherProfileShell(String tenantId, com.school.erp.modules.teacher.entity.Teacher teacher, AuthProfileDTOs.ProfileSummaryResponse response) {
        response.setQualification(teacher.getQualification());
        response.setSpecialization(teacher.getSpecialization());
        if (teacher.getSpecialization() != null && !teacher.getSpecialization().isBlank()) {
            response.setPrimaryTeachingSubject(teacher.getSpecialization().trim());
        } else if (teacher.getSubjects() != null && !teacher.getSubjects().isEmpty()) {
            response.setPrimaryTeachingSubject(teacher.getSubjects().get(0));
        }
        response.setSubjectCount(teacher.getSubjects() != null ? (long) teacher.getSubjects().size() : 0L);

        var schedule = timetableRepository.findByTenantIdAndTeacherIdAndIsDeletedFalse(tenantId, teacher.getId());
        Set<Long> classIds = schedule.stream()
                .map(e -> e.getClassId())
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        response.setAssignedClassCount((long) classIds.size());
        Set<Long> studentIds = new HashSet<>();
        for (Long cid : classIds) {
            studentRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, cid).forEach(s -> studentIds.add(s.getId()));
        }
        response.setAssignedStudentCount((long) studentIds.size());

        LocalDate today = LocalDate.now();
        Map<Long, String> classNames = schoolClassRepository.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId).stream()
                .collect(Collectors.toMap(SchoolClass::getId, SchoolClass::getName, (a, b) -> a));
        Map<Long, String> sectionNames = schoolClassRepository.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId).stream()
                .flatMap(cls -> sectionRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, cls.getId()).stream())
                .collect(Collectors.toMap(s -> s.getId(), s -> s.getName(), (a, b) -> a));

        Long currentAyId = academicYearRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream()
                .filter(y -> Boolean.TRUE.equals(y.getIsCurrent()))
                .findFirst()
                .map(y -> y.getId())
                .orElse(null);

        List<AuthProfileDTOs.ClassTeacherAssignment> rows = new ArrayList<>();
        if (currentAyId != null) {
            for (ClassTeacherAssignment a : classTeacherAssignmentRepository.findActiveForTeacher(tenantId, teacher.getId(), today)) {
                if (!currentAyId.equals(a.getAcademicYearId())) {
                    continue;
                }
                AuthProfileDTOs.ClassTeacherAssignment row = new AuthProfileDTOs.ClassTeacherAssignment();
                row.setClassId(a.getClassId() != null ? String.valueOf(a.getClassId()) : null);
                row.setClassName(classNames.getOrDefault(a.getClassId(), ""));
                if (a.getSectionId() != null) {
                    row.setSectionId(String.valueOf(a.getSectionId()));
                    row.setSectionName(sectionNames.getOrDefault(a.getSectionId(), ""));
                    long headcount = studentRepository.findByTenantIdAndClassIdAndSectionIdAndIsDeletedFalse(tenantId, a.getClassId(), a.getSectionId()).size();
                    row.setTotalStudents(headcount);
                } else {
                    row.setSectionId(null);
                    row.setSectionName(null);
                    row.setTotalStudents(studentRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, a.getClassId()).size());
                }
                rows.add(row);
            }
        }
        if (rows.isEmpty()) {
            for (SchoolClass sc : schoolClassRepository.findByTenantIdAndClassTeacherIdAndIsDeletedFalse(tenantId, teacher.getId())) {
                if (!sectionRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, sc.getId()).isEmpty()) {
                    continue;
                }
                AuthProfileDTOs.ClassTeacherAssignment row = new AuthProfileDTOs.ClassTeacherAssignment();
                row.setClassId(sc.getId() != null ? String.valueOf(sc.getId()) : null);
                row.setClassName(sc.getName());
                row.setSectionId(null);
                row.setSectionName(null);
                row.setTotalStudents(studentRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, sc.getId()).size());
                rows.add(row);
            }
            for (Section sec : sectionRepository.findByTenantIdAndClassTeacherIdAndIsDeletedFalse(tenantId, teacher.getId())) {
                SchoolClass sc = schoolClassRepository.findByIdAndTenantIdAndIsDeletedFalse(sec.getClassId(), tenantId).orElse(null);
                AuthProfileDTOs.ClassTeacherAssignment row = new AuthProfileDTOs.ClassTeacherAssignment();
                row.setClassId(sec.getClassId() != null ? String.valueOf(sec.getClassId()) : null);
                row.setClassName(sc != null ? sc.getName() : "");
                row.setSectionId(sec.getId() != null ? String.valueOf(sec.getId()) : null);
                row.setSectionName(sec.getName());
                row.setTotalStudents(studentRepository.findByTenantIdAndClassIdAndSectionIdAndIsDeletedFalse(tenantId, sec.getClassId(), sec.getId()).size());
                rows.add(row);
            }
        }
        if (!rows.isEmpty()) {
            response.setClassTeacherOf(rows);
        }
    }
}
