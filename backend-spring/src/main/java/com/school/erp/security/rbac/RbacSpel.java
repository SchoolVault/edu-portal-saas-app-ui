package com.school.erp.security.rbac;

/**
 * Central {@code @PreAuthorize} SpEL strings so policy can evolve in one place.
 * Kept as {@code public static final} fields for annotation parameters.
 * <p>Expressions use {@code hasAnyRole} for the legacy {@code Enums.Role} and {@code hasAuthority}
 * for {@link AppPermission} — users receive both in JWT in phase 1.</p>
 */
public final class RbacSpel {
    private RbacSpel() {
    }

    public static final String SCHOOL_FEE_OFFICE = "hasAnyRole('ADMIN','SUPER_ADMIN') or hasAuthority('SCHOOL_FEE_OFFICE') or hasAnyAuthority('TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String FEE_STRUCTURES_READ = "hasAnyRole('ADMIN','TEACHER','SUPER_ADMIN') or hasAnyAuthority('FEE_STRUCTURES_READ','SCHOOL_FEE_OFFICE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_SETTINGS_FINANCE = "hasAnyRole('ADMIN','SUPER_ADMIN') or hasAuthority('SCHOOL_SETTINGS_FINANCE') or hasAnyAuthority('TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_PAYROLL_OFFICE = "hasAnyRole('ADMIN','SUPER_ADMIN') or hasAuthority('SCHOOL_PAYROLL_OFFICE') or hasAnyAuthority('TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_TENANT_SETTINGS = "hasAnyRole('ADMIN','SUPER_ADMIN') or hasAnyAuthority('SCHOOL_SETTINGS_CORE','TENANT_ADMIN','PLATFORM_ADMIN')";

    /**
     * Manage per-staff school responsibility role assignments and read catalog.
     * Same access envelope as other school configuration surfaces in phase 1–2.
     */
    public static final String SCHOOL_RBAC_API = "hasAnyRole('ADMIN','SUPER_ADMIN') or hasAnyAuthority('TENANT_ADMIN','PLATFORM_ADMIN')";
}
