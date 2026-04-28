package com.school.erp.tenant.hibernate;

import com.school.erp.tenant.TenantContext;
import com.school.erp.tenant.TenantQueryPolicy;
import com.school.erp.tenant.AcademicYearContext;
import org.hibernate.Filter;
import org.hibernate.Session;

/**
 * Defense-in-depth: applies Hibernate tenant filter on the persistence context for the current transaction.
 * Service-layer {@code findByIdAndTenantId} predicates remain recommended for clarity and for {@code SUPER_ADMIN},
 * where this filter is intentionally not enabled.
 */
public final class TenantHibernateFilterSupport {

    private TenantHibernateFilterSupport() {}

    public static void enableTenantFilterIfNeeded(Session session) {
        if (session == null) {
            return;
        }
        if (TenantQueryPolicy.isPlatformSuperAdmin()) {
            return;
        }
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            return;
        }
        Filter filter = session.enableFilter(TenantScopedFilter.NAME);
        filter.setParameter("tenantId", tenantId);

        Long academicYearId = AcademicYearContext.getAcademicYearId();
        if (academicYearId != null) {
            Filter academicYearFilter = session.enableFilter(AcademicYearScopedFilter.NAME);
            academicYearFilter.setParameter("academicYearId", academicYearId);
        }
    }
}
