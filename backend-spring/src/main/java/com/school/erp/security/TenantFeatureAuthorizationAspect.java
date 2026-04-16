package com.school.erp.security;

import com.school.erp.modules.settings.service.TenantFeatureFlagsService;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

/**
 * Declarative enforcement of tenant module flags on REST controllers (403 when disabled).
 */
@Aspect
@Component
public class TenantFeatureAuthorizationAspect {

    private final TenantFeatureFlagsService tenantFeatureFlagsService;

    public TenantFeatureAuthorizationAspect(TenantFeatureFlagsService tenantFeatureFlagsService) {
        this.tenantFeatureFlagsService = tenantFeatureFlagsService;
    }

    @Around(
            "@within(com.school.erp.security.RequireTenantFeature) || @annotation(com.school.erp.security.RequireTenantFeature)")
    public Object enforceTenantFeature(ProceedingJoinPoint pjp) throws Throwable {
        RequireTenantFeature ann = resolve(pjp);
        if (ann != null) {
            tenantFeatureFlagsService.requireFeatureEnabledForCurrentTenant(ann.value());
        }
        return pjp.proceed();
    }

    private static RequireTenantFeature resolve(ProceedingJoinPoint pjp) {
        MethodSignature sig = (MethodSignature) pjp.getSignature();
        RequireTenantFeature onMethod = sig.getMethod().getAnnotation(RequireTenantFeature.class);
        if (onMethod != null) {
            return onMethod;
        }
        return pjp.getTarget().getClass().getAnnotation(RequireTenantFeature.class);
    }
}
