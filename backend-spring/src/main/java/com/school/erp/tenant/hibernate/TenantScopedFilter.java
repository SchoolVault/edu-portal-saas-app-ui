package com.school.erp.tenant.hibernate;

/**
 * Hibernate {@link org.hibernate.annotations.Filter} name applied to {@link com.school.erp.common.entity.BaseEntity}
 * subclasses. Enabled per-transaction for non–platform users; skipped for {@code SUPER_ADMIN}.
 */
public final class TenantScopedFilter {

    public static final String NAME = "tenantScoped";

    private TenantScopedFilter() {}
}
