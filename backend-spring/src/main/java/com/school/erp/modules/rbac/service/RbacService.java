package com.school.erp.modules.rbac.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.rbac.RbacPermissionCodec;
import com.school.erp.modules.rbac.SchoolRbacPermissionCatalog;
import com.school.erp.modules.rbac.audit.RbacAuditModule;
import com.school.erp.modules.rbac.dto.RbacDTOs;
import com.school.erp.modules.rbac.entity.SchoolRole;
import com.school.erp.modules.rbac.entity.UserSchoolRoleAssignment;
import com.school.erp.modules.rbac.repository.SchoolRolePermissionGroupRepository;
import com.school.erp.modules.rbac.repository.SchoolRoleRepository;
import com.school.erp.modules.rbac.repository.UserSchoolRoleAssignmentRepository;
import com.school.erp.platform.port.AuditTrailPort;
import com.school.erp.security.rbac.AppPermission;
import com.school.erp.security.rbac.SlimJwtAuthorityCache;
import com.school.erp.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Per-tenant school role catalog, custom role definitions, and user↔responsibility assignments.
 * Portal {@link Enums.Role} on {@link User} remains the login / identity class; this layer stacks operational responsibilities.
 */
@Service
public class RbacService {

    private static final Set<Enums.Role> ASSIGNABLE_PORTAL_ROLES = EnumSet.of(
            Enums.Role.ADMIN, Enums.Role.TEACHER, Enums.Role.LIBRARY_STAFF, Enums.Role.SCHOOL_STAFF);

    private final SchoolRoleRepository schoolRoleRepository;
    private final UserSchoolRoleAssignmentRepository userSchoolRoleAssignmentRepository;
    private final SchoolRolePermissionGroupRepository schoolRolePermissionGroupRepository;
    private final UserRepository userRepository;
    private final RbacLastAdminEligibility lastAdminEligibility;
    private final SchoolRolePermissionResolver schoolRolePermissionResolver;
    private final RbacPermissionGroupService rbacPermissionGroupService;
    private final SlimJwtAuthorityCache slimJwtAuthorityCache;
    private final AuditTrailPort auditTrailPort;

    public RbacService(
            SchoolRoleRepository schoolRoleRepository,
            UserSchoolRoleAssignmentRepository userSchoolRoleAssignmentRepository,
            SchoolRolePermissionGroupRepository schoolRolePermissionGroupRepository,
            UserRepository userRepository,
            RbacLastAdminEligibility lastAdminEligibility,
            SchoolRolePermissionResolver schoolRolePermissionResolver,
            RbacPermissionGroupService rbacPermissionGroupService,
            SlimJwtAuthorityCache slimJwtAuthorityCache,
            AuditTrailPort auditTrailPort) {
        this.schoolRoleRepository = schoolRoleRepository;
        this.userSchoolRoleAssignmentRepository = userSchoolRoleAssignmentRepository;
        this.schoolRolePermissionGroupRepository = schoolRolePermissionGroupRepository;
        this.userRepository = userRepository;
        this.lastAdminEligibility = lastAdminEligibility;
        this.schoolRolePermissionResolver = schoolRolePermissionResolver;
        this.rbacPermissionGroupService = rbacPermissionGroupService;
        this.slimJwtAuthorityCache = slimJwtAuthorityCache;
        this.auditTrailPort = auditTrailPort;
    }

    @Transactional(readOnly = true)
    public List<String> listPermissionCatalog() {
        requireTenant();
        return SchoolRbacPermissionCatalog.sortedNames();
    }

