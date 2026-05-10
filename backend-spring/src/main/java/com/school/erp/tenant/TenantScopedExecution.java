package com.school.erp.tenant;

import java.util.function.Supplier;

/**
 * Utility for running background/scheduled work with explicit tenant/user/role context
 * while safely restoring any previously-bound thread-local values afterwards.
 */
public final class TenantScopedExecution {

    private TenantScopedExecution() {
    }

    public static void run(String tenantId, Long userId, String role, Runnable task) {
        execute(tenantId, userId, role, () -> {
            task.run();
            return null;
        });
    }

    public static <T> T execute(String tenantId, Long userId, String role, Supplier<T> supplier) {
        final String prevTenant = TenantContext.getTenantId();
        final Long previousAcademicYearId = AcademicYearContext.getAcademicYearId();
        final Long prevUserId = TenantContext.getUserId();
        final String prevRole = TenantContext.getUserRole();
        try {
            TenantContext.clear();
            AcademicYearContext.clear();
            if (tenantId != null && !tenantId.isBlank()) {
                TenantContext.setTenantId(tenantId);
            }
            if (userId != null) {
                TenantContext.setUserId(userId);
            }
            if (role != null && !role.isBlank()) {
                TenantContext.setUserRole(role);
            }
            return supplier.get();
        } finally {
            TenantContext.clear();
            AcademicYearContext.clear();
            if (previousAcademicYearId != null) {
                AcademicYearContext.setAcademicYearId(previousAcademicYearId);
            }
            if (prevTenant != null && !prevTenant.isBlank()) {
                TenantContext.setTenantId(prevTenant);
            }
            if (prevUserId != null) {
                TenantContext.setUserId(prevUserId);
            }
            if (prevRole != null && !prevRole.isBlank()) {
                TenantContext.setUserRole(prevRole);
            }
        }
    }
}
