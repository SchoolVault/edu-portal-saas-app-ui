package com.school.erp.modules.teacher.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.DuplicateResourceException;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.importer.BulkImportRowPolicy;
import com.school.erp.common.importer.ImportLineOutcome;
import com.school.erp.common.importer.LineApplyResult;
import com.school.erp.common.importer.ZipCsvImportUtil;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.util.InternationalPhone;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.auth.service.PortalUserProvisioningService;
import com.school.erp.modules.notification.service.NotificationService;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.modules.academic.entity.SchoolClass;
import com.school.erp.modules.academic.entity.Section;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
import com.school.erp.modules.academic.repository.SectionRepository;
import com.school.erp.common.jpa.EntitySnapshotCollections;
import com.school.erp.modules.rbac.entity.UserSchoolRoleAssignment;
import com.school.erp.modules.rbac.repository.UserSchoolRoleAssignmentRepository;
import com.school.erp.modules.teacher.dto.TeacherDTOs;
import com.school.erp.modules.teacher.entity.Teacher;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.modules.reports.service.DashboardSnapshotInvalidationService;
import com.school.erp.modules.timetable.service.TimetableService;
import com.school.erp.cache.CacheService;
import com.school.erp.config.CacheConfig;
import com.school.erp.platform.port.NotificationDispatchPort;
import com.school.erp.platform.port.NotificationDispatchAttributes;
import com.school.erp.tenant.TenantContext;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Objects;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TeacherService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(TeacherService.class);
    private final TeacherRepository repo;
    private final SchoolClassRepository schoolClassRepository;
    private final SectionRepository sectionRepository;
    private final PortalUserProvisioningService portalUserProvisioningService;
    private final UserRepository userRepository;
    private final UserSchoolRoleAssignmentRepository userSchoolRoleAssignmentRepository;
    private final NotificationService notificationService;
    private final NotificationDispatchPort notificationDispatchPort;
    private final TenantConfigRepository tenantConfigRepository;
    private final ObjectProvider<CacheService> cacheService;
    private final ObjectProvider<TimetableService> timetableService;
    private final DashboardSnapshotInvalidationService dashboardSnapshotInvalidationService;

    @Cacheable(cacheNames = CacheConfig.TEACHER_DIRECTORY, keyGenerator = "tenantMethodParamsKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public PageResponse<TeacherDTOs.Response> getTeachers(int page, int size, String search, String status, String subject) {
        String tenantId = TenantContext.getTenantId();
        String q = search == null ? "" : search.trim();
        // Exact catalog/display name match on teacher_subjects (not substring); see TeacherRepository.
        String subjectFilter = subject == null || subject.isBlank() ? null : subject.trim();
        Enums.TeacherStatus statusFilter = null;
        if (status != null && !status.isBlank()) {
            try {
                statusFilter = Enums.TeacherStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
            } catch (Exception ignored) {
                statusFilter = null;
            }
        }
        log.debug("Listing teachers page={} size={} searchPresent={} status={} subject={}", page, size, !q.isEmpty(), statusFilter, subjectFilter);
        Page<Teacher> result = repo.findByTenantIdAndSearchAndStatusAndSubjectExcludingPortalRoles(
                tenantId,
                q,
                statusFilter,
                subjectFilter,
                List.of(Enums.Role.SCHOOL_STAFF, Enums.Role.LIBRARY_STAFF),
                PageRequest.of(page, size, Sort.by("firstName")));
        log.info("Teachers page loaded page={} returned={} total={}", page, result.getNumberOfElements(), result.getTotalElements());
        Map<Long, List<String>> homeroomByTeacher = homeroomClassNamesByTeacherId(tenantId);
        return PageResponse.of(result.getContent().stream()
                .map(t -> applyAudienceVisibility(toRes(t, homeroomByTeacher.getOrDefault(t.getId(), List.of()))))
                .collect(Collectors.toList()), page, size, result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public PageResponse<TeacherDTOs.Response> getStaff(int page, int size, String search, String status) {
        String tenantId = TenantContext.getTenantId();
        String q = search == null ? "" : search.trim();
        Enums.TeacherStatus statusFilter = null;
        if (status != null && !status.isBlank()) {
            try {
                statusFilter = Enums.TeacherStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
            } catch (Exception ignored) {
                statusFilter = null;
            }
        }
        Page<Teacher> result = repo.findStaffByTenantIdAndSearchAndStatus(
                tenantId,
                q,
                statusFilter,
                List.of(Enums.Role.SCHOOL_STAFF, Enums.Role.LIBRARY_STAFF),
                PageRequest.of(page, size, Sort.by("firstName")));
        Map<Long, List<String>> homeroomByTeacher = homeroomClassNamesByTeacherId(tenantId);
        return PageResponse.of(result.getContent().stream()
                .map(t -> applyAudienceVisibility(toRes(t, homeroomByTeacher.getOrDefault(t.getId(), List.of()))))
                .collect(Collectors.toList()), page, size, result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public TeacherDTOs.Response getById(Long id) {
        log.debug("Fetching teacher id={}", id);
        String tenantId = TenantContext.getTenantId();
        Teacher t = repo.findByIdAndTenantIdAndIsDeletedFalse(id, tenantId).orElseThrow(() -> new ResourceNotFoundException("Teacher", id));
        TeacherDTOs.Response r = applyAudienceVisibility(toRes(t, homeroomClassNamesForTeacher(tenantId, t.getId())));
        log.info("Teacher loaded id={}", id);
        return r;
    }

    @Transactional
    public TeacherDTOs.Response create(TeacherDTOs.CreateRequest req) {
        log.info("Creating teacher email={}", req.getEmail());
        String tenantId = TenantContext.getTenantId();
        String email = req.getEmail() != null ? req.getEmail().trim().toLowerCase(Locale.ROOT) : null;
        if (email == null || email.isBlank()) {
            throw new BusinessException("email is required");
        }
        String nationalPhone = InternationalPhone.nationalIndiaMobile10(req.getPhone() != null ? req.getPhone().trim() : null);
        if (nationalPhone == null) {
            throw new BusinessException(InternationalPhone.importPhoneInvalidMessage());
        }
        List<String> phoneKeys = InternationalPhone.compatibleLookupKeys("+91-" + nationalPhone);
        if (repo.existsByTenantIdAndEmailAndIsDeletedFalse(tenantId, email)) {
            throw new DuplicateResourceException("Teacher email already exists: " + email);
        }
        if (repo.existsByTenantIdAndPhoneInAndIsDeletedFalse(tenantId, phoneKeys)) {
            throw new DuplicateResourceException("Teacher phone already exists: " + nationalPhone);
        }
        Teacher t = Teacher.builder()
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .email(email)
                .phone(nationalPhone)
                .qualification(req.getQualification())
                .specialization(req.getSpecialization())
                .joinDate(req.getJoinDate())
                .salary(req.getSalary())
                .subjects(req.getSubjects())
                .status(Enums.TeacherStatus.ACTIVE)
                .build();
        t.setBankAccountHolder(trimToNull(req.getBankAccountHolder()));
        t.setBankName(trimToNull(req.getBankName()));
        t.setBankAccountNumber(trimToNull(req.getBankAccountNumber()));
        t.setBankIfsc(normalizeIfsc(req.getBankIfsc()));
        t.setTenantId(tenantId);
        repo.save(t);
        String display = (req.getFirstName() + " " + req.getLastName()).trim();
        PortalUserProvisioningService.ProvisionResult provision = portalUserProvisioningService.ensureStaffUserForImport(
                tenantId,
                email,
                display,
                nationalPhone,
                Enums.Role.TEACHER,
                null);
        t.setUserId(provision.userId());
        repo.save(t);
        sendTeacherPortalCredentialsNotification(tenantId, provision.userId(), email, nationalPhone);
        if (provision.createdNew()) {
            notifyAdminsOnTeacherOnboarding(tenantId);
        }
        log.info("Teacher created id={}", t.getId());
        evictTeacherDirectoryCache();
        return toRes(t, List.of());
    }

    /**
     * Bulk import path: optional portal user (teacher or library staff) linked to {@code teachers.user_id}.
     */
    @Transactional
    public TeacherDTOs.Response createForBulkImport(TeacherDTOs.CreateRequest req, boolean createPortal,
                                                     Enums.Role portalRole, Enums.LibraryStaffRole libraryStaffRole) {
        String tenantId = TenantContext.getTenantId();
        String employeeCode = normalizeEmployeeCode(req.getEmployeeCode());
        String email = req.getEmail() != null ? req.getEmail().trim().toLowerCase(java.util.Locale.ROOT) : null;
        if (email != null && email.isBlank()) {
            email = null;
        }
        String importPhone = InternationalPhone.nationalIndiaMobile10(req.getPhone() != null ? req.getPhone().trim() : null);
        if (importPhone == null) {
            throw new BusinessException(InternationalPhone.importPhoneInvalidMessage());
        }
        List<String> phoneKeys = InternationalPhone.importPhoneLookupKeys(importPhone);
        if (email != null && repo.existsByTenantIdAndEmailAndIsDeletedFalse(tenantId, email)) {
            throw new DuplicateResourceException("Teacher email already exists: " + email);
        }
        if (repo.existsByTenantIdAndPhoneInAndIsDeletedFalse(tenantId, phoneKeys)) {
            throw new DuplicateResourceException("Teacher phone already exists: " + importPhone);
        }
        if (employeeCode != null && repo.existsByTenantIdAndEmployeeCodeAndIsDeletedFalse(tenantId, employeeCode)) {
            throw new DuplicateResourceException("Teacher employee code already exists: " + employeeCode);
        }
        Teacher t = Teacher.builder()
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .email(email)
                .phone(importPhone)
                .qualification(req.getQualification())
                .specialization(req.getSpecialization())
                .joinDate(req.getJoinDate())
                .salary(req.getSalary())
                .subjects(req.getSubjects() != null ? req.getSubjects() : List.of())
                .status(Enums.TeacherStatus.ACTIVE)
                .build();
        t.setEmployeeCode(employeeCode);
        t.setBankAccountHolder(trimToNull(req.getBankAccountHolder()));
        t.setBankName(trimToNull(req.getBankName()));
        t.setBankAccountNumber(trimToNull(req.getBankAccountNumber()));
        t.setBankIfsc(normalizeIfsc(req.getBankIfsc()));
        if (libraryStaffRole != null) {
            t.setLibraryStaffRole(libraryStaffRole);
        }
        t.setTenantId(tenantId);
        repo.save(t);
        if (createPortal) {
            String display = req.getFirstName() + " " + req.getLastName();
            PortalUserProvisioningService.ProvisionResult pr = portalUserProvisioningService.ensureStaffUser(
                    tenantId, email, display.trim(), importPhone, portalRole);
            t.setUserId(pr.userId());
            repo.save(t);
        }
        log.info("Teacher bulk row created id={} portalLinked={}", t.getId(), createPortal);
        evictTeacherDirectoryCache();
        return toRes(t, List.of());
    }

    /**
     * Idempotent teacher/staff import: update existing teacher row by immutable employee code first,
     * then email/phone fallbacks when older data lacks employee code.
     */
    @Transactional
    public LineApplyResult<TeacherDTOs.Response> upsertTeacherForImport(TeacherDTOs.CreateRequest req, boolean createPortal,
                                                                       Enums.Role portalRole, Enums.LibraryStaffRole libraryStaffRole,
                                                                       BulkImportRowPolicy policy,
                                                                       String portalLoginEmail,
                                                                       String portalLoginPhone,
                                                                       String importPassword) {
        String tenantId = TenantContext.getTenantId();
        String employeeCode = normalizeEmployeeCode(req.getEmployeeCode());
        String email = req.getEmail() != null ? req.getEmail().trim().toLowerCase(Locale.ROOT) : null;
        if (email != null && email.isBlank()) {
            email = null;
        }
        String importPhone = InternationalPhone.nationalIndiaMobile10(req.getPhone() != null ? req.getPhone().trim() : null);
        if (importPhone == null) {
            throw new BusinessException(InternationalPhone.importPhoneInvalidMessage());
        }
        List<String> importPhoneKeys = InternationalPhone.importPhoneLookupKeys(importPhone);
        String naturalKey = employeeCode != null ? "EMPLOYEE_CODE:" + employeeCode : "PHONE:" + importPhone;
        Optional<Teacher> existing = resolveExistingTeacherForImport(tenantId, employeeCode, email, importPhoneKeys);
        if (existing.isEmpty()) {
            TeacherDTOs.Response created = createForBulkImport(req, false, portalRole, libraryStaffRole);
            if (createPortal) {
                Long createdTeacherId = created.getId();
                Teacher teacher = repo.findByIdAndTenantIdAndIsDeletedFalse(createdTeacherId, tenantId)
                        .orElseThrow(() -> new ResourceNotFoundException("Teacher", createdTeacherId));
                String display = (teacher.getFirstName() + " " + teacher.getLastName()).trim();
                PortalUserProvisioningService.ProvisionResult pr = portalUserProvisioningService.ensureStaffUserForImport(
                        tenantId, portalLoginEmail, display, portalLoginPhone, portalRole, importPassword);
                teacher.setUserId(pr.userId());
                repo.save(teacher);
                created = applyAudienceVisibility(toRes(teacher, homeroomClassNamesForTeacher(tenantId, teacher.getId())));
            }
            return new LineApplyResult<>(created, ImportLineOutcome.CREATED, naturalKey);
        }
        if (policy == BulkImportRowPolicy.CREATE_ONLY) {
            if (employeeCode != null) {
                throw new DuplicateResourceException("Teacher with this employee code already exists: " + employeeCode);
            }
            throw new DuplicateResourceException("Teacher with this phone already exists: " + importPhone);
        }
        if (policy == BulkImportRowPolicy.SKIP_IF_EXISTS) {
            Teacher teacher = existing.get();
            if (createPortal) {
                String display = (teacher.getFirstName() + " " + teacher.getLastName()).trim();
                PortalUserProvisioningService.ProvisionResult pr = portalUserProvisioningService.ensureStaffUserForImport(
                        tenantId, portalLoginEmail, display, portalLoginPhone, portalRole, importPassword);
                teacher.setUserId(pr.userId());
                repo.save(teacher);
            }
            return new LineApplyResult<>(
                    applyAudienceVisibility(toRes(teacher, homeroomClassNamesForTeacher(tenantId, teacher.getId()))),
                    ImportLineOutcome.SKIPPED, naturalKey);
        }
        if (policy == BulkImportRowPolicy.UPSERT) {
            Teacher teacher = existing.get();
            String previousEmail = teacher.getEmail();
            teacher.setFirstName(req.getFirstName());
            teacher.setLastName(req.getLastName());
            if (employeeCode != null) {
                repo.findByTenantIdAndEmployeeCodeAndIsDeletedFalse(tenantId, employeeCode).ifPresent(existingByCode -> {
                    if (!existingByCode.getId().equals(teacher.getId())) {
                        throw new DuplicateResourceException("Teacher employee code already exists: " + employeeCode);
                    }
                });
                teacher.setEmployeeCode(employeeCode);
            }
            if (req.getEmail() != null) {
                String normalizedEmail = req.getEmail().trim().toLowerCase(Locale.ROOT);
                repo.findByTenantIdAndEmailIgnoreCaseAndIsDeletedFalse(tenantId, normalizedEmail).ifPresent(existingByEmail -> {
                    if (!existingByEmail.getId().equals(teacher.getId())) {
                        throw new DuplicateResourceException("Teacher email already exists: " + normalizedEmail);
                    }
                });
                teacher.setEmail(normalizedEmail);
            }
            teacher.setPhone(importPhone);
            teacher.setQualification(req.getQualification());
            teacher.setSpecialization(req.getSpecialization());
            teacher.setJoinDate(req.getJoinDate());
            teacher.setSalary(req.getSalary());
            teacher.setSubjects(req.getSubjects());
            // ERP-style UPSERT: importing the same teacher should reactivate lifecycle by default.
            teacher.setIsActive(true);
            teacher.setStatus(Enums.TeacherStatus.ACTIVE);
            teacher.setBankAccountHolder(trimToNull(req.getBankAccountHolder()));
            teacher.setBankName(trimToNull(req.getBankName()));
            teacher.setBankAccountNumber(trimToNull(req.getBankAccountNumber()));
            teacher.setBankIfsc(normalizeIfsc(req.getBankIfsc()));
            if (libraryStaffRole != null) {
                teacher.setLibraryStaffRole(libraryStaffRole);
            } else if (portalRole == Enums.Role.TEACHER) {
                teacher.setLibraryStaffRole(null);
            }
            try {
                repo.save(teacher);
                syncLinkedPortalUserIdentity(tenantId, teacher, previousEmail);
                propagateTeacherDisplayNameToHomeroomFkRows(tenantId, teacher);
                timetableService.ifAvailable(ts -> ts.refreshDenormalizedTeacherNames(teacher.getId()));
            } catch (DataIntegrityViolationException ex) {
                throw new BusinessException("Duplicate contact values are not allowed for this school.");
            }
            TeacherDTOs.Response updated = applyAudienceVisibility(toRes(teacher, homeroomClassNamesForTeacher(tenantId, teacher.getId())));
            if (createPortal) {
                Long updatedTeacherId = updated.getId();
                Teacher refreshed = repo.findByIdAndTenantIdAndIsDeletedFalse(updatedTeacherId, tenantId)
                        .orElseThrow(() -> new ResourceNotFoundException("Teacher", updatedTeacherId));
                String display = (refreshed.getFirstName() + " " + refreshed.getLastName()).trim();
                PortalUserProvisioningService.ProvisionResult pr = portalUserProvisioningService.ensureStaffUserForImport(
                        tenantId, portalLoginEmail, display, portalLoginPhone, portalRole, importPassword);
                if (refreshed.getUserId() == null || !refreshed.getUserId().equals(pr.userId())) {
                    refreshed.setUserId(pr.userId());
                    repo.save(refreshed);
                }
                updated = applyAudienceVisibility(toRes(refreshed, homeroomClassNamesForTeacher(tenantId, refreshed.getId())));
            }
            return new LineApplyResult<>(updated, ImportLineOutcome.UPDATED, naturalKey);
        }
        throw new IllegalStateException("Unhandled import policy: " + policy);
    }

    @Transactional
    public TeacherDTOs.Response update(Long id, TeacherDTOs.UpdateRequest req) {
        log.info("Updating teacher id={}", id);
        String tenantId = TenantContext.getTenantId();
        String actorRole = TenantContext.getUserRole();
        Teacher t = repo.findByIdAndTenantIdAndIsDeletedFalse(id, tenantId).orElseThrow(() -> new ResourceNotFoundException("Teacher", id));
        if (isAdminActor(actorRole) && hasSensitiveAdminEdit(req, t)) {
            throw new BusinessException(
                    "Admins can update school-assignment fields only. Contact details and bank details can be updated only by the teacher via their own profile."
            );
        }
        String previousEmail = t.getEmail();
        if (req.getFirstName() != null) t.setFirstName(req.getFirstName());
        if (req.getLastName() != null) t.setLastName(req.getLastName());
        if (req.getEmail() != null) {
            String normalizedEmail = req.getEmail().trim().toLowerCase(Locale.ROOT);
            repo.findByTenantIdAndEmailIgnoreCaseAndIsDeletedFalse(tenantId, normalizedEmail).ifPresent(existing -> {
                if (!existing.getId().equals(t.getId())) {
                    throw new DuplicateResourceException("Teacher email already exists: " + normalizedEmail);
                }
            });
            t.setEmail(normalizedEmail);
        }
        if (req.getPhone() != null) {
            String raw = req.getPhone().trim();
            if (raw.isEmpty()) {
                t.setPhone(null);
            } else {
                String nationalPhone = InternationalPhone.nationalIndiaMobile10(raw);
                if (nationalPhone == null) {
                    throw new BusinessException(InternationalPhone.importPhoneInvalidMessage());
                }
                t.setPhone(nationalPhone);
            }
        }
        if (req.getQualification() != null) t.setQualification(req.getQualification());
        if (req.getSpecialization() != null) t.setSpecialization(req.getSpecialization());
        if (req.getJoinDate() != null) t.setJoinDate(req.getJoinDate());
        if (req.getSalary() != null) t.setSalary(req.getSalary());
        if (req.getSubjects() != null) t.setSubjects(req.getSubjects());
        if (req.getBankAccountHolder() != null) t.setBankAccountHolder(trimToNull(req.getBankAccountHolder()));
        if (req.getBankName() != null) t.setBankName(trimToNull(req.getBankName()));
        if (req.getBankAccountNumber() != null) t.setBankAccountNumber(trimToNull(req.getBankAccountNumber()));
        if (req.getBankIfsc() != null) t.setBankIfsc(normalizeIfsc(req.getBankIfsc()));
        if (req.getStatus() != null && !req.getStatus().isBlank()) {
            try {
                Enums.TeacherStatus next = Enums.TeacherStatus.valueOf(req.getStatus().trim().toUpperCase(Locale.ROOT));
                t.setStatus(next);
                t.setIsActive(next == Enums.TeacherStatus.ACTIVE);
                if (next == Enums.TeacherStatus.INACTIVE || next == Enums.TeacherStatus.RESIGNED) {
                    clearHomeroomForTeacher(t.getId(), TenantContext.getTenantId());
                }
            } catch (IllegalArgumentException ex) {
                log.warn("Ignoring invalid teacher status on update id={} status={}", id, req.getStatus());
            }
        }
        try {
            repo.save(t);
            syncLinkedPortalUserIdentity(tenantId, t, previousEmail);
            propagateTeacherDisplayNameToHomeroomFkRows(tenantId, t);
            timetableService.ifAvailable(ts -> ts.refreshDenormalizedTeacherNames(t.getId()));
        } catch (DataIntegrityViolationException ex) {
            throw new BusinessException("Duplicate contact values are not allowed for this school.");
        } catch (DuplicateResourceException | BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Teacher update failed id={} tenant={} msg={}", id, tenantId, ex.getMessage(), ex);
            throw new BusinessException("Could not update teacher details right now. Please retry.");
        }
        log.info("Teacher updated id={}", id);
        evictTeacherDirectoryCache();
        return toRes(t, homeroomClassNamesForTeacher(tenantId, t.getId()));
    }

    /**
     * Denormalized {@code class_teacher_name} on classes/sections — keep in sync when the teacher's display name changes.
     */
    private void propagateTeacherDisplayNameToHomeroomFkRows(String tenantId, Teacher teacher) {
        if (teacher.getId() == null) {
            return;
        }
        String label = (teacher.getFirstName() + " " + teacher.getLastName()).trim();
        if (label.isBlank()) {
            return;
        }
        for (SchoolClass c : schoolClassRepository.findByTenantIdAndClassTeacherIdAndIsDeletedFalse(tenantId, teacher.getId())) {
            if (!label.equals(c.getClassTeacherName())) {
                c.setClassTeacherName(label);
                schoolClassRepository.save(c);
            }
        }
        for (Section sec : sectionRepository.findByTenantIdAndClassTeacherIdAndIsDeletedFalse(tenantId, teacher.getId())) {
            if (!label.equals(sec.getClassTeacherName())) {
                sec.setClassTeacherName(label);
                sectionRepository.save(sec);
            }
        }
    }

    private void syncLinkedPortalUserIdentity(String tenantId, Teacher teacher, String previousEmail) {
        if (teacher.getUserId() == null) {
            return;
        }
        Optional<User> maybeLinkedUser = userRepository.findByIdAndTenantIdAndIsDeletedFalse(teacher.getUserId(), tenantId);
        if (maybeLinkedUser.isEmpty()) {
            log.warn("Skipping portal-user identity sync for teacherId={} userId={} (missing linked user)", teacher.getId(), teacher.getUserId());
            return;
        }
        User linkedUser = maybeLinkedUser.get();
        if (teacher.getEmail() != null && (previousEmail == null || !teacher.getEmail().equalsIgnoreCase(previousEmail))) {
            if (userRepository.existsByEmailAndTenantIdAndIsDeletedFalse(teacher.getEmail(), tenantId)
                    && (linkedUser.getEmail() == null || !teacher.getEmail().equalsIgnoreCase(linkedUser.getEmail()))) {
                throw new DuplicateResourceException("User email already exists in this school: " + teacher.getEmail());
            }
            linkedUser.setEmail(teacher.getEmail());
            linkedUser.setEmailVerified(false);
        }
        String previousPhone = linkedUser.getPhone();
        if (teacher.getPhone() != null && !teacher.getPhone().isBlank()) {
            for (String key : InternationalPhone.portalPhoneLookupKeys(teacher.getPhone())) {
                if (!InternationalPhone.samePortalPhone(key, linkedUser.getPhone())
                        && userRepository.existsByPhoneAndTenantIdAndIsDeletedFalse(key, tenantId)) {
                    throw new DuplicateResourceException("User phone already exists in this school: " + teacher.getPhone());
                }
            }
        }
        linkedUser.setPhone(teacher.getPhone());
        if (teacher.getPhone() != null && !teacher.getPhone().equals(previousPhone)) {
            linkedUser.setPhoneVerified(false);
        }
        String displayName = (teacher.getFirstName() + " " + teacher.getLastName()).trim();
        if (!displayName.isBlank()) {
            linkedUser.setName(displayName);
        }
        userRepository.save(linkedUser);
    }

    private Optional<Teacher> resolveExistingTeacherForImport(
            String tenantId,
            String employeeCode,
            String email,
            List<String> phoneLookupKeys) {
        if (employeeCode != null) {
            Optional<Teacher> byCode = repo.findByTenantIdAndEmployeeCodeAndIsDeletedFalse(tenantId, employeeCode);
            if (byCode.isPresent()) {
                return byCode;
            }
        }
        if (email != null) {
            Optional<Teacher> byEmail = repo.findByTenantIdAndEmailIgnoreCaseAndIsDeletedFalse(tenantId, email);
            if (byEmail.isPresent() && employeeCodesCompatibleForImportMerge(employeeCode, byEmail.get().getEmployeeCode())) {
                return byEmail;
            }
        }
        if (phoneLookupKeys == null || phoneLookupKeys.isEmpty()) {
            return Optional.empty();
        }
        Optional<Teacher> byPhone = repo.findFirstByTenantIdAndPhoneInAndIsDeletedFalseOrderByIdAsc(tenantId, phoneLookupKeys);
        if (byPhone.isPresent() && !employeeCodesCompatibleForImportMerge(employeeCode, byPhone.get().getEmployeeCode())) {
            return Optional.empty();
        }
        return byPhone;
    }

    /**
     * Email/phone merges are for the same person updating contact or backfilling employee_code.
     * If both rows carry different non-empty employee codes, they must stay distinct directory rows
     * (synthetic packs sometimes reuse a display email across multiple codes—merging would overwrite codes
     * and break timetable EMPLOYEE_CODE lookups).
     */
    private static boolean employeeCodesCompatibleForImportMerge(String normalizedIncoming, String rawExisting) {
        String existing = normalizeEmployeeCode(rawExisting);
        if (normalizedIncoming == null || existing == null) {
            return true;
        }
        return normalizedIncoming.equals(existing);
    }

    private static String normalizeEmployeeCode(String rawEmployeeCode) {
        if (rawEmployeeCode == null) {
            return null;
        }
        String normalized = rawEmployeeCode.trim().toUpperCase(Locale.ROOT);
        return normalized.isEmpty() ? null : normalized;
    }

    private static boolean isAdminActor(String role) {
        if (role == null) {
            return false;
        }
        String r = role.trim().toUpperCase(Locale.ROOT);
        return "ADMIN".equals(r) || "SUPER_ADMIN".equals(r);
    }

    /**
     * Admins may change school-assignment fields only. Detects real edits to contact/payroll fields so a full
     * PUT/PATCH body that echoes unchanged bank/contact data does not trip validation.
     */
    private boolean hasSensitiveAdminEdit(TeacherDTOs.UpdateRequest req, Teacher current) {
        boolean emailChanged = req.getEmail() != null
                && !req.getEmail().trim().equalsIgnoreCase(current.getEmail() != null ? current.getEmail().trim() : "");

        boolean phoneChanged = false;
        if (req.getPhone() != null) {
            String rawReq = req.getPhone().trim();
            String curRaw = current.getPhone() == null ? "" : current.getPhone().trim();
            if (rawReq.isEmpty()) {
                phoneChanged = !curRaw.isEmpty();
            } else {
                phoneChanged = !InternationalPhone.samePortalPhone(rawReq, curRaw);
            }
        }

        boolean bankHolderChanged = req.getBankAccountHolder() != null
                && !Objects.equals(trimToNull(req.getBankAccountHolder()), trimToNull(current.getBankAccountHolder()));
        boolean bankNameChanged = req.getBankName() != null
                && !Objects.equals(trimToNull(req.getBankName()), trimToNull(current.getBankName()));
        boolean bankNumberChanged = req.getBankAccountNumber() != null
                && !Objects.equals(trimToNull(req.getBankAccountNumber()), trimToNull(current.getBankAccountNumber()));
        boolean bankIfscChanged = req.getBankIfsc() != null
                && !Objects.equals(normalizeIfsc(req.getBankIfsc()), normalizeIfsc(current.getBankIfsc()));

        return emailChanged || phoneChanged || bankHolderChanged || bankNameChanged || bankNumberChanged || bankIfscChanged;
    }

    @Transactional
    public void delete(Long id) {
        log.warn("Soft-deleting teacher id={}", id);
        String tenantId = TenantContext.getTenantId();
        Teacher t = repo.findByIdAndTenantIdAndIsDeletedFalse(id, tenantId).orElseThrow(() -> new ResourceNotFoundException("Teacher", id));
        clearHomeroomForTeacher(id, tenantId);
        t.markSoftDeleted();
        repo.save(t);
        log.info("Teacher soft-deleted id={}", id);
        evictTeacherDirectoryCache();
    }

    @Transactional
    public TeacherDTOs.Response updateStatus(Long id, String status) {
        String tenantId = TenantContext.getTenantId();
        Teacher t = repo.findByIdAndTenantIdAndIsDeletedFalse(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", id));
        if (status == null || status.isBlank()) {
            throw new BusinessException("status is required");
        }
        Enums.TeacherStatus next;
        try {
            next = Enums.TeacherStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new BusinessException("Invalid status. Use ACTIVE or INACTIVE.");
        }
        t.setStatus(next);
        t.setIsActive(next == Enums.TeacherStatus.ACTIVE);
        if (next == Enums.TeacherStatus.INACTIVE || next == Enums.TeacherStatus.RESIGNED) {
            clearHomeroomForTeacher(id, tenantId);
        }
        repo.save(t);
        evictTeacherDirectoryCache();
        return toRes(t, homeroomClassNamesForTeacher(tenantId, t.getId()));
    }

    private void clearHomeroomForTeacher(Long teacherPk, String tenantId) {
        for (SchoolClass c : schoolClassRepository.findByTenantIdAndClassTeacherIdAndIsDeletedFalse(tenantId, teacherPk)) {
            c.setClassTeacherId(null);
            c.setClassTeacherName(null);
            schoolClassRepository.save(c);
            log.info("Cleared homeroom for classId={} after teacher change teacherPk={}", c.getId(), teacherPk);
        }
        for (Section sec : sectionRepository.findByTenantIdAndClassTeacherIdAndIsDeletedFalse(tenantId, teacherPk)) {
            sec.setClassTeacherId(null);
            sec.setClassTeacherName(null);
            sectionRepository.save(sec);
            log.info("Cleared section homeroom sectionId={} after teacher delete teacherPk={}", sec.getId(), teacherPk);
        }
    }

    @Transactional
    public List<TeacherDTOs.Response> importFromZip(MultipartFile file) {
        log.info("Importing teachers from zip teachers.csv");
        List<TeacherDTOs.Response> imported = ZipCsvImportUtil.readRows(file, "teachers.csv").stream().map(row -> {
            TeacherDTOs.CreateRequest request = new TeacherDTOs.CreateRequest();
            request.setFirstName(required(row, "firstname"));
            request.setLastName(required(row, "lastname"));
            request.setEmail(required(row, "email"));
            request.setPhone(blankToNull(row.get("phone")));
            request.setQualification(blankToNull(row.get("qualification")));
            request.setSpecialization(blankToNull(row.get("specialization")));
            request.setJoinDate(parseDate(row.get("joindate")));
            request.setSalary(parseDecimal(row.get("salary")));
            request.setSubjects(parseSubjects(row.get("subjects")));
            return create(request);
        }).collect(Collectors.toList());
        log.info("Teacher import finished count={}", imported.size());
        return imported;
    }

    public long count() {
        long n = repo.countByTenantIdAndIsDeletedFalse(TenantContext.getTenantId());
        log.debug("Teacher count tenant={} n={}", TenantContext.getTenantId(), n);
        return n;
    }

    /** CSV aligned with bulk import template ({@code teachers.csv} / {@code staff.csv}). */
    @Transactional(readOnly = true)
    public String exportTeachersAsCsv() {
        String tenantId = TenantContext.getTenantId();
        Map<Long, List<String>> homeroomByTeacherId = homeroomClassNamesByTeacherId(tenantId);
        List<Teacher> teachers = repo.findByTenantIdAndIsDeletedFalse(tenantId);
        Map<Long, String> schoolRoleCodesByUserId = buildSchoolRoleCodesCsvByUserId(tenantId, teachers);
        StringBuilder sb = new StringBuilder();
        sb.append("firstname,lastname,email,phone,qualification,specialization,joindate,salary,subjects,createportal,portalrole,libraryrole,schoolrolecodes,importmode,bankaccountholder,bankname,bankaccountnumber,bankifsc,notifycredentials,classteacherfor,classteacherclassid,classteachersectionid,classteacherclassname,classteachersectionname,classteacheracademicyearid\n");
        for (Teacher t : teachers) {
            String classTeacherFor = homeroomByTeacherId.getOrDefault(t.getId(), List.of()).stream().findFirst().orElse("");
            sb.append(csv(t.getFirstName())).append(',');
            sb.append(csv(t.getLastName())).append(',');
            sb.append(csv(t.getEmail())).append(',');
            sb.append(csv(t.getPhone())).append(',');
            sb.append(csv(t.getQualification())).append(',');
            sb.append(csv(t.getSpecialization())).append(',');
            sb.append(t.getJoinDate() != null ? t.getJoinDate() : "").append(',');
            sb.append(t.getSalary() != null ? t.getSalary().toPlainString() : "").append(',');
            sb.append(csv(t.getSubjects() != null ? String.join("|", t.getSubjects()) : "")).append(',');
            sb.append(t.getUserId() != null ? "Y" : "N").append(',');
            if (t.getLibraryStaffRole() != null) {
                sb.append("LIBRARY_STAFF");
            } else {
                sb.append("TEACHER");
            }
            sb.append(',');
            sb.append(t.getLibraryStaffRole() != null ? t.getLibraryStaffRole().name() : "").append(',');
            sb.append(csv(schoolRoleCodesByUserId.getOrDefault(t.getUserId(), ""))).append(',');
            sb.append("UPSERT").append(',');
            sb.append(csv(t.getBankAccountHolder())).append(',');
            sb.append(csv(t.getBankName())).append(',');
            sb.append(csv(t.getBankAccountNumber())).append(',');
            sb.append(csv(t.getBankIfsc())).append(',');
            sb.append("N").append(',');
            sb.append(csv(classTeacherFor)).append(',');
            sb.append(',').append(',').append(',').append(',').append('\n');
        }
        return sb.toString();
    }

    /**
     * Maps portal {@code userId} → comma-separated {@link com.school.erp.modules.rbac.entity.SchoolRole} codes
     * (sorted) for CSV re-import.
     */
    private Map<Long, String> buildSchoolRoleCodesCsvByUserId(String tenantId, List<Teacher> teachers) {
        List<Long> userIds = teachers.stream()
                .map(Teacher::getUserId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (userIds.isEmpty()) {
            return Map.of();
        }
        List<UserSchoolRoleAssignment> rows =
                userSchoolRoleAssignmentRepository.findByTenantIdAndUserIdInFetchRoles(tenantId, userIds);
        Map<Long, List<String>> accum = new HashMap<>();
        for (UserSchoolRoleAssignment a : rows) {
            if (a.getUserId() == null || a.getSchoolRole() == null) {
                continue;
            }
            String code = a.getSchoolRole().getCode();
            if (code == null || code.isBlank()) {
                continue;
            }
            accum.computeIfAbsent(a.getUserId(), k -> new ArrayList<>()).add(code);
        }
        Map<Long, String> out = new HashMap<>();
        for (Map.Entry<Long, List<String>> e : accum.entrySet()) {
            List<String> uniq = e.getValue().stream().distinct().sorted().toList();
            out.put(e.getKey(), String.join(",", uniq));
        }
        return out;
    }

    private static String csv(String v) {
        if (v == null) {
            return "";
        }
        String x = v.replace("\"", "\"\"");
        if (x.contains(",") || x.contains("\n") || x.contains("\"")) {
            return "\"" + x + "\"";
        }
        return x;
    }

    /**
     * Teachers browsing the staff directory see professional context (name, subjects, homeroom) without
     * HR / PII fields. Admins and non-teacher roles receive the full response.
     *
     * <p>The signed-in teacher’s own row keeps {@code userId} so the client can resolve portal user → teacher
     * primary key (timetable, roster scope) without exposing colleagues’ user ids.</p>
     */
    private TeacherDTOs.Response applyAudienceVisibility(TeacherDTOs.Response r) {
        if (!isCurrentCallerSchoolTeacher()) {
            return r;
        }
        Long viewerPortalUserId = TenantContext.getUserId();
        boolean isSelf = viewerPortalUserId != null && r.getUserId() != null && r.getUserId().equals(viewerPortalUserId);
        r.setSalary(null);
        r.setPhone(null);
        r.setEmail(null);
        r.setQualification(null);
        if (!isSelf) {
            r.setUserId(null);
        }
        r.setTenantId(null);
        return r;
    }

    private static boolean isCurrentCallerSchoolTeacher() {
        String fromCtx = TenantContext.getUserRole();
        if (fromCtx != null && "teacher".equalsIgnoreCase(fromCtx.trim())) {
            return true;
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return false;
        }
        for (GrantedAuthority a : auth.getAuthorities()) {
            String authz = a.getAuthority();
            if (authz != null && "ROLE_TEACHER".equalsIgnoreCase(authz.trim())) {
                return true;
            }
        }
        return false;
    }

    /** {@link #getTeachers} is cached; invalidate on any teacher mutation so list rows stay aligned with detail. */
    private void evictTeacherDirectoryCache() {
        cacheService.ifAvailable(cs -> cs.clearRegion(CacheService.CacheRegion.TEACHER_DIRECTORY));
        dashboardSnapshotInvalidationService.invalidateCurrentTenant("teacher_directory_changed");
    }

    private TeacherDTOs.Response toRes(Teacher t, List<String> homeroomClassNames) {
        TeacherDTOs.Response r = TeacherDTOs.Response.builder().id(t.getId()).firstName(t.getFirstName()).lastName(t.getLastName()).email(t.getEmail()).phone(t.getPhone()).qualification(t.getQualification()).specialization(t.getSpecialization()).joinDate(t.getJoinDate()).salary(t.getSalary()).status(t.getStatus() != null ? t.getStatus().name().toLowerCase() : "active").subjects(EntitySnapshotCollections.detachList(t.getSubjects())).avatar(t.getAvatar()).tenantId(t.getTenantId()).build();
        r.setUserId(t.getUserId());
        r.setBankAccountHolder(t.getBankAccountHolder());
        r.setBankName(t.getBankName());
        r.setBankAccountNumber(t.getBankAccountNumber());
        r.setBankIfsc(t.getBankIfsc());
        if (t.getLibraryStaffRole() != null) {
            r.setLibraryStaffRole(t.getLibraryStaffRole().name().toLowerCase());
        }
        r.setHomeroomClassNames(homeroomClassNames != null ? homeroomClassNames : List.of());
        return r;
    }

    /**
     * Homeroom labels per teacher from {@code school_classes}/{@code sections} class-teacher columns only —
     * single source of truth for “current” homeroom (exclusive assignment is enforced in {@code AcademicService}).
     */
    private Map<Long, List<String>> homeroomClassNamesByTeacherId(String tenantId) {
        Map<Long, LinkedHashSet<String>> acc = new HashMap<>();

        List<SchoolClass> classes = schoolClassRepository.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId);
        for (SchoolClass c : classes) {
            List<Section> secs = sectionRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, c.getId());
            if (secs.isEmpty()) {
                Long tid = c.getClassTeacherId();
                if (tid != null) {
                    acc.computeIfAbsent(tid, k -> new LinkedHashSet<>()).add(c.getName());
                }
            } else {
                for (Section sec : secs) {
                    if (sec.getClassTeacherId() != null) {
                        acc.computeIfAbsent(sec.getClassTeacherId(), k -> new LinkedHashSet<>()).add(c.getName() + "-" + sec.getName());
                    }
                }
            }
        }

        Map<Long, List<String>> map = new HashMap<>();
        for (Map.Entry<Long, LinkedHashSet<String>> e : acc.entrySet()) {
            ArrayList<String> sorted = new ArrayList<>(e.getValue());
            Collections.sort(sorted);
            map.put(e.getKey(), sorted);
        }
        return map;
    }

    private List<String> homeroomClassNamesForTeacher(String tenantId, Long teacherPk) {
        List<String> out = new ArrayList<>(homeroomClassNamesForTeacherFromSectionColumns(tenantId, teacherPk));
        Collections.sort(out);
        return out;
    }

    /** Labels from {@code school_classes.class_teacher_id} / {@code sections.class_teacher_id} only. */
    private List<String> homeroomClassNamesForTeacherFromSectionColumns(String tenantId, Long teacherPk) {
        List<String> out = new ArrayList<>();
        for (SchoolClass c : schoolClassRepository.findByTenantIdAndClassTeacherIdAndIsDeletedFalse(tenantId, teacherPk)) {
            if (sectionRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, c.getId()).isEmpty()) {
                out.add(c.getName());
            }
        }
        for (Section sec : sectionRepository.findByTenantIdAndClassTeacherIdAndIsDeletedFalse(tenantId, teacherPk)) {
            schoolClassRepository.findByIdAndTenantIdAndIsDeletedFalse(sec.getClassId(), tenantId)
                    .ifPresent(c -> out.add(c.getName() + "-" + sec.getName()));
        }
        return out;
    }

    public TeacherService(final TeacherRepository repo,
                          final SchoolClassRepository schoolClassRepository,
                          final SectionRepository sectionRepository,
                          final PortalUserProvisioningService portalUserProvisioningService,
                          final UserRepository userRepository,
                          final UserSchoolRoleAssignmentRepository userSchoolRoleAssignmentRepository,
                          final NotificationService notificationService,
                          final NotificationDispatchPort notificationDispatchPort,
                          final TenantConfigRepository tenantConfigRepository,
                          final ObjectProvider<CacheService> cacheService,
                          final ObjectProvider<TimetableService> timetableService,
                          final DashboardSnapshotInvalidationService dashboardSnapshotInvalidationService) {
        this.repo = repo;
        this.schoolClassRepository = schoolClassRepository;
        this.sectionRepository = sectionRepository;
        this.portalUserProvisioningService = portalUserProvisioningService;
        this.userRepository = userRepository;
        this.userSchoolRoleAssignmentRepository = userSchoolRoleAssignmentRepository;
        this.notificationService = notificationService;
        this.notificationDispatchPort = notificationDispatchPort;
        this.tenantConfigRepository = tenantConfigRepository;
        this.cacheService = cacheService;
        this.timetableService = timetableService;
        this.dashboardSnapshotInvalidationService = dashboardSnapshotInvalidationService;
    }

    private void sendTeacherPortalCredentialsNotification(String tenantId, Long userId, String loginEmail, String phone) {
        if (userId == null) {
            return;
        }
        String title = "Teacher Portal Access Credentials";
        SchoolIdentity school = loadSchoolIdentity(tenantId);
        String body = "Portal onboarding completed for your teacher account. "
                + schoolIdentityLine(school.name(), school.code()) + ". "
                + "Mobile OTP login: " + (phone != null && !phone.isBlank() ? phone : "registered mobile number") + ". "
                + "Email login: " + loginEmail + ". "
                + "Set your password from Profile > Security after email verification, or use Forgot password. "
                + "For security, update credentials after first login.";
        notificationService.createNotification(tenantId, userId, title, body, Enums.NotificationType.INFO, "/app/dashboard");
        notificationDispatchPort.enqueue(
                tenantId,
                "STAFF_PORTAL_CREDENTIALS",
                "SMS",
                userId,
                phone,
                title,
                body,
                "manual-teacher-" + userId,
                "manual-teacher-onboarding",
                NotificationDispatchAttributes.inheritFromThread());
    }

    private void notifyAdminsOnTeacherOnboarding(String tenantId) {
        SchoolIdentity school = loadSchoolIdentity(tenantId);
        String title = "Teacher Portal Onboarding Notice";
        String body = schoolIdentityLine(school.name(), school.code())
                + " New teacher portal accounts are now active. Sign in using mobile OTP. "
                + "If email login is enabled, verify your email in Profile > Security before using password login.";
        LinkedHashSet<User> admins = new LinkedHashSet<>();
        admins.addAll(userRepository.findByTenantIdAndRoleAndIsDeletedFalse(tenantId, Enums.Role.ADMIN));
        admins.addAll(userRepository.findByTenantIdAndRoleAndIsDeletedFalse(tenantId, Enums.Role.SUPER_ADMIN));
        for (User admin : admins) {
            if (admin == null || admin.getId() == null) {
                continue;
            }
            notificationService.createNotification(tenantId, admin.getId(), title, body, Enums.NotificationType.INFO, "/app/inbox");
            String phone = trimToNull(admin.getPhone());
            if (phone != null) {
                notificationDispatchPort.enqueue(
                        tenantId,
                        "ADMIN_ONBOARDING_SUMMARY",
                        "SMS",
                        admin.getId(),
                        phone,
                        title,
                        body,
                        "manual-teacher-admin-" + admin.getId(),
                        "manual-teacher-onboarding",
                        NotificationDispatchAttributes.inheritFromThread());
            }
        }
    }

    private SchoolIdentity loadSchoolIdentity(String tenantId) {
        return tenantConfigRepository.findByTenantId(tenantId)
                .map(cfg -> new SchoolIdentity(trimToNull(cfg.getSchoolName()), trimToNull(cfg.getSchoolCode())))
                .orElseGet(() -> new SchoolIdentity(null, null));
    }

    private static String schoolIdentityLine(String schoolName, String schoolCode) {
        if (schoolName != null && schoolCode != null) {
            return "School: " + schoolName + " (" + schoolCode + ")";
        }
        if (schoolName != null) {
            return "School: " + schoolName;
        }
        if (schoolCode != null) {
            return "School code: " + schoolCode;
        }
        return "School portal access update";
    }

    private record SchoolIdentity(String name, String code) {
    }

    private String required(Map<String, String> row, String key) {
        String value = blankToNull(row.get(key));
        if (value == null) {
            throw new com.school.erp.common.exception.BusinessException("Missing required column value: " + key);
        }
        return value;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private java.time.LocalDate parseDate(String value) {
        String normalized = blankToNull(value);
        return normalized != null ? java.time.LocalDate.parse(normalized) : null;
    }

    private BigDecimal parseDecimal(String value) {
        String normalized = blankToNull(value);
        return normalized != null ? new BigDecimal(normalized) : null;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeIfsc(String value) {
        String normalized = trimToNull(value);
        return normalized != null ? normalized.toUpperCase(Locale.ROOT) : null;
    }

    private List<String> parseSubjects(String value) {
        String normalized = blankToNull(value);
        if (normalized == null) {
            return new ArrayList<>();
        }
        return java.util.Arrays.stream(normalized.split("\\|"))
                .map(String::trim)
                .filter(part -> !part.isEmpty())
                .collect(Collectors.toCollection(ArrayList::new));
    }
}
