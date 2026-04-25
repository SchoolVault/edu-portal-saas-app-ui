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
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Per-tenant school role catalog, custom role definitions, and user↔responsibility assignments.
 * Portal {@link Enums.Role} on {@link User} remains the login / identity class; this layer stacks operational responsibilities.
 */
@Service
public class RbacService {

    private static final Set<Enums.Role> ASSIGNABLE_PORTAL_ROLES = EnumSet.of(
            Enums.Role.ADMIN, Enums.Role.TEACHER, Enums.Role.LIBRARY_STAFF);

    private final SchoolRoleRepository schoolRoleRepository;
    private final UserSchoolRoleAssignmentRepository userSchoolRoleAssignmentRepository;
    private final UserRepository userRepository;
    private final RbacLastAdminEligibility lastAdminEligibility;
    private final SlimJwtAuthorityCache slimJwtAuthorityCache;
    private final AuditTrailPort auditTrailPort;

    public RbacService(
            SchoolRoleRepository schoolRoleRepository,
            UserSchoolRoleAssignmentRepository userSchoolRoleAssignmentRepository,
            UserRepository userRepository,
            RbacLastAdminEligibility lastAdminEligibility,
            SlimJwtAuthorityCache slimJwtAuthorityCache,
            AuditTrailPort auditTrailPort) {
        this.schoolRoleRepository = schoolRoleRepository;
        this.userSchoolRoleAssignmentRepository = userSchoolRoleAssignmentRepository;
        this.userRepository = userRepository;
        this.lastAdminEligibility = lastAdminEligibility;
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
        String csv = toPermissionsCsv(request.getPermissions());
        SchoolRole e = new SchoolRole();
        e.setTenantId(tid);
        e.setCode(code);
        e.setName(request.getName().trim());
        e.setDescription(request.getDescription() == null ? null : request.getDescription().trim());
        e.setSystemRole(false);
        e.setSortOrder(request.getSortOrder());
        e.setPermissionsCsv(csv);
        e.setIsActive(true);
        e.setIsDeleted(false);
        schoolRoleRepository.save(e);
        slimJwtAuthorityCache.evictForTenant(tid);
        int permCount = RbacPermissionCodec.parsePermissionsCsv(e.getPermissionsCsv()).size();
        String desc = trimAuditDesc("Custom school role: " + e.getCode() + " — " + e.getName());
        auditTrailPort.logAction(
                Enums.AuditAction.CREATE,
                RbacAuditModule.CODE,
                desc,
                e.getId(),
                "SchoolRole",
                null,
                "code=" + e.getCode() + ",permCount=" + permCount);
        return toSchoolRoleResponse(e);
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
        String beforeSnap = "name=" + e.getName() + ";sort=" + e.getSortOrder() + ";permCount="
                + RbacPermissionCodec.parsePermissionsCsv(e.getPermissionsCsv()).size();
        String csv = toPermissionsCsv(request.getPermissions());
        SchoolRole preview = new SchoolRole();
        preview.setId(e.getId());
        preview.setPermissionsCsv(csv);
        lastAdminEligibility.assertAfterCustomRoleContentChange(tid, e.getId(), preview);
        e.setName(request.getName().trim());
        e.setDescription(request.getDescription() == null ? null : request.getDescription().trim());
        e.setSortOrder(request.getSortOrder());
        e.setPermissionsCsv(csv);
        schoolRoleRepository.save(e);
        slimJwtAuthorityCache.evictForTenant(tid);
        String afterSnap = "name=" + e.getName() + ";sort=" + e.getSortOrder() + ";permCount="
                + RbacPermissionCodec.parsePermissionsCsv(e.getPermissionsCsv()).size();
        String desc = trimAuditDesc("Updated custom school role: " + e.getCode());
        auditTrailPort.logAction(
                Enums.AuditAction.UPDATE, RbacAuditModule.CODE, desc, e.getId(), "SchoolRole", beforeSnap, afterSnap);
        return toSchoolRoleResponse(e);
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
        List<SchoolRole> newRoleEntities = new ArrayList<>();
        for (Long rid : distinct) {
            SchoolRole r = schoolRoleRepository.findById(rid)
                    .orElseThrow(() -> new BusinessException("Unknown school role id: " + rid));
            if (Boolean.TRUE.equals(r.getIsDeleted()) || r.getTenantId() == null || !tid.equals(r.getTenantId())) {
                throw new BusinessException("Invalid school role for this school.");
            }
            newRoleEntities.add(r);
        }
        lastAdminEligibility.assertAfterReplaceUserAssignments(tid, targetUserId, newRoleEntities);
        List<UserSchoolRoleAssignment> previous =
                userSchoolRoleAssignmentRepository.findByTenantIdAndUserIdFetchRoles(tid, targetUserId);
        String oldVal = compactAssignmentSnapshot(previous);
        String newVal = newRoleEntities.stream()
                .map(r -> r.getId() + ":" + r.getCode())
                .collect(Collectors.joining(","));
        userSchoolRoleAssignmentRepository.deleteByTenantIdAndUserId(tid, targetUserId);
        for (Long rid : distinct) {
            SchoolRole r = schoolRoleRepository.findById(rid).orElseThrow();
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
        return getUserAssignments(targetUserId);
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

    private String toPermissionsCsv(List<String> permissionNames) {
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
        return set.stream()
                .map(AppPermission::name)
                .sorted()
                .collect(Collectors.joining(","));
    }

    private RbacDTOs.SchoolRoleResponse toSchoolRoleResponse(SchoolRole e) {
        RbacDTOs.SchoolRoleResponse r = new RbacDTOs.SchoolRoleResponse();
        r.setId(e.getId());
        r.setCode(e.getCode());
        r.setName(e.getName());
        r.setDescription(e.getDescription());
        r.setSystemRole(Boolean.TRUE.equals(e.getSystemRole()));
        r.setSortOrder(e.getSortOrder() != null ? e.getSortOrder() : 0);
        r.setPermissions(
                RbacPermissionCodec.parsePermissionsCsv(e.getPermissionsCsv()).stream()
                        .map(AppPermission::name)
                        .sorted()
                        .toList());
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
