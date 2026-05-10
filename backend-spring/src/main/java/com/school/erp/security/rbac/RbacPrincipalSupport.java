package com.school.erp.security.rbac;

import com.school.erp.tenant.TenantContext;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Mirrors {@code @PreAuthorize} envelopes in service code where method security already passed but
 * legacy role checks would wrongly narrow access (e.g. payroll desk {@code school_staff} without a
 * linked {@code Teacher} row).
 */
public final class RbacPrincipalSupport {
    private RbacPrincipalSupport() {}

    public static boolean hasAnyAppPermission(AppPermission... perms) {
        if (perms == null || perms.length == 0) {
            return false;
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        for (GrantedAuthority ga : auth.getAuthorities()) {
            String z = ga.getAuthority();
            if (z == null) {
                continue;
            }
            String norm = z.trim();
            for (AppPermission p : perms) {
                if (p != null && p.name().equals(norm)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Tenant-wide payroll payslip operations (PDF, exports): same desk envelope as
     * {@link RbacSpel#PAYROLL_PAYSLIP_READ} excluding teacher self-service (those use linked teacher + payslip id).
     */
    public static boolean hasPayrollPayslipTenantWideDeskAccess() {
        String role = TenantContext.getUserRole();
        if (role != null) {
            String n = role.trim();
            if ("ADMIN".equalsIgnoreCase(n) || "SUPER_ADMIN".equalsIgnoreCase(n)) {
                return true;
            }
        }
        return hasAnyAppPermission(
                AppPermission.SCHOOL_PAYROLL_READ, AppPermission.SCHOOL_PAYROLL_WRITE, AppPermission.TENANT_ADMIN, AppPermission.PLATFORM_ADMIN);
    }
}
