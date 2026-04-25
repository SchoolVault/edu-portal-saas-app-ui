package com.school.erp.modules.rbac;

import com.school.erp.security.rbac.AppPermission;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.EnumSet;
import java.util.Set;

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
}
