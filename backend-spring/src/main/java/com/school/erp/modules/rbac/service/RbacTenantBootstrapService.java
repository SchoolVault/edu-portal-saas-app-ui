package com.school.erp.modules.rbac.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.rbac.RbacRoleCatalog;
import com.school.erp.modules.rbac.entity.SchoolRole;
import com.school.erp.modules.rbac.entity.UserSchoolRoleAssignment;
import com.school.erp.modules.rbac.repository.SchoolRoleRepository;
import com.school.erp.modules.rbac.repository.UserSchoolRoleAssignmentRepository;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/**
 * Idempotently seeds school role definitions per tenant and backfills user↔role links from legacy
 * {@link User#getRole()} when no rows exist yet.
 */
@Service
public class RbacTenantBootstrapService {
    private static final Logger log = LoggerFactory.getLogger(RbacTenantBootstrapService.class);

    private static final Set<Enums.Role> STAFF_PORTAL_ROLES = EnumSet.of(
            Enums.Role.ADMIN, Enums.Role.TEACHER, Enums.Role.LIBRARY_STAFF);

    private final TenantConfigRepository tenantConfigRepository;
    private final SchoolRoleRepository schoolRoleRepository;
    private final UserSchoolRoleAssignmentRepository userSchoolRoleAssignmentRepository;
    private final UserRepository userRepository;
    private final TeacherRepository teacherRepository;

    public RbacTenantBootstrapService(
            TenantConfigRepository tenantConfigRepository,
            SchoolRoleRepository schoolRoleRepository,
            UserSchoolRoleAssignmentRepository userSchoolRoleAssignmentRepository,
            UserRepository userRepository,
            TeacherRepository teacherRepository) {
        this.tenantConfigRepository = tenantConfigRepository;
        this.schoolRoleRepository = schoolRoleRepository;
        this.userSchoolRoleAssignmentRepository = userSchoolRoleAssignmentRepository;
        this.userRepository = userRepository;
        this.teacherRepository = teacherRepository;
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
        backfillUserAssignmentsIfEmpty(tenantId);
    }

    /**
     * After a new school workspace is created: catalog + first admin's {@link RbacRoleCatalog#CODE_SCHOOL_FULL_ADMIN} link.
     */
    @Transactional
    public void seedForNewTenantAndFirstAdmin(String tenantId, User adminUser) {
        seedRoleCatalogIfEmpty(tenantId);
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
                case LIBRARY_STAFF -> schoolRoleRepository
                        .findByTenantIdAndCodeAndIsDeletedFalse(tenantId, RbacRoleCatalog.CODE_LIBRARY_OPERATIONS)
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
        return teacherRepository.findByTenantIdAndUserIdAndIsDeletedFalse(tenantId, u.getId())
                .map(t -> t.getLibraryStaffRole() != null)
                .orElse(false);
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
