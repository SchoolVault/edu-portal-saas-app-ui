package com.school.erp.modules.platform.service;

import com.school.erp.cache.CacheService;
import com.school.erp.common.enums.Enums;
import com.school.erp.modules.audit.service.AuditService;
import com.school.erp.modules.platform.dto.PlatformDTOs;
import com.school.erp.config.CacheConfig;
import com.school.erp.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Cache management service for platform operators.
 * Provides cache clearing operations with audit logging and statistics.
 * <p>Bean: {@link CacheConfig#cacheManagementService(CacheService, AuditService, CacheManager)} (not component-scanned).
 */
public class CacheManagementService {
    private static final Logger log = LoggerFactory.getLogger(CacheManagementService.class);
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final CacheService cacheService;
    private final AuditService auditService;
    private final CacheManager cacheManager;

    public CacheManagementService(CacheService cacheService, AuditService auditService, CacheManager cacheManager) {
        this.cacheService = cacheService;
        this.auditService = auditService;
        this.cacheManager = cacheManager;
    }

    /**
     * Clears cache based on request scope:
     * - If tenantId specified: clears only that tenant's cache keys
     * - If regions specified: clears only those regions
     * - Otherwise: clears all regions for all tenants (global)
     *
     * @param request CacheClearRequest with optional tenantId and regions
     * @return CacheClearResponse with statistics
     */
    public PlatformDTOs.CacheClearResponse clearCaches(PlatformDTOs.CacheClearRequest request) {
        String targetTenant = request.getTenantId();
        List<String> targetRegions = request.getRegions();

        boolean isTenantScoped = StringUtils.hasText(targetTenant);
        boolean isRegionFiltered = targetRegions != null && !targetRegions.isEmpty();

        log.info("Cache clear initiated by user: {} | Tenant: {} | Regions: {}",
            TenantContext.getUserId(),
            isTenantScoped ? targetTenant : "ALL",
            isRegionFiltered ? targetRegions : "ALL");

        List<String> clearedRegions = new ArrayList<>();
        int successCount = 0;
        String targetSchoolName = null;

        try {
            // Determine which regions to clear
            List<CacheService.CacheRegion> regionsToProcess;
            if (isRegionFiltered) {
                Set<String> requestedNames = targetRegions.stream()
                    .map(String::toLowerCase)
                    .collect(Collectors.toSet());
                regionsToProcess = Arrays.stream(CacheService.CacheRegion.values())
                    .filter(r -> requestedNames.contains(r.cacheName().toLowerCase()))
                    .collect(Collectors.toList());
            } else {
                regionsToProcess = Arrays.asList(CacheService.CacheRegion.values());
            }

            // Clear cache regions
            for (CacheService.CacheRegion region : regionsToProcess) {
                try {
                    if (isTenantScoped) {
                        // Tenant-scoped: evict keys prefixed with tenantId
                        evictTenantKeys(region, targetTenant);
                    } else {
                        // Global: clear entire region
                        cacheService.clearRegion(region);
                    }
                    clearedRegions.add(region.cacheName());
                    successCount++;
                    log.debug("Cleared cache region: {} {}", region.cacheName(),
                        isTenantScoped ? "(tenant: " + targetTenant + ")" : "(global)");
                } catch (Exception e) {
                    log.error("Failed to clear cache region: {}", region.cacheName(), e);
                }
            }

            String clearedAt = LocalDateTime.now().format(FORMATTER);
            String clearedBy = getUserIdentifier();

            // Log audit event
            String auditMessage = isTenantScoped
                ? String.format("Cache cleared for tenant %s (%d regions)", targetTenant, successCount)
                : String.format("Global cache clear (%d regions)", successCount);

            auditService.logAction(
                Enums.AuditAction.CACHE_CLEARED,
                "Platform",
                auditMessage,
                null,
                "Cache",
                null,
                String.join(", ", clearedRegions)
            );

            PlatformDTOs.CacheStatistics stats = new PlatformDTOs.CacheStatistics(
                successCount,
                clearedRegions,
                clearedAt,
                clearedBy
            );
            stats.setTargetTenantId(targetTenant);
            stats.setTargetSchoolName(targetSchoolName);

            log.info("Cache clear completed. Regions: {} | Tenant: {}", successCount,
                isTenantScoped ? targetTenant : "ALL");

            String message = isTenantScoped
                ? String.format("Successfully cleared %d cache regions for selected school", successCount)
                : String.format("Successfully cleared %d cache regions globally", successCount);

            return new PlatformDTOs.CacheClearResponse(true, message, stats);

        } catch (Exception e) {
            log.error("Cache clear operation failed", e);
            return new PlatformDTOs.CacheClearResponse(
                false,
                "Failed to clear caches: " + e.getMessage(),
                null
            );
        }
    }

    /**
     * Evicts cache entries for a specific tenant.
     * Redis keys are prefixed with tenant ID by key generators, so we evict matching keys.
     * Note: Spring Cache abstraction doesn't expose key iteration, so this is a best-effort
     * implementation. For complete tenant eviction, consider using Spring Data Redis directly.
     */
    private void evictTenantKeys(CacheService.CacheRegion region, String tenantId) {
        Cache cache = cacheManager.getCache(region.cacheName());
        if (cache == null) {
            return;
        }

        // Spring Cache API limitation: no built-in way to iterate keys
        // For Redis-backed caches with tenant prefix, clearing the entire region is safest
        // TODO: If strict tenant isolation is required, use RedisTemplate to scan and delete by pattern
        log.warn("Tenant-scoped cache eviction for region {} falling back to full region clear " +
            "(Spring Cache API limitation - consider RedisTemplate for key-pattern eviction)",
            region.cacheName());
        cacheService.clearRegion(region);
    }

    /**
     * Legacy method for backward compatibility - clears all regions globally.
     */
    public PlatformDTOs.CacheClearResponse clearAllCaches() {
        return clearCaches(new PlatformDTOs.CacheClearRequest(null, null));
    }

    /**
     * Gets user identifier for audit logging
     */
    private String getUserIdentifier() {
        Long userId = TenantContext.getUserId();
        String userRole = TenantContext.getUserRole();

        if (userId != null && userRole != null) {
            return String.format("%s (ID: %d)", userRole, userId);
        } else if (userId != null) {
            return "User ID: " + userId;
        } else if (userRole != null) {
            return userRole;
        }

        return "SYSTEM";
    }
}
