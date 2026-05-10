package com.school.erp.modules.rbac.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.rbac.RbacPermissionCodec;
import com.school.erp.modules.rbac.RbacRoleCatalog;
import com.school.erp.modules.rbac.SchoolRbacPermissionCatalog;
import com.school.erp.modules.rbac.entity.SchoolRole;
import com.school.erp.modules.rbac.entity.UserSchoolRoleAssignment;
import com.school.erp.modules.rbac.repository.SchoolRoleRepository;
import com.school.erp.modules.rbac.repository.UserSchoolRoleAssignmentRepository;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.modules.teacher.entity.Teacher;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.security.rbac.AppPermission;
import com.school.erp.security.rbac.SlimJwtAuthorityCache;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Idempotently seeds school role definitions per tenant and backfills user↔role links from legacy
 * {@link User#getRole()} when no rows exist yet.
 */
@Service
public class RbacTenantBootstrapService {
    private static final Logger log = LoggerFactory.getLogger(RbacTenantBootstrapService.class);

    private static final Set<Enums.Role> STAFF_PORTAL_ROLES = EnumSet.of(
            Enums.Role.ADMIN, Enums.Role.TEACHER, Enums.Role.LIBRARY_STAFF, Enums.Role.SCHOOL_STAFF);

    private final TenantConfigRepository tenantConfigRepository;
    private final SchoolRoleRepository schoolRoleRepository;
    private final UserSchoolRoleAssignmentRepository userSchoolRoleAssignmentRepository;
    private final UserRepository userRepository;
    private final TeacherRepository teacherRepository;
    private final RbacPermissionGroupService rbacPermissionGroupService;
    private final SlimJwtAuthorityCache slimJwtAuthorityCache;

    public RbacTenantBootstrapService(
            TenantConfigRepository tenantConfigRepository,
            SchoolRoleRepository schoolRoleRepository,
            UserSchoolRoleAssignmentRepository userSchoolRoleAssignmentRepository,
            UserRepository userRepository,
            TeacherRepository teacherRepository,
            RbacPermissionGroupService rbacPermissionGroupService,
            SlimJwtAuthorityCache slimJwtAuthorityCache) {
        this.tenantConfigRepository = tenantConfigRepository;
        this.schoolRoleRepository = schoolRoleRepository;
        this.userSchoolRoleAssignmentRepository = userSchoolRoleAssignmentRepository;
        this.userRepository = userRepository;
        this.teacherRepository = teacherRepository;
        this.rbacPermissionGroupService = rbacPermissionGroupService;
        this.slimJwtAuthorityCache = slimJwtAuthorityCache;
    }

    @Transactional
    public void ensureTenantSeeded(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return;
        }
        if (tenantConfigRepository.findByTenantId(tenantId).isEmpty()) {
            return;
        }
        seedRoleCatalogIfEmpty(tenantId);
        ensureCatalogContainsBaseSchoolStaff(tenantId);
        ensureCatalogContainsStaffMessaging(tenantId);
        upsertMissingCatalogTemplates(tenantId);
        migrateLeavePermissionLanes(tenantId);
        migrateLegacyPortalChatCatalogPermission(tenantId);
        migrateLegacyTenantSettingsCatalogOverPrivilege(tenantId);
        backfillUserAssignmentsIfEmpty(tenantId);
        linkBaseSchoolStaffForPortalUsersIfMissing(tenantId);
        rbacPermissionGroupService.ensureLinkedBundlesForTenant(tenantId);
    }

    /**
     * After a new school workspace is created: catalog + first admin's {@link RbacRoleCatalog#CODE_SCHOOL_FULL_ADMIN} link.
     */
    @Transactional
    public void seedForNewTenantAndFirstAdmin(String tenantId, User adminUser) {
        seedRoleCatalogIfEmpty(tenantId);
        ensureCatalogContainsBaseSchoolStaff(tenantId);
        ensureCatalogContainsStaffMessaging(tenantId);
        upsertMissingCatalogTemplates(tenantId);
        migrateLeavePermissionLanes(tenantId);
        if (adminUser == null || adminUser.getId() == null) {
            return;
        }
        if (userSchoolRoleAssignmentRepository.countByTenantIdAndUserId(tenantId, adminUser.getId()) > 0) {
            return;
        }
        schoolRoleRepository.findByTenantIdAndCodeAndIsDeletedFalse(tenantId, RbacRoleCatalog.CODE_SCHOOL_FULL_ADMIN)
                .ifPresent(r -> {
                    linkUserToRole(tenantId, adminUser.getId(), r);
                    log.info("RBAC linked first admin to SCHOOL_FULL_ADMIN tenantId={} userId={}", tenantId, adminUser.getId());
                });
        rbacPermissionGroupService.ensureLinkedBundlesForTenant(tenantId);
    }

    private void seedRoleCatalogIfEmpty(String tenantId) {
        if (schoolRoleRepository.countByTenantIdAndIsDeletedFalse(tenantId) > 0) {
            return;
        }
        for (RbacRoleCatalog.DefaultSchoolRole t : RbacRoleCatalog.TEMPLATES) {
            SchoolRole e = new SchoolRole();
            e.setTenantId(tenantId);
            e.setIsActive(true);
            e.setIsDeleted(false);
            e.setCode(t.code());
            e.setName(t.name());
            e.setDescription(t.description());
            e.setSortOrder(t.sortOrder());
            e.setSystemRole(t.systemRole());
            e.setPermissionsCsv(t.permissionsCsv());
            schoolRoleRepository.save(e);
        }
        log.info("RBAC seeded {} default school roles for tenantId={}", RbacRoleCatalog.TEMPLATES.size(), tenantId);
    }

    /**
     * Forward-compatible: insert any {@link RbacRoleCatalog#TEMPLATES} rows not yet present (e.g. new desk codes after
     * an upgrade) without touching existing custom roles.
     */
    private void upsertMissingCatalogTemplates(String tenantId) {
        for (RbacRoleCatalog.DefaultSchoolRole t : RbacRoleCatalog.TEMPLATES) {
            if (schoolRoleRepository.findByTenantIdAndCodeAndIsDeletedFalse(tenantId, t.code()).isPresent()) {
                continue;
            }
            SchoolRole e = new SchoolRole();
            e.setTenantId(tenantId);
            e.setIsActive(true);
            e.setIsDeleted(false);
            e.setCode(t.code());
            e.setName(t.name());
            e.setDescription(t.description());
            e.setSortOrder(t.sortOrder());
            e.setSystemRole(t.systemRole());
            e.setPermissionsCsv(t.permissionsCsv());
            schoolRoleRepository.save(e);
            log.info("RBAC inserted missing catalog role {} for tenantId={}", t.code(), tenantId);
        }
    }

    /**
     * Catalog template {@link RbacRoleCatalog#CODE_TENANT_SETTINGS} incorrectly bundled {@code TENANT_ADMIN}, which
     * grants the entire school operator surface. Strip it from persisted catalog rows and rebuild linked bundles.
     */
    private void migrateLegacyTenantSettingsCatalogOverPrivilege(String tenantId) {
        schoolRoleRepository
                .findByTenantIdAndCodeAndIsDeletedFalse(tenantId, RbacRoleCatalog.CODE_TENANT_SETTINGS)
                .ifPresent(role -> {
                    EnumSet<AppPermission> perms =
                            EnumSet.copyOf(RbacPermissionCodec.parsePermissionsCsv(role.getPermissionsCsv()));
                    if (!perms.contains(AppPermission.TENANT_ADMIN)) {
                        return;
                    }
                    perms.remove(AppPermission.TENANT_ADMIN);
                    perms.add(AppPermission.SCHOOL_SETTINGS_CORE_READ);
                    perms.add(AppPermission.SCHOOL_SETTINGS_CORE_WRITE);
                    perms.add(AppPermission.SCHOOL_SETTINGS_FINANCE_READ);
                    perms.add(AppPermission.SCHOOL_SETTINGS_FINANCE_WRITE);
                    if (!perms.contains(AppPermission.FEE_STRUCTURES_READ)) {
                        perms.add(AppPermission.FEE_STRUCTURES_READ);
                    }
                    SchoolRbacPermissionCatalog.assertSubset(perms);
                    rbacPermissionGroupService.syncInlineBundleForRole(
                            role, perms, Boolean.TRUE.equals(role.getSystemRole()));
                    slimJwtAuthorityCache.evictForTenant(tenantId);
                    log.info(
                            "RBAC migrated {} removed TENANT_ADMIN from settings desk template tenantId={}",
                            RbacRoleCatalog.CODE_TENANT_SETTINGS,
                            tenantId);
                });
    }

    /**
     * Older tenants created before {@link RbacRoleCatalog#CODE_BASE_SCHOOL_STAFF} existed: add the row idempotently.
     */
    private void ensureCatalogContainsBaseSchoolStaff(String tenantId) {
        if (schoolRoleRepository.findByTenantIdAndCodeAndIsDeletedFalse(tenantId, RbacRoleCatalog.CODE_BASE_SCHOOL_STAFF)
                .isPresent()) {
            return;
        }
        SchoolRole e = new SchoolRole();
        e.setTenantId(tenantId);
        e.setIsActive(true);
        e.setIsDeleted(false);
        e.setCode(RbacRoleCatalog.CODE_BASE_SCHOOL_STAFF);
        e.setName("Base school staff");
        e.setDescription(
                "Minimal employee portal; assign additional school roles (library, fee office, academic, …) for duties.");
        e.setSortOrder(5);
        e.setSystemRole(true);
        e.setPermissionsCsv("PORTAL_SCHOOL_STAFF,SCHOOL_LIBRARY_MEMBER_READ");
        schoolRoleRepository.save(e);
        log.info("RBAC inserted BASE_SCHOOL_STAFF for tenantId={}", tenantId);
    }

    /** Older tenants: add {@link RbacRoleCatalog#CODE_STAFF_MESSAGING} for optional employee chat. */
    private void ensureCatalogContainsStaffMessaging(String tenantId) {
        if (schoolRoleRepository.findByTenantIdAndCodeAndIsDeletedFalse(tenantId, RbacRoleCatalog.CODE_STAFF_MESSAGING)
                .isPresent()) {
            return;
        }
        SchoolRole e = new SchoolRole();
        e.setTenantId(tenantId);
        e.setIsActive(true);
        e.setIsDeleted(false);
        e.setCode(RbacRoleCatalog.CODE_STAFF_MESSAGING);
        e.setName("Staff messaging (chat)");
        e.setDescription("Optional tenant chat for non-teaching employees when the school enables chat for staff.");
        e.setSortOrder(6);
        e.setSystemRole(true);
        e.setPermissionsCsv("SCHOOL_CHAT_READ,SCHOOL_CHAT_WRITE");
        schoolRoleRepository.save(e);
        log.info("RBAC inserted STAFF_MESSAGING for tenantId={}", tenantId);
    }

    /** Retires legacy {@code PORTAL_CHAT} rows by replacing them with {@code SCHOOL_CHAT_READ/WRITE}. */
    private void migrateLegacyPortalChatCatalogPermission(String tenantId) {
        List<SchoolRole> roles = schoolRoleRepository.findByTenantIdAndIsDeletedFalseOrderBySortOrderAscNameAsc(tenantId);
        for (SchoolRole role : roles) {
            String csv = role.getPermissionsCsv();
            if (csv == null || csv.isBlank() || !csv.contains("PORTAL_CHAT")) {
                continue;
            }
            LinkedHashSet<String> codes = Arrays.stream(csv.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .filter(s -> !"PORTAL_CHAT".equals(s))
                    .collect(Collectors.toCollection(LinkedHashSet::new));
            codes.add("SCHOOL_CHAT_READ");
            codes.add("SCHOOL_CHAT_WRITE");
            role.setPermissionsCsv(String.join(",", codes));
            schoolRoleRepository.save(role);
            log.info("RBAC migrated legacy PORTAL_CHAT to SCHOOL_CHAT_* for tenantId={} roleCode={}", tenantId, role.getCode());
        }
    }

    /** Ensures leave self/approval atoms exist on baseline role templates for upgraded tenants. */
    private void migrateLeavePermissionLanes(String tenantId) {
        ensureRolePermissions(
                tenantId,
                RbacRoleCatalog.CODE_SCHOOL_FULL_ADMIN,
                AppPermission.SCHOOL_LEAVE_SELF_READ,
                AppPermission.SCHOOL_LEAVE_SELF_APPLY,
                AppPermission.SCHOOL_LEAVE_APPROVAL_READ,
                AppPermission.SCHOOL_LEAVE_APPROVAL_WRITE);
        ensureRolePermissions(
                tenantId,
                RbacRoleCatalog.CODE_ACADEMIC_STAFF,
                AppPermission.SCHOOL_LEAVE_SELF_READ,
                AppPermission.SCHOOL_LEAVE_SELF_APPLY);
        ensureRolePermissions(
                tenantId,
                RbacRoleCatalog.CODE_ACADEMIC_ADMIN_DESK,
                AppPermission.SCHOOL_LEAVE_APPROVAL_READ,
                AppPermission.SCHOOL_LEAVE_APPROVAL_WRITE);
    }

    private void ensureRolePermissions(String tenantId, String roleCode, AppPermission... requiredPerms) {
        schoolRoleRepository.findByTenantIdAndCodeAndIsDeletedFalse(tenantId, roleCode).ifPresent(role -> {
            EnumSet<AppPermission> perms = EnumSet.copyOf(RbacPermissionCodec.parsePermissionsCsv(role.getPermissionsCsv()));
            boolean changed = false;
            for (AppPermission p : requiredPerms) {
                if (perms.add(p)) {
                    changed = true;
                }
            }
            if (!changed) {
                return;
            }
            SchoolRbacPermissionCatalog.assertSubset(perms);
            rbacPermissionGroupService.syncInlineBundleForRole(role, perms, Boolean.TRUE.equals(role.getSystemRole()));
            slimJwtAuthorityCache.evictForTenant(tenantId);
            log.info("RBAC migrated {} added leave permissions tenantId={}", roleCode, tenantId);
        });
    }

    /** Ensures {@code LIBRARY_STAFF} / {@code SCHOOL_STAFF} portal users carry the baseline school-staff link. */
    private void linkBaseSchoolStaffForPortalUsersIfMissing(String tenantId) {
        schoolRoleRepository.findByTenantIdAndCodeAndIsDeletedFalse(tenantId, RbacRoleCatalog.CODE_BASE_SCHOOL_STAFF).ifPresent(base -> {
            List<User> users = userRepository.findByTenantIdAndRoleInAndIsDeletedFalseOrderByNameAsc(
                    tenantId, List.of(Enums.Role.LIBRARY_STAFF, Enums.Role.SCHOOL_STAFF));
            for (User u : users) {
                List<UserSchoolRoleAssignment> cur =
                        userSchoolRoleAssignmentRepository.findByTenantIdAndUserIdFetchRoles(tenantId, u.getId());
                boolean hasBase = cur.stream()
                        .anyMatch(a -> RbacRoleCatalog.CODE_BASE_SCHOOL_STAFF.equals(a.getSchoolRole().getCode()));
                if (!hasBase) {
                    linkUserToRole(tenantId, u.getId(), base);
                }
            }
        });
    }

    private void backfillUserAssignmentsIfEmpty(String tenantId) {
        for (User u : userRepository.findByTenantIdAndIsDeletedFalseOrderByNameAsc(tenantId)) {
            if (u.getRole() == null || !STAFF_PORTAL_ROLES.contains(u.getRole())) {
                continue;
            }
            if (userSchoolRoleAssignmentRepository.countByTenantIdAndUserId(tenantId, u.getId()) > 0) {
                continue;
            }
            List<SchoolRole> toLink = new ArrayList<>();
            switch (u.getRole()) {
                case ADMIN -> schoolRoleRepository.findByTenantIdAndCodeAndIsDeletedFalse(tenantId, RbacRoleCatalog.CODE_SCHOOL_FULL_ADMIN).ifPresent(toLink::add);
                case TEACHER -> {
                    schoolRoleRepository.findByTenantIdAndCodeAndIsDeletedFalse(tenantId, RbacRoleCatalog.CODE_ACADEMIC_STAFF).ifPresent(toLink::add);
                    if (hasLibraryFlag(u, tenantId)) {
                        schoolRoleRepository.findByTenantIdAndCodeAndIsDeletedFalse(tenantId, RbacRoleCatalog.CODE_LIBRARY_OPERATIONS)
                                .ifPresent(toLink::add);
                    }
                }
                case LIBRARY_STAFF -> {
                    schoolRoleRepository.findByTenantIdAndCodeAndIsDeletedFalse(tenantId, RbacRoleCatalog.CODE_BASE_SCHOOL_STAFF)
                            .ifPresent(toLink::add);
                    schoolRoleRepository.findByTenantIdAndCodeAndIsDeletedFalse(tenantId, RbacRoleCatalog.CODE_LIBRARY_OPERATIONS)
                            .ifPresent(toLink::add);
                }
                case SCHOOL_STAFF -> schoolRoleRepository
                        .findByTenantIdAndCodeAndIsDeletedFalse(tenantId, RbacRoleCatalog.CODE_BASE_SCHOOL_STAFF)
                        .ifPresent(toLink::add);
                default -> {
                }
            }
            for (SchoolRole r : toLink) {
                linkUserToRole(tenantId, u.getId(), r);
            }
        }
    }

    private boolean hasLibraryFlag(User u, String tenantId) {
        List<Teacher> rows = teacherRepository.findAllByTenantIdAndUserIdAndIsDeletedFalseOrderByIdAsc(tenantId, u.getId());
        if (rows.size() > 1) {
            log.warn(
                    "RBAC backfill: {} active Teacher rows for tenantId={} userId={} (expected one); using first for library flag",
                    rows.size(),
                    tenantId,
                    u.getId());
        }
        return rows.stream().findFirst().map(t -> t.getLibraryStaffRole() != null).orElse(false);
    }

    private void linkUserToRole(String tenantId, Long userId, SchoolRole role) {
        UserSchoolRoleAssignment a = new UserSchoolRoleAssignment();
        a.setTenantId(tenantId);
        a.setUserId(userId);
        a.setSchoolRole(role);
        a.setCreatedAt(LocalDateTime.now());
        userSchoolRoleAssignmentRepository.save(a);
    }
}
