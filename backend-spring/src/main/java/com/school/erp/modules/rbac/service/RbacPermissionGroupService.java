package com.school.erp.modules.rbac.service;

import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.rbac.RbacPermissionCodec;
import com.school.erp.modules.rbac.SchoolRbacPermissionCatalog;
import com.school.erp.modules.rbac.dto.RbacDTOs;
import com.school.erp.modules.rbac.entity.GroupPermission;
import com.school.erp.modules.rbac.entity.PermissionGroup;
import com.school.erp.modules.rbac.entity.SchoolRole;
import com.school.erp.modules.rbac.entity.SchoolRolePermissionGroup;
import com.school.erp.modules.rbac.repository.GroupPermissionRepository;
import com.school.erp.modules.rbac.repository.PermissionGroupRepository;
import com.school.erp.modules.rbac.repository.SchoolRolePermissionGroupRepository;
import com.school.erp.modules.rbac.repository.SchoolRoleRepository;
import com.school.erp.security.rbac.AppPermission;
import com.school.erp.security.rbac.SlimJwtAuthorityCache;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

/**
 * Tenant permission packs (groups), junction to {@link SchoolRole}, and idempotent bootstrap that mirrors
 * legacy {@code permissions_csv} into one inline bundle per role when no links exist yet.
 */
@Service
public class RbacPermissionGroupService {

    private final PermissionGroupRepository permissionGroupRepository;
    private final GroupPermissionRepository groupPermissionRepository;
    private final SchoolRolePermissionGroupRepository schoolRolePermissionGroupRepository;
    private final SchoolRoleRepository schoolRoleRepository;
    private final SlimJwtAuthorityCache slimJwtAuthorityCache;

    public RbacPermissionGroupService(
            PermissionGroupRepository permissionGroupRepository,
            GroupPermissionRepository groupPermissionRepository,
            SchoolRolePermissionGroupRepository schoolRolePermissionGroupRepository,
            SchoolRoleRepository schoolRoleRepository,
            SlimJwtAuthorityCache slimJwtAuthorityCache) {
        this.permissionGroupRepository = permissionGroupRepository;
        this.groupPermissionRepository = groupPermissionRepository;
        this.schoolRolePermissionGroupRepository = schoolRolePermissionGroupRepository;
        this.schoolRoleRepository = schoolRoleRepository;
        this.slimJwtAuthorityCache = slimJwtAuthorityCache;
    }

