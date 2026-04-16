package com.school.erp.modules.settings.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.modules.settings.entity.TenantConfig;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.tenant.TenantContext;
import com.school.erp.tenant.TenantQueryPolicy;
import java.util.Collections;
import java.util.Map;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Reads module flags from {@code tenant_configs.features_json}. Keys are stable API contracts (e.g. {@value #FEE_REMINDER_AUTOMATION}).
 */
@Service
public class TenantFeatureFlagsService {
    public static final String FEE_REMINDER_AUTOMATION = "feeReminderAutomation";

    private final TenantConfigRepository tenantConfigRepository;
    private final ObjectMapper objectMapper;

    public TenantFeatureFlagsService(TenantConfigRepository tenantConfigRepository, ObjectMapper objectMapper) {
        this.tenantConfigRepository = tenantConfigRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public boolean isFeeReminderAutomationEnabled(String tenantId) {
        return tenantConfigRepository
                .findByTenantId(tenantId)
                .map(TenantConfig::getFeaturesJson)
                .map(this::parseFlags)
                .map(m -> Boolean.TRUE.equals(m.get(FEE_REMINDER_AUTOMATION)))
                .orElse(false);
    }

    /**
     * {@code true} when the flag is absent or not explicitly {@code false} (backward compatible defaults).
     */
    @Transactional(readOnly = true)
    public boolean isFeatureEnabledForTenant(String tenantId, String featureKey) {
        if (featureKey == null || featureKey.isBlank() || tenantId == null || tenantId.isBlank()) {
            return true;
        }
        Map<String, Boolean> flags = tenantConfigRepository
                .findByTenantId(tenantId)
                .map(cfg -> parseFlags(cfg.getFeaturesJson()))
                .orElse(Collections.emptyMap());
        return !Boolean.FALSE.equals(flags.get(featureKey));
    }

    /**
     * Blocks API use when the flag is off for the authenticated school tenant. Platform super-admin without a tenant
     * context may still call cross-tenant support endpoints (tenant id blank).
     */
    public void requireFeatureEnabledForCurrentTenant(String featureKey) {
        if (featureKey == null || featureKey.isBlank()) {
            return;
        }
        String tid = TenantContext.getTenantId();
        if (tid == null || tid.isBlank()) {
            if (TenantQueryPolicy.isPlatformSuperAdmin()) {
                return;
            }
            throw new AccessDeniedException("School workspace context is required for this operation");
        }
        if (!isFeatureEnabledForTenant(tid, featureKey)) {
            throw new AccessDeniedException("This capability is disabled for your school workspace");
        }
    }

    private Map<String, Boolean> parseFlags(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }
}
