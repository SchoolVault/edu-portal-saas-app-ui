package com.school.erp.modules.rbac;

import com.school.erp.security.rbac.AppPermission;

import java.util.Collections;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * App permissions that may appear on tenant-defined school roles (excludes platform / portal-identity only codes).
 */
public final class SchoolRbacPermissionCatalog {
    private static final Set<AppPermission> ASSIGNABLE = EnumSet.complementOf(EnumSet.of(
            AppPermission.PLATFORM_ADMIN,
            AppPermission.PORTAL_PARENT,
            AppPermission.PORTAL_STUDENT));

    private SchoolRbacPermissionCatalog() {
    }

    public static Set<AppPermission> assignableSet() {
        return Collections.unmodifiableSet(EnumSet.copyOf(ASSIGNABLE));
    }

    public static List<String> sortedNames() {
        return ASSIGNABLE.stream()
                .map(AppPermission::name)
                .sorted()
                .collect(Collectors.toList());
    }

    public static void assertSubset(Set<AppPermission> requested) {
        for (AppPermission p : requested) {
            if (!ASSIGNABLE.contains(p)) {
                throw new com.school.erp.common.exception.BusinessException("Permission not allowed on school roles: " + p.name());
            }
        }
    }
}
