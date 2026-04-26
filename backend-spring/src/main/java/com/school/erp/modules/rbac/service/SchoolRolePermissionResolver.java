package com.school.erp.modules.rbac.service;

import com.school.erp.modules.rbac.RbacPermissionCodec;
import com.school.erp.modules.rbac.entity.SchoolRole;
import com.school.erp.modules.rbac.repository.SchoolRolePermissionGroupRepository;
import com.school.erp.security.rbac.AppPermission;
import org.springframework.stereotype.Component;

import java.util.EnumSet;
import java.util.List;

/**
 * Resolves effective {@link AppPermission}s for a {@link SchoolRole}: linked permission groups win when present;
 * otherwise {@code permissions_csv} is used (legacy / denormalized cache).
 */
@Component
public class SchoolRolePermissionResolver {

    private final SchoolRolePermissionGroupRepository schoolRolePermissionGroupRepository;

    public SchoolRolePermissionResolver(SchoolRolePermissionGroupRepository schoolRolePermissionGroupRepository) {
        this.schoolRolePermissionGroupRepository = schoolRolePermissionGroupRepository;
    }

    public EnumSet<AppPermission> resolveEffective(SchoolRole role) {
        if (role == null) {
            return EnumSet.noneOf(AppPermission.class);
        }
        if (role.getId() != null && role.getTenantId() != null && !role.getTenantId().isBlank()) {
            List<String> fromLinks =
                    schoolRolePermissionGroupRepository.findDistinctPermissionCodesBySchoolRole(
                            role.getTenantId(), role.getId());
            if (!fromLinks.isEmpty()) {
                return parseCodes(fromLinks);
            }
        }
        return EnumSet.copyOf(RbacPermissionCodec.parsePermissionsCsv(role.getPermissionsCsv()));
    }

    private static EnumSet<AppPermission> parseCodes(List<String> codes) {
        EnumSet<AppPermission> out = EnumSet.noneOf(AppPermission.class);
        for (String c : codes) {
            if (c == null || c.isBlank()) {
                continue;
            }
            try {
                out.add(AppPermission.valueOf(c.trim()));
            } catch (IllegalArgumentException ignored) {
                // same tolerance as CSV parser
            }
        }
        return out;
    }
}