    /** After catalog seed / on login bootstrap: each school role gets a linked bundle mirroring its CSV when empty. */
    @Transactional
    public void ensureLinkedBundlesForTenant(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return;
        }
        boolean touched = false;
        for (SchoolRole r : schoolRoleRepository.findByTenantIdAndIsDeletedFalseOrderBySortOrderAscNameAsc(tenantId)) {
            if (r.getId() == null) {
                continue;
            }
            if (schoolRolePermissionGroupRepository.countBySchoolRoleId(r.getId()) > 0) {
                continue;
            }
            EnumSet<AppPermission> perms =
                    EnumSet.copyOf(RbacPermissionCodec.parsePermissionsCsv(r.getPermissionsCsv()));
            if (perms.isEmpty()) {
                continue;
            }
            syncInlineBundleForRole(r, perms, Boolean.TRUE.equals(r.getSystemRole()));
            touched = true;
        }
        if (touched) {
            slimJwtAuthorityCache.evictForTenant(tenantId);
        }
    }

    /**
     * Rebuilds the synthetic per-role bundle {@code BNDL_R<roleId>} and attaches it as the sole link.
     * Used for “direct permission matrix” edits on custom roles and for bootstrap.
     */
    @Transactional
    public void syncInlineBundleForRole(SchoolRole role, EnumSet<AppPermission> perms, boolean markGroupAsSystemTemplate) {
        if (role.getId() == null || role.getTenantId() == null) {
            throw new BusinessException("School role must be persisted before permission groups can be linked.");
        }
        SchoolRbacPermissionCatalog.assertSubset(perms);
        String tid = role.getTenantId();
        String code = inlineBundleCode(role.getId());
        PermissionGroup g = permissionGroupRepository
                .findByTenantIdAndCode(tid, code)
                .map(existing -> reviveIfSoftDeleted(existing))
                .orElseGet(() -> newInlineGroup(tid, code, role.getName(), markGroupAsSystemTemplate, role.getSortOrder()));
        g.setName(bundleDisplayName(role));
        g.setDescription("Auto-managed permission pack for school role " + role.getCode());
        g.setSortOrder(role.getSortOrder() != null ? role.getSortOrder() : 0);
        g.setSystemTemplate(markGroupAsSystemTemplate);
        permissionGroupRepository.save(g);
        schoolRolePermissionGroupRepository.deleteBySchoolRoleId(role.getId());
        groupPermissionRepository.deleteByPermissionGroupId(g.getId());
        persistGrants(tid, g, perms);
        linkRoleToGroup(tid, role, g, 0);
        role.setPermissionsCsv(RbacPermissionCodec.toCsv(perms));
        schoolRoleRepository.save(role);
    }

    @Transactional
    public void replaceSchoolRoleWithLinkedGroups(String tenantId, SchoolRole role, List<Long> groupIds) {
        if (role.getId() == null) {
            throw new BusinessException("School role must be persisted.");
        }
        LinkedHashSet<Long> ordered = new LinkedHashSet<>();
        if (groupIds != null) {
            for (Long id : groupIds) {
                if (id != null) {
                    ordered.add(id);
                }
            }
        }
        if (ordered.isEmpty()) {
            throw new BusinessException("At least one permission group is required.");
        }
        EnumSet<AppPermission> merged = EnumSet.noneOf(AppPermission.class);
        List<PermissionGroup> resolved = new ArrayList<>();
        for (Long gid : ordered) {
            PermissionGroup g = permissionGroupRepository
                    .findByTenantIdAndIdAndIsDeletedFalse(tenantId, gid)
                    .orElseThrow(() -> new BusinessException("Unknown permission group id: " + gid));
            resolved.add(g);
            for (GroupPermission gp : groupPermissionRepository.findByPermissionGroupIdOrderByPermissionCodeAsc(
                    g.getId())) {
                try {
                    merged.add(AppPermission.valueOf(gp.getPermissionCode().trim()));
                } catch (IllegalArgumentException ignored) {
                    // ignore unknown historical rows
                }
            }
        }
        SchoolRbacPermissionCatalog.assertSubset(merged);
        schoolRolePermissionGroupRepository.deleteBySchoolRoleId(role.getId());
        int ord = 0;
        for (PermissionGroup g : resolved) {
            linkRoleToGroup(tenantId, role, g, ord++);
        }
        role.setPermissionsCsv(RbacPermissionCodec.toCsv(merged));
        schoolRoleRepository.save(role);
    }

    @Transactional
    public void detachAndSoftDeleteExclusiveBundles(String tenantId, long schoolRoleId) {
        List<Long> gids = schoolRolePermissionGroupRepository.findPermissionGroupIdsBySchoolRoleId(schoolRoleId);
        schoolRolePermissionGroupRepository.deleteBySchoolRoleId(schoolRoleId);
        for (Long gid : gids) {
            if (gid == null) {
                continue;
            }
            if (schoolRolePermissionGroupRepository.countByPermissionGroupId(gid) > 0) {
                continue;
            }
            permissionGroupRepository
                    .findByTenantIdAndIdAndIsDeletedFalse(tenantId, gid)
                    .filter(g -> !Boolean.TRUE.equals(g.getSystemTemplate()))
                    .ifPresent(g -> {
                        groupPermissionRepository.deleteByPermissionGroupId(g.getId());
                        g.markSoftDeleted();
                        permissionGroupRepository.save(g);
                    });
        }
    }

    @Transactional(readOnly = true)
    public List<RbacDTOs.PermissionGroupResponse> listPermissionGroups(String tenantId) {
        return permissionGroupRepository.findByTenantIdAndIsDeletedFalseOrderBySortOrderAscNameAsc(tenantId).stream()
                .map(this::toGroupResponse)
                .toList();
    }

    @Transactional
    public RbacDTOs.PermissionGroupResponse createPermissionGroup(String tenantId, RbacDTOs.CreatePermissionGroupRequest req) {
        String code = req.getCode().trim().toUpperCase(Locale.ROOT);
        if (permissionGroupRepository.findByTenantIdAndCodeAndIsDeletedFalse(tenantId, code).isPresent()) {
            throw new BusinessException("A permission group with this code already exists.");
        }
        EnumSet<AppPermission> perms = parseAndAssertAssignable(req.getPermissions());
        PermissionGroup g = new PermissionGroup();
        g.setTenantId(tenantId);
        g.setCode(code);
        g.setName(req.getName().trim());
        g.setDescription(req.getDescription() == null ? null : req.getDescription().trim());
        g.setSortOrder(req.getSortOrder());
        g.setSystemTemplate(false);
        g.setIsActive(true);
        g.setIsDeleted(false);
        permissionGroupRepository.save(g);
        persistGrants(tenantId, g, perms);
        return toGroupResponse(permissionGroupRepository.findByTenantIdAndIdAndIsDeletedFalse(tenantId, g.getId()).orElse(g));
    }

    @Transactional
    public RbacDTOs.PermissionGroupResponse updatePermissionGroup(
            String tenantId, long groupId, RbacDTOs.UpdatePermissionGroupRequest req) {
        PermissionGroup g = permissionGroupRepository
                .findByTenantIdAndIdAndIsDeletedFalse(tenantId, groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Permission group", groupId));
        if (Boolean.TRUE.equals(g.getSystemTemplate())) {
            throw new BusinessException("System template permission packs cannot be modified.");
        }
        EnumSet<AppPermission> perms = parseAndAssertAssignable(req.getPermissions());
        g.setName(req.getName().trim());
        g.setDescription(req.getDescription() == null ? null : req.getDescription().trim());
        g.setSortOrder(req.getSortOrder());
        permissionGroupRepository.save(g);
        groupPermissionRepository.deleteByPermissionGroupId(g.getId());
        persistGrants(tenantId, g, perms);
        return toGroupResponse(g);
    }

    @Transactional
    public void deletePermissionGroup(String tenantId, long groupId) {
        PermissionGroup g = permissionGroupRepository
                .findByTenantIdAndIdAndIsDeletedFalse(tenantId, groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Permission group", groupId));
        if (Boolean.TRUE.equals(g.getSystemTemplate())) {
            throw new BusinessException("System template permission packs cannot be deleted.");
        }
        schoolRolePermissionGroupRepository.deleteByPermissionGroupId(g.getId());
        groupPermissionRepository.deleteByPermissionGroupId(g.getId());
        g.markSoftDeleted();
        permissionGroupRepository.save(g);
    }

    @Transactional(readOnly = true)
    public EnumSet<AppPermission> unionPermissionsForGroupIds(String tenantId, List<Long> groupIds) {
        LinkedHashSet<Long> ordered = new LinkedHashSet<>();
        if (groupIds != null) {
            for (Long id : groupIds) {
                if (id != null) {
                    ordered.add(id);
                }
            }
        }
        EnumSet<AppPermission> merged = EnumSet.noneOf(AppPermission.class);
        for (Long gid : ordered) {
            PermissionGroup g = permissionGroupRepository
                    .findByTenantIdAndIdAndIsDeletedFalse(tenantId, gid)
                    .orElseThrow(() -> new BusinessException("Unknown permission group id: " + gid));
            for (GroupPermission gp : groupPermissionRepository.findByPermissionGroupIdOrderByPermissionCodeAsc(
                    g.getId())) {
                try {
                    merged.add(AppPermission.valueOf(gp.getPermissionCode().trim()));
                } catch (IllegalArgumentException ignored) {
                    // ignore
                }
            }
        }
        SchoolRbacPermissionCatalog.assertSubset(merged);
        return merged;
    }

    private PermissionGroup newInlineGroup(
            String tenantId, String code, String roleName, boolean systemTemplate, Integer sortOrder) {
        PermissionGroup g = new PermissionGroup();
        g.setTenantId(tenantId);
        g.setCode(code);
        g.setName(roleName == null ? code : roleName);
        g.setDescription("Auto-managed permission pack");
        g.setSortOrder(sortOrder != null ? sortOrder : 0);
        g.setSystemTemplate(systemTemplate);
        g.setIsActive(true);
        g.setIsDeleted(false);
        permissionGroupRepository.save(g);
        return g;
    }

    private static PermissionGroup reviveIfSoftDeleted(PermissionGroup existing) {
        if (Boolean.TRUE.equals(existing.getIsDeleted())) {
            existing.setIsDeleted(false);
            existing.setDeletedAt(null);
            existing.setIsActive(true);
        }
        return existing;
    }

    private static String inlineBundleCode(long roleId) {
        return "BNDL_R" + roleId;
    }

    private static String bundleDisplayName(SchoolRole role) {
        return (role.getName() == null || role.getName().isBlank() ? role.getCode() : role.getName()) + " (pack)";
    }

    private void persistGrants(String tenantId, PermissionGroup g, EnumSet<AppPermission> perms) {
        LocalDateTime now = LocalDateTime.now();
        for (AppPermission p : perms) {
            GroupPermission gp = new GroupPermission();
            gp.setTenantId(tenantId);
            gp.setPermissionGroup(g);
            gp.setPermissionCode(p.name());
            gp.setCreatedAt(now);
            groupPermissionRepository.save(gp);
        }
    }

    private void linkRoleToGroup(String tenantId, SchoolRole role, PermissionGroup g, int sortOrder) {
        SchoolRolePermissionGroup link = new SchoolRolePermissionGroup();
        link.setTenantId(tenantId);
        link.setSchoolRole(role);
        link.setPermissionGroup(g);
        link.setSortOrder(sortOrder);
        link.setCreatedAt(LocalDateTime.now());
        schoolRolePermissionGroupRepository.save(link);
    }

    private RbacDTOs.PermissionGroupResponse toGroupResponse(PermissionGroup g) {
        RbacDTOs.PermissionGroupResponse r = new RbacDTOs.PermissionGroupResponse();
        r.setId(g.getId());
        r.setCode(g.getCode());
        r.setName(g.getName());
        r.setDescription(g.getDescription());
        r.setSystemTemplate(Boolean.TRUE.equals(g.getSystemTemplate()));
        r.setSortOrder(g.getSortOrder() != null ? g.getSortOrder() : 0);
        r.setPermissions(
                groupPermissionRepository.findByPermissionGroupIdOrderByPermissionCodeAsc(g.getId()).stream()
                        .map(GroupPermission::getPermissionCode)
                        .filter(Objects::nonNull)
                        .map(String::trim)
                        .sorted()
                        .toList());
        return r;
    }

    private static EnumSet<AppPermission> parseAndAssertAssignable(List<String> names) {
        if (names == null || names.isEmpty()) {
            throw new BusinessException("At least one permission is required.");
        }
        EnumSet<AppPermission> out = EnumSet.noneOf(AppPermission.class);
        for (String n : names) {
            if (n == null || n.isBlank()) {
                continue;
            }
            try {
                out.add(AppPermission.valueOf(n.trim()));
            } catch (IllegalArgumentException e) {
                throw new BusinessException("Unknown permission: " + n);
            }
        }
        if (out.isEmpty()) {
            throw new BusinessException("At least one permission is required.");
        }
        SchoolRbacPermissionCatalog.assertSubset(out);
        return out;
    }
}
