package com.school.erp.modules.rbac;

import com.school.erp.security.rbac.AppPermission;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collection;
import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;

/** Parses CSV of {@link AppPermission} names stored on {@link com.school.erp.modules.rbac.entity.SchoolRole}. */
public final class RbacPermissionCodec {
    private static final Logger log = LoggerFactory.getLogger(RbacPermissionCodec.class);

    private RbacPermissionCodec() {
    }

    public static Set<AppPermission> parsePermissionsCsv(String csv) {
        if (csv == null || csv.isBlank()) {
            return Set.of();
        }
        EnumSet<AppPermission> out = EnumSet.noneOf(AppPermission.class);
        for (String p : csv.split(",")) {
            String t = p == null ? "" : p.trim();
            if (t.isEmpty()) {
                continue;
            }
            try {
                out.add(AppPermission.valueOf(t));
            } catch (IllegalArgumentException e) {
                log.warn("Ignoring unknown AppPermission in school role csv token={}", t);
            }
        }
        return out;
    }

    /** Stable CSV for persisting on {@link com.school.erp.modules.rbac.entity.SchoolRole} (sorted names). */
    public static String toCsv(Collection<AppPermission> permissions) {
        if (permissions == null || permissions.isEmpty()) {
            return "";
        }
        return permissions.stream()
                .map(AppPermission::name)
                .sorted()
                .collect(Collectors.joining(","));
    }
}
