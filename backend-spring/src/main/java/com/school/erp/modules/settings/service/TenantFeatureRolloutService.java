package com.school.erp.modules.settings.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.config.CacheConfig;
import com.school.erp.modules.settings.entity.TenantConfig;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Super-admin feature rollout per school workspace (backed by {@code tenant_configs.features_json}).
 */
@Service
public class TenantFeatureRolloutService {
    private static final Logger log = LoggerFactory.getLogger(TenantFeatureRolloutService.class);

    private final TenantConfigRepository tenantConfigRepository;
    private final ObjectMapper objectMapper;

    @Autowired(required = false)
    private CacheManager cacheManager;

    public TenantFeatureRolloutService(TenantConfigRepository tenantConfigRepository, ObjectMapper objectMapper) {
        this.tenantConfigRepository = tenantConfigRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public Map<String, Boolean> readFeatures(String tenantId) {
        TenantConfig tc = tenantConfigRepository.findByTenantId(tenantId)
                .filter(c -> !Boolean.TRUE.equals(c.getIsDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException("School workspace not found for tenant: " + tenantId));
        return parse(tc.getFeaturesJson());
    }

    @Transactional
    public Map<String, Boolean> mergeFeatures(String tenantId, Map<String, Boolean> patch) {
        TenantConfig tc = tenantConfigRepository.findByTenantId(tenantId)
                .filter(c -> !Boolean.TRUE.equals(c.getIsDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException("School workspace not found for tenant: " + tenantId));
        try {
            Map<String, Boolean> merged = new HashMap<>(parse(tc.getFeaturesJson()));
            if (patch != null) {
                merged.putAll(patch);
            }
            tc.setFeaturesJson(objectMapper.writeValueAsString(merged));
            tenantConfigRepository.save(tc);
            evictSettingsSnapshot(tenantId);
            log.info("Tenant features merged tenantId={} keys={}", tenantId, patch != null ? patch.size() : 0);
            return merged;
        } catch (Exception e) {
            log.error("Failed to merge tenant features tenantId={}", tenantId, e);
            throw new IllegalStateException("Unable to persist feature flags");
        }
    }

    private Map<String, Boolean> parse(String json) {
        if (json == null || json.isBlank()) {
            return new HashMap<>();
        }
        try {
            return new HashMap<>(objectMapper.readValue(json, new TypeReference<>() {}));
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    private void evictSettingsSnapshot(String tenantId) {
        if (cacheManager == null || tenantId == null || tenantId.isBlank()) {
            return;
        }
        var cache = cacheManager.getCache(CacheConfig.SETTINGS_SNAPSHOT);
        if (cache == null) {
            return;
        }
        cache.evict(tenantId + ":getSettings");
        var flagsCache = cacheManager.getCache(CacheConfig.TENANT_FEATURE_FLAGS);
        if (flagsCache != null) {
            flagsCache.evict(tenantId + ":getFeatureFlags");
        }
    }
}
