package com.school.erp.modules.settings.service;

import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.settings.entity.TenantConfig;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.tenant.TenantContext;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;

@Service
public class SettingsService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(SettingsService.class);
    private final TenantConfigRepository repo;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public TenantConfig getSettings() {
        return repo.findByTenantId(TenantContext.getTenantId()).orElseThrow(() -> new ResourceNotFoundException("Tenant settings not configured"));
    }

    @Transactional
    public TenantConfig updateSettings(TenantConfig update) {
        String t = TenantContext.getTenantId();
        TenantConfig config = repo.findByTenantId(t).orElse(new TenantConfig());
        config.setTenantId(t);
        if (update.getSchoolName() != null) config.setSchoolName(update.getSchoolName());
        if (update.getAddress() != null) config.setAddress(update.getAddress());
        if (update.getPhone() != null) config.setPhone(update.getPhone());
        if (update.getEmail() != null) config.setEmail(update.getEmail());
        if (update.getPrimaryColor() != null) config.setPrimaryColor(update.getPrimaryColor());
        if (update.getSecondaryColor() != null) config.setSecondaryColor(update.getSecondaryColor());
        if (update.getLogo() != null) config.setLogo(update.getLogo());
        if (update.getFeaturesJson() != null) config.setFeaturesJson(update.getFeaturesJson());
        return repo.save(config);
    }

    @Transactional(readOnly = true)
    public Map<String, Boolean> getFeatureFlags() {
        TenantConfig config = getSettings();
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

    @Transactional
    public Map<String, Boolean> updateFeatureFlags(Map<String, Boolean> flags) {
        TenantConfig config = getSettings();
        try {
            config.setFeaturesJson(objectMapper.writeValueAsString(flags));
            repo.save(config);
        } catch (Exception e) {
            log.error("Failed to save features JSON", e);
        }
        return flags;
    }

    public SettingsService(final TenantConfigRepository repo, final ObjectMapper objectMapper) {
        this.repo = repo;
        this.objectMapper = objectMapper;
    }
}
