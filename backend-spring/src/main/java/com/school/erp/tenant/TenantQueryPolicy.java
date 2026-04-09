package com.school.erp.tenant;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.exception.ResourceNotFoundException;

/**
 * Central rules for multi-tenant reads: school users are scoped to {@link TenantContext#getTenantId()};
 * platform super-admins may resolve rows across tenants (explicit platform / support use cases).
 * <p>Hibernate also applies a {@code tenantScoped} filter on {@link com.school.erp.common.entity.BaseEntity}
 * per transaction for non–super-admin users (see {@link com.school.erp.tenant.hibernate.TenantAwareJpaTransactionManager}).</p>
 */
public final class TenantQueryPolicy {

    private TenantQueryPolicy() {}

    /**
     * Matches JWT claim {@code role} from login (e.g. {@code SUPER_ADMIN}).
     */
    public static boolean isPlatformSuperAdmin() {
        String r = TenantContext.getUserRole();
        if (r == null) {
            return false;
        }
        String n = r.trim();
        return "SUPER_ADMIN".equalsIgnoreCase(n) || "super_admin".equalsIgnoreCase(n);
    }

    /**
     * After a global {@code findById}, enforce that the row belongs to the current tenant unless the caller is platform super-admin.
     * Wrong-tenant access is answered with {@link ResourceNotFoundException} to avoid IDOR hints.
     */
    public static void assertTenantReadable(BaseEntity entity) {
        if (entity == null) {
            return;
        }
        if (isPlatformSuperAdmin()) {
            return;
        }
        String ctx = TenantContext.getTenantId();
        if (ctx == null || entity.getTenantId() == null || !ctx.equals(entity.getTenantId())) {
            throw new ResourceNotFoundException("Resource", entity.getId());
        }
    }
}
