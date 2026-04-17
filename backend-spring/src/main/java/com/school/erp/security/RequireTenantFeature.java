package com.school.erp.security;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Enforces {@code tenant_configs.features_json} for the current {@link com.school.erp.tenant.TenantContext}
 * before controller entry (see {@link TenantFeatureAuthorizationAspect}). Use stable keys (e.g. {@code chat}, {@code library}).
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequireTenantFeature {

    /** Feature flag key in {@code features_json}. */
    String value();
}
