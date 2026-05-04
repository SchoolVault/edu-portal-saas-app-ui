package com.school.erp.modules.settings.service;

import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.settings.dto.SchoolBranchDTO;
import com.school.erp.modules.settings.entity.TenantConfig;
import com.school.erp.modules.settings.policy.TenantModuleFeaturePolicy;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.tenant.TenantContext;
import com.school.erp.config.CacheConfig;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SettingsService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(SettingsService.class);
    private final TenantConfigRepository repo;
    private final ObjectMapper objectMapper;

    /** Matches {@code tenantMethodNameKeyGenerator} root for explicit {@link CacheEvict} keys. */
    public static String tenantCacheRoot() {
        String tid = TenantContext.getTenantId();
        return (tid == null || tid.isBlank()) ? "_no_tenant_" : tid;
    }

    @Cacheable(cacheNames = CacheConfig.SETTINGS_SNAPSHOT, keyGenerator = "tenantMethodNameKeyGenerator")
    @Transactional(readOnly = true)
    public TenantConfig getSettings() {
        return repo.findByTenantId(TenantContext.getTenantId()).orElseThrow(() -> new ResourceNotFoundException("Tenant settings not configured"));
    }

    @Caching(evict = {
            @CacheEvict(cacheNames = CacheConfig.SETTINGS_SNAPSHOT, key = "T(com.school.erp.modules.settings.service.SettingsService).tenantCacheRoot() + ':getSettings'"),
            @CacheEvict(cacheNames = CacheConfig.TENANT_FEATURE_FLAGS, key = "T(com.school.erp.modules.settings.service.SettingsService).tenantCacheRoot() + ':getFeatureFlags'")
    })
    @Transactional
    public TenantConfig updateSettings(TenantConfig update) {
        String t = TenantContext.getTenantId();
        TenantConfig config = repo.findByTenantId(t).orElse(new TenantConfig());
        config.setTenantId(t);
        if (update.getSchoolName() != null) {
            config.setSchoolName(update.getSchoolName());
        }
        if (update.getAddress() != null) {
            config.setAddress(update.getAddress());
        }
        if (update.getPhone() != null) {
            config.setPhone(update.getPhone());
        }
        if (update.getEmail() != null) {
            config.setEmail(update.getEmail());
        }
        if (update.getPrimaryColor() != null) {
            config.setPrimaryColor(update.getPrimaryColor());
        }
        if (update.getSecondaryColor() != null) {
            config.setSecondaryColor(update.getSecondaryColor());
        }
        if (update.getLogo() != null) {
            config.setLogo(update.getLogo());
        }
        if (update.getFeaturesJson() != null) {
            config.setFeaturesJson(update.getFeaturesJson());
        }
        if (update.getLeaveSmsApplyTemplate() != null) {
            config.setLeaveSmsApplyTemplate(update.getLeaveSmsApplyTemplate());
        }
        if (update.getLeaveSmsDecisionTemplate() != null) {
            config.setLeaveSmsDecisionTemplate(update.getLeaveSmsDecisionTemplate());
        }
        if (update.getLibraryFinePerDay() != null) {
            config.setLibraryFinePerDay(update.getLibraryFinePerDay());
        }
        /*
         * Intentionally no automatic sync into ADMIN {@link com.school.erp.modules.auth.entity.User} rows.
         * Tenant config phone/email are school-level public listings; administrator login identity stays on the User.
         */
        return repo.save(config);
    }

    @Cacheable(cacheNames = CacheConfig.TENANT_FEATURE_FLAGS, keyGenerator = "tenantMethodNameKeyGenerator")
    @Transactional(readOnly = true)
    public Map<String, Boolean> getFeatureFlags() {
        TenantConfig config = repo.findByTenantId(TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Tenant settings not configured"));
        return parseFeatureFlags(config);
    }

    private Map<String, Boolean> parseFeatureFlags(TenantConfig config) {
        try {
            if (config.getFeaturesJson() != null) {
                return objectMapper.readValue(config.getFeaturesJson(), new TypeReference<>() {
                });
            }
        } catch (Exception e) {
            log.warn("Failed to parse features JSON: {}", e.getMessage());
        }
        return Map.of();
    }

    @Caching(evict = {
            @CacheEvict(cacheNames = CacheConfig.SETTINGS_SNAPSHOT, key = "T(com.school.erp.modules.settings.service.SettingsService).tenantCacheRoot() + ':getSettings'"),
            @CacheEvict(cacheNames = CacheConfig.TENANT_FEATURE_FLAGS, key = "T(com.school.erp.modules.settings.service.SettingsService).tenantCacheRoot() + ':getFeatureFlags'")
    })
    @Transactional
    public Map<String, Boolean> updateFeatureFlags(Map<String, Boolean> flags) {
        TenantConfig config = repo.findByTenantId(TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Tenant settings not configured"));
        try {
            Map<String, Boolean> merged = new HashMap<>(parseFeatureFlags(config));
            Map<String, Boolean> safe = flags != null ? new HashMap<>(flags) : new HashMap<>();
            safe.keySet().removeIf(TenantModuleFeaturePolicy::isPlatformManaged);
            merged.putAll(safe);
            config.setFeaturesJson(objectMapper.writeValueAsString(merged));
            repo.save(config);
            return merged;
        } catch (Exception e) {
            log.error("Failed to save features JSON", e);
        }
        return parseFeatureFlags(config);
    }

    /**
     * All tenant configs that share the same school code (sibling branches / campuses).
     */
    @Transactional(readOnly = true)
    public List<SchoolBranchDTO> listBranchesBySchoolCode(String schoolCodeParam) {
        String t = TenantContext.getTenantId();
        TenantConfig self = repo.findByTenantId(t).orElseThrow(() -> new ResourceNotFoundException("Tenant settings not configured"));
        String code = (schoolCodeParam != null && !schoolCodeParam.isBlank()) ? schoolCodeParam.trim() : self.getSchoolCode();
        return repo.findAllBySchoolCodeOrderBySchoolNameAsc(code).stream().map(row -> {
            SchoolBranchDTO d = new SchoolBranchDTO();
            d.setTenantId(row.getTenantId());
            d.setSchoolName(row.getSchoolName());
            d.setSchoolCode(row.getSchoolCode());
            d.setAddress(row.getAddress());
            d.setPhone(row.getPhone());
            d.setEmail(row.getEmail());
            d.setCurrentTenant(t.equals(row.getTenantId()));
            return d;
        }).collect(Collectors.toList());
    }

    public SettingsService(final TenantConfigRepository repo, final ObjectMapper objectMapper) {
        this.repo = repo;
        this.objectMapper = objectMapper;
    }
}