    @Transactional(readOnly = true)
    public List<RbacDTOs.SchoolRoleResponse> listSchoolRoleCatalog() {
        String tid = requireTenant();
        return schoolRoleRepository.findByTenantIdAndIsDeletedFalseOrderBySortOrderAscNameAsc(tid).stream()
                .map(this::toSchoolRoleResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RbacDTOs.StaffUserRow> listStaffUsers() {
        String tid = requireTenant();
        List<Enums.Role> staff = new ArrayList<>(ASSIGNABLE_PORTAL_ROLES);
        return userRepository.findByTenantIdAndRoleInAndIsDeletedFalseOrderByNameAsc(tid, staff).stream()
                .map(u -> {
                    RbacDTOs.StaffUserRow r = new RbacDTOs.StaffUserRow();
                    r.setId(u.getId());
                    r.setName(u.getName());
                    r.setEmail(u.getEmail());
                    r.setPortalRole(u.getRole() != null ? u.getRole().name().toLowerCase() : "");
                    return r;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public RbacDTOs.UserSchoolRoleAssignmentResponse getUserAssignments(Long userId) {
        String tid = requireTenant();
        userRepository.findByIdAndTenantIdAndIsDeletedFalse(userId, tid)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        List<UserSchoolRoleAssignment> list =
                userSchoolRoleAssignmentRepository.findByTenantIdAndUserIdFetchRoles(tid, userId);
        RbacDTOs.UserSchoolRoleAssignmentResponse out = new RbacDTOs.UserSchoolRoleAssignmentResponse();
        out.setSchoolRoleIds(
                list.stream().map(a -> a.getSchoolRole().getId()).toList());
        out.setSchoolRoles(
                list.stream()
                        .map(a -> toSchoolRoleResponse(a.getSchoolRole()))
                        .collect(Collectors.toList()));
        return out;
    }

    @Transactional
    public RbacDTOs.SchoolRoleResponse createCustomSchoolRole(RbacDTOs.CreateCustomSchoolRoleRequest request) {
        String tid = requireTenant();
        String code = request.getCode().trim();
        if (schoolRoleRepository.findByTenantIdAndCodeAndIsDeletedFalse(tid, code).isPresent()) {
            throw new BusinessException("A school role with this code already exists.");
        }
        boolean hasGroups = hasNonEmptyGroupIds(request.getPermissionGroupIds());
        boolean hasPerms = hasNonEmptyPermissionNames(request.getPermissions());
        validateCustomRoleComposition(hasGroups, hasPerms);
        SchoolRole e = new SchoolRole();
        e.setTenantId(tid);
        e.setCode(code);
        e.setName(request.getName().trim());
        e.setDescription(request.getDescription() == null ? null : request.getDescription().trim());
        e.setSystemRole(false);
        e.setSortOrder(request.getSortOrder());
        e.setPermissionsCsv("");
        e.setIsActive(true);
        e.setIsDeleted(false);
        schoolRoleRepository.save(e);
        if (hasGroups) {
            rbacPermissionGroupService.replaceSchoolRoleWithLinkedGroups(tid, e, request.getPermissionGroupIds());
        } else {
            EnumSet<AppPermission> perms = parsePermissionNameList(request.getPermissions());
            rbacPermissionGroupService.syncInlineBundleForRole(e, perms, false);
        }
        SchoolRole saved = schoolRoleRepository.findById(e.getId()).orElse(e);
        slimJwtAuthorityCache.evictForTenant(tid);
        int permCount = schoolRolePermissionResolver.resolveEffective(saved).size();
        String desc = trimAuditDesc("Custom school role: " + saved.getCode() + " — " + saved.getName());
        auditTrailPort.logAction(
                Enums.AuditAction.CREATE,
                RbacAuditModule.CODE,
                desc,
                saved.getId(),
                "SchoolRole",
                null,
                "code=" + saved.getCode() + ",permCount=" + permCount);
        return toSchoolRoleResponse(saved);
    }

    @Transactional
    public RbacDTOs.SchoolRoleResponse updateCustomSchoolRole(long roleId, RbacDTOs.UpdateCustomSchoolRoleRequest request) {
        String tid = requireTenant();
        SchoolRole e = schoolRoleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("School role", roleId));
        if (Boolean.TRUE.equals(e.getIsDeleted()) || e.getTenantId() == null || !tid.equals(e.getTenantId())) {
            throw new BusinessException("Invalid school role for this school.");
        }
        if (Boolean.TRUE.equals(e.getSystemRole())) {
            throw new BusinessException("System template roles cannot be modified.");
        }
        boolean hasGroups = hasNonEmptyGroupIds(request.getPermissionGroupIds());
        boolean hasPerms = hasNonEmptyPermissionNames(request.getPermissions());
        validateCustomRoleComposition(hasGroups, hasPerms);
        String beforeSnap = "name=" + e.getName() + ";sort=" + e.getSortOrder() + ";permCount="
                + schoolRolePermissionResolver.resolveEffective(e).size();
        EnumSet<AppPermission> proposed =
                hasGroups
                        ? rbacPermissionGroupService.unionPermissionsForGroupIds(tid, request.getPermissionGroupIds())
                        : parsePermissionNameList(request.getPermissions());
        SchoolRole preview = new SchoolRole();
        preview.setPermissionsCsv(RbacPermissionCodec.toCsv(proposed));
        lastAdminEligibility.assertAfterCustomRoleContentChange(tid, e.getId(), preview);
        e.setName(request.getName().trim());
        e.setDescription(request.getDescription() == null ? null : request.getDescription().trim());
        e.setSortOrder(request.getSortOrder());
        schoolRoleRepository.save(e);
        if (hasGroups) {
            rbacPermissionGroupService.replaceSchoolRoleWithLinkedGroups(tid, e, request.getPermissionGroupIds());
        } else {
            rbacPermissionGroupService.syncInlineBundleForRole(e, EnumSet.copyOf(proposed), false);
        }
        SchoolRole saved = schoolRoleRepository.findById(e.getId()).orElse(e);
        slimJwtAuthorityCache.evictForTenant(tid);
        String afterSnap = "name=" + saved.getName() + ";sort=" + saved.getSortOrder() + ";permCount="
                + schoolRolePermissionResolver.resolveEffective(saved).size();
        String desc = trimAuditDesc("Updated custom school role: " + saved.getCode());
        auditTrailPort.logAction(
                Enums.AuditAction.UPDATE, RbacAuditModule.CODE, desc, saved.getId(), "SchoolRole", beforeSnap, afterSnap);
        return toSchoolRoleResponse(saved);
    }

    @Transactional
    public void deleteCustomSchoolRole(long roleId) {
        String tid = requireTenant();
        SchoolRole e = schoolRoleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("School role", roleId));
        if (Boolean.TRUE.equals(e.getIsDeleted()) || e.getTenantId() == null || !tid.equals(e.getTenantId())) {
            throw new BusinessException("Invalid school role for this school.");
        }
        if (Boolean.TRUE.equals(e.getSystemRole())) {
            throw new BusinessException("System template roles cannot be deleted.");
        }
        Long rid = e.getId();
        String code = e.getCode();
        lastAdminEligibility.assertAfterCustomRoleSoftDelete(tid, e.getId());
        userSchoolRoleAssignmentRepository.deleteByTenantIdAndSchoolRoleId(tid, e.getId());
        rbacPermissionGroupService.detachAndSoftDeleteExclusiveBundles(tid, e.getId());
        e.markSoftDeleted();
        schoolRoleRepository.save(e);
        slimJwtAuthorityCache.evictForTenant(tid);
        String desc = trimAuditDesc("Removed custom school role: " + code);
        auditTrailPort.logAction(Enums.AuditAction.DELETE, RbacAuditModule.CODE, desc, rid, "SchoolRole", code, null);
    }

    @Transactional
    public RbacDTOs.UserSchoolRoleAssignmentResponse replaceUserAssignments(
            Long targetUserId, RbacDTOs.ReplaceUserSchoolRolesRequest request) {
        String tid = requireTenant();
        User target = userRepository.findByIdAndTenantIdAndIsDeletedFalse(targetUserId, tid)
                .orElseThrow(() -> new ResourceNotFoundException("User", targetUserId));
        if (!ASSIGNABLE_PORTAL_ROLES.contains(target.getRole())) {
            throw new BusinessException("School responsibility roles apply only to staff (admin, teacher, library).");
        }
        List<Long> idList = request.getSchoolRoleIds() == null ? List.of() : request.getSchoolRoleIds();
        Set<Long> distinct = new LinkedHashSet<>(idList);
        List<SchoolRole> newRoleEntities = loadSchoolRolesForTenantByIds(tid, distinct);
        replaceUserAssignmentsCore(tid, target, targetUserId, newRoleEntities);
        return getUserAssignments(targetUserId);
    }

    /**
     * Bulk staff import: set school responsibility roles by stable {@link SchoolRole#getCode()} values
     * (same codes as Settings → access roles). Replaces existing assignments for this user in the tenant.
     */
    @Transactional
    public void replaceUserSchoolRolesFromImportCodes(Long userId, List<String> schoolRoleCodes) {
        if (schoolRoleCodes == null || schoolRoleCodes.isEmpty()) {
            return;
        }
        String tid = requireTenant();
        User target = userRepository.findByIdAndTenantIdAndIsDeletedFalse(userId, tid)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        if (!ASSIGNABLE_PORTAL_ROLES.contains(target.getRole())) {
            throw new BusinessException("School responsibility roles apply only to staff (admin, teacher, library).");
        }
        LinkedHashSet<String> orderedCodes = new LinkedHashSet<>();
        for (String raw : schoolRoleCodes) {
            if (raw == null || raw.isBlank()) {
                continue;
            }
            orderedCodes.add(raw.trim().toUpperCase(Locale.ROOT));
        }
        if (orderedCodes.isEmpty()) {
            return;
        }
        List<SchoolRole> newRoleEntities = new ArrayList<>();
        for (String code : orderedCodes) {
            SchoolRole r = schoolRoleRepository.findByTenantIdAndCodeAndIsDeletedFalse(tid, code)
                    .orElseThrow(() -> new BusinessException("Unknown school role code: " + code));
            newRoleEntities.add(r);
        }
        replaceUserAssignmentsCore(tid, target, userId, newRoleEntities);
    }

    private List<SchoolRole> loadSchoolRolesForTenantByIds(String tenantId, Collection<Long> roleIds) {
        List<SchoolRole> newRoleEntities = new ArrayList<>();
        for (Long rid : roleIds) {
            SchoolRole r = schoolRoleRepository.findById(rid)
                    .orElseThrow(() -> new BusinessException("Unknown school role id: " + rid));
            if (Boolean.TRUE.equals(r.getIsDeleted()) || r.getTenantId() == null || !tenantId.equals(r.getTenantId())) {
                throw new BusinessException("Invalid school role for this school.");
            }
            newRoleEntities.add(r);
        }
        return newRoleEntities;
    }

    private void replaceUserAssignmentsCore(String tid, User target, Long targetUserId, List<SchoolRole> newRoleEntities) {
        lastAdminEligibility.assertAfterReplaceUserAssignments(tid, targetUserId, newRoleEntities);
        List<UserSchoolRoleAssignment> previous =
                userSchoolRoleAssignmentRepository.findByTenantIdAndUserIdFetchRoles(tid, targetUserId);
        String oldVal = compactAssignmentSnapshot(previous);
        String newVal = newRoleEntities.stream()
                .map(r -> r.getId() + ":" + r.getCode())
                .collect(Collectors.joining(","));
        userSchoolRoleAssignmentRepository.deleteByTenantIdAndUserId(tid, targetUserId);
        for (SchoolRole r : newRoleEntities) {
            UserSchoolRoleAssignment a = new UserSchoolRoleAssignment();
            a.setTenantId(tid);
            a.setUserId(targetUserId);
            a.setSchoolRole(r);
            a.setCreatedAt(LocalDateTime.now());
            userSchoolRoleAssignmentRepository.save(a);
        }
        slimJwtAuthorityCache.evictForUser(tid, targetUserId);
        String tName = target.getName() == null || target.getName().isBlank()
                ? "staff #" + targetUserId
                : target.getName().trim();
        String delta = summarizeSchoolRoleCodesDelta(oldVal, newVal);
        String desc = trimAuditDesc("School roles for " + tName + ": " + delta);
        auditTrailPort.logAction(
                Enums.AuditAction.UPDATE, RbacAuditModule.CODE, desc, targetUserId, "User", oldVal, newVal);
    }

    private static String compactAssignmentSnapshot(List<UserSchoolRoleAssignment> rows) {
        if (rows == null || rows.isEmpty()) {
            return "";
        }
        return rows.stream()
                .map(a -> a.getSchoolRole() == null
                        ? "?"
                        : a.getSchoolRole().getId() + ":" + a.getSchoolRole().getCode())
                .collect(Collectors.joining(","));
    }

    /** Role codes from compact snapshot segments {@code id:ROLE_CODE}. */
    private static Set<String> roleCodesFromAssignmentSnap(String snap) {
        if (snap == null || snap.isBlank()) {
            return Set.of();
        }
        Set<String> out = new LinkedHashSet<>();
        for (String part : snap.split(",")) {
            String p = part.trim();
            if (p.isEmpty()) {
                continue;
            }
            int c = p.indexOf(':');
            String code = c >= 0 ? p.substring(c + 1).trim() : p;
            if (!code.isEmpty() && !"?".equals(code)) {
                out.add(code);
            }
        }
        return out;
    }

    /** One-line friendly delta for audit description (technical snapshot stays in old/new value). */
    private static String summarizeSchoolRoleCodesDelta(String oldSnap, String newSnap) {
        Set<String> prev = roleCodesFromAssignmentSnap(oldSnap);
        Set<String> next = roleCodesFromAssignmentSnap(newSnap);
        List<String> added = next.stream().filter(x -> !prev.contains(x)).sorted().toList();
        List<String> removed = prev.stream().filter(x -> !next.contains(x)).sorted().toList();
        if (added.isEmpty() && removed.isEmpty()) {
            return prev.equals(next) ? "updated" : "assignments refreshed";
        }
        StringBuilder sb = new StringBuilder();
        if (!added.isEmpty()) {
            sb.append("added ").append(String.join(", ", added));
        }
        if (!removed.isEmpty()) {
            if (sb.length() > 0) {
                sb.append("; ");
            }
            sb.append("removed ").append(String.join(", ", removed));
        }
        return sb.toString();
    }

    private static String trimAuditDesc(String s) {
        if (s == null) {
            return "";
        }
        if (s.length() <= 500) {
            return s;
        }
        return s.substring(0, 497) + "...";
    }

    private static boolean hasNonEmptyGroupIds(List<Long> ids) {
        return ids != null && !ids.isEmpty();
    }

    private static boolean hasNonEmptyPermissionNames(List<String> names) {
        if (names == null || names.isEmpty()) {
            return false;
        }
        for (String n : names) {
            if (n != null && !n.isBlank()) {
                return true;
            }
        }
        return false;
    }

    private static void validateCustomRoleComposition(boolean hasGroups, boolean hasPerms) {
        if (!hasGroups && !hasPerms) {
            throw new BusinessException("Choose either permission packs or at least one direct permission.");
        }
    }

    private static EnumSet<AppPermission> parsePermissionNameList(List<String> permissionNames) {
        if (permissionNames == null || permissionNames.isEmpty()) {
            throw new BusinessException("At least one permission is required.");
        }
        EnumSet<AppPermission> set = EnumSet.noneOf(AppPermission.class);
        for (String n : permissionNames) {
            if (n == null || n.isBlank()) {
                continue;
            }
            try {
                set.add(AppPermission.valueOf(n.trim()));
            } catch (IllegalArgumentException e) {
                throw new BusinessException("Unknown permission: " + n);
            }
        }
        if (set.isEmpty()) {
            throw new BusinessException("At least one permission is required.");
        }
        SchoolRbacPermissionCatalog.assertSubset(set);
        return set;
    }

    @Transactional(readOnly = true)
    public List<RbacDTOs.PermissionGroupResponse> listPermissionGroups() {
        return rbacPermissionGroupService.listPermissionGroups(requireTenant());
    }

    @Transactional
    public RbacDTOs.PermissionGroupResponse createPermissionGroup(RbacDTOs.CreatePermissionGroupRequest request) {
        String tid = requireTenant();
        RbacDTOs.PermissionGroupResponse r = rbacPermissionGroupService.createPermissionGroup(tid, request);
        slimJwtAuthorityCache.evictForTenant(tid);
        String desc = trimAuditDesc("Permission pack: " + r.getCode() + " — " + r.getName());
        auditTrailPort.logAction(
                Enums.AuditAction.CREATE, RbacAuditModule.CODE, desc, r.getId(), "PermissionGroup", null, "code=" + r.getCode());
        return r;
    }

    @Transactional
    public RbacDTOs.PermissionGroupResponse updatePermissionGroup(long groupId, RbacDTOs.UpdatePermissionGroupRequest request) {
        String tid = requireTenant();
        RbacDTOs.PermissionGroupResponse r = rbacPermissionGroupService.updatePermissionGroup(tid, groupId, request);
        slimJwtAuthorityCache.evictForTenant(tid);
        String desc = trimAuditDesc("Updated permission pack: " + r.getCode());
        auditTrailPort.logAction(
                Enums.AuditAction.UPDATE, RbacAuditModule.CODE, desc, r.getId(), "PermissionGroup", null, "permCount=" + r.getPermissions().size());
        return r;
    }

    @Transactional
    public void deletePermissionGroup(long groupId) {
        String tid = requireTenant();
        rbacPermissionGroupService.deletePermissionGroup(tid, groupId);
        slimJwtAuthorityCache.evictForTenant(tid);
        String desc = trimAuditDesc("Removed permission pack id=" + groupId);
        auditTrailPort.logAction(Enums.AuditAction.DELETE, RbacAuditModule.CODE, desc, groupId, "PermissionGroup", "id=" + groupId, null);
    }

    private RbacDTOs.SchoolRoleResponse toSchoolRoleResponse(SchoolRole e) {
        RbacDTOs.SchoolRoleResponse r = new RbacDTOs.SchoolRoleResponse();
        r.setId(e.getId());
        r.setCode(e.getCode());
        r.setName(e.getName());
        r.setDescription(e.getDescription());
        r.setSystemRole(Boolean.TRUE.equals(e.getSystemRole()));
        r.setSortOrder(e.getSortOrder() != null ? e.getSortOrder() : 0);
        EnumSet<AppPermission> eff = schoolRolePermissionResolver.resolveEffective(e);
        r.setPermissions(eff.stream().map(AppPermission::name).sorted().toList());
        if (e.getId() != null) {
            r.setPermissionGroupIds(schoolRolePermissionGroupRepository.findPermissionGroupIdsBySchoolRoleId(e.getId()));
            List<RbacDTOs.PermissionGroupSummary> sums = new ArrayList<>();
            for (Object[] row : schoolRolePermissionGroupRepository.findLinkedGroupSummaries(e.getId())) {
                RbacDTOs.PermissionGroupSummary s = new RbacDTOs.PermissionGroupSummary();
                s.setId((Long) row[0]);
                s.setCode((String) row[1]);
                s.setName((String) row[2]);
                sums.add(s);
            }
            r.setPermissionGroups(sums);
        } else {
            r.setPermissionGroupIds(List.of());
            r.setPermissionGroups(List.of());
        }
        return r;
    }

    private String requireTenant() {
        String tid = TenantContext.getTenantId();
        if (tid == null || tid.isBlank()) {
            throw new BusinessException("Tenant context required.");
        }
        return tid;
    }
}
