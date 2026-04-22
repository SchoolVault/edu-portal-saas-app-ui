package com.school.erp.modules.platform.service;

import com.school.erp.cache.CacheService;
import com.school.erp.cache.RedisTenantCacheEvictor;
import com.school.erp.common.enums.Enums;
import com.school.erp.config.CacheConfig;
import com.school.erp.modules.audit.service.AuditService;
import com.school.erp.modules.platform.dto.PlatformDTOs;
import com.school.erp.modules.settings.entity.TenantConfig;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.CacheManager;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Cache management for platform operators: global region flush or tenant-scoped key eviction via
 * {@link RedisTenantCacheEvictor} (Redis SCAN + unlink).
 * <p>Bean: {@link CacheConfig#cacheManagementService(...)} (not component-scanned).
 */
public class CacheManagementService {
    private static final Logger log = LoggerFactory.getLogger(CacheManagementService.class);
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final CacheService cacheService;
    private final AuditService auditService;
    private final CacheManager cacheManager;
    private final RedisTenantCacheEvictor redisTenantCacheEvictor;
    private final TenantConfigRepository tenantConfigRepository;

    public CacheManagementService(
            CacheService cacheService,
            AuditService auditService,
            CacheManager cacheManager,
            RedisTenantCacheEvictor redisTenantCacheEvictor,
            TenantConfigRepository tenantConfigRepository) {
        this.cacheService = cacheService;
        this.auditService = auditService;
        this.cacheManager = cacheManager;
        this.redisTenantCacheEvictor = redisTenantCacheEvictor;
        this.tenantConfigRepository = tenantConfigRepository;
    }

    /**
     * <ul>
     *   <li>No {@code tenantId}: clears entire region(s) for <strong>all</strong> tenants ({@link CacheService#clearRegion}).</li>
     *   <li>With {@code tenantId}: removes only keys whose cache suffix is {@code tenantId} or {@code tenantId:...}
     *       (aligned with tenant key generators).</li>
     * </ul>
     */
    public PlatformDTOs.CacheClearResponse clearCaches(PlatformDTOs.CacheClearRequest request) {
        String targetTenant = request != null && request.getTenantId() != null ? request.getTenantId().trim() : null;
        if (targetTenant != null && targetTenant.isBlank()) {
            targetTenant = null;
        }
        List<String> targetRegions = sanitizeRegions(request != null ? request.getRegions() : null);

        boolean isTenantScoped = StringUtils.hasText(targetTenant);
        boolean isRegionFiltered = targetRegions != null && !targetRegions.isEmpty();

        log.info("Cache clear initiated by user: {} | Tenant: {} | Regions: {}",
                TenantContext.getUserId(),
                isTenantScoped ? targetTenant : "ALL",
                isRegionFiltered ? targetRegions : "ALL");

        List<String> clearedRegions = new ArrayList<>();
        List<String> failedRegions = new ArrayList<>();
        int successCount = 0;
        long totalKeysEvicted = 0;
        String targetSchoolName = null;

        try {
            if (isTenantScoped) {
                final String normalizedTenantId = targetTenant;
                TenantConfig workspace = tenantConfigRepository.findByTenantId(normalizedTenantId)
                        .filter(c -> !Boolean.TRUE.equals(c.getIsDeleted()))
                        .orElseThrow(() -> new IllegalArgumentException("Unknown or inactive tenant workspace for cache clear"));
                targetSchoolName = workspace.getSchoolName();
            }

            List<CacheService.CacheRegion> regionsToProcess;
            if (isRegionFiltered) {
                Set<String> requestedNames = targetRegions.stream()
                        .map(String::toLowerCase)
                        .collect(Collectors.toSet());
                regionsToProcess = Arrays.stream(CacheService.CacheRegion.values())
                        .filter(r -> requestedNames.contains(r.cacheName().toLowerCase()))
                        .collect(Collectors.toList());
                if (regionsToProcess.isEmpty()) {
                    throw new IllegalArgumentException("No valid cache regions were provided");
                }
                Set<String> validNames = Arrays.stream(CacheService.CacheRegion.values())
                        .map(r -> r.cacheName().toLowerCase())
                        .collect(Collectors.toSet());
                List<String> unknownRegions = targetRegions.stream()
                        .filter(name -> !validNames.contains(name.toLowerCase()))
                        .toList();
                if (!unknownRegions.isEmpty()) {
                    throw new IllegalArgumentException("Unknown cache region(s): " + String.join(", ", unknownRegions));
                }
            } else {
                regionsToProcess = Arrays.asList(CacheService.CacheRegion.values());
            }

            for (CacheService.CacheRegion region : regionsToProcess) {
                try {
                    if (cacheManager.getCache(region.cacheName()) == null) {
                        log.warn("Cache region not registered: {}", region.cacheName());
                        continue;
                    }
                    if (isTenantScoped) {
                        long n = redisTenantCacheEvictor.evictTenantEntriesInRegion(region.cacheName(), targetTenant.trim());
                        totalKeysEvicted += n;
                        log.debug("Evicted {} keys in region {} for tenant {}", n, region.cacheName(), targetTenant);
                    } else {
                        cacheService.clearRegion(region);
                        log.debug("Cleared entire region {} (global)", region.cacheName());
                    }
                    clearedRegions.add(region.cacheName());
                    successCount++;
                } catch (Exception e) {
                    log.error("Failed to clear cache region: {}", region.cacheName(), e);
                    failedRegions.add(region.cacheName());
                }
            }

            String clearedAt = LocalDateTime.now().format(FORMATTER);
            String clearedBy = getUserIdentifier();

            String auditMessage = isTenantScoped
                    ? String.format("Cache cleared for tenant %s (%d regions, ~%d keys)", targetTenant, successCount, totalKeysEvicted)
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
            stats.setTargetTenantId(isTenantScoped ? targetTenant.trim() : null);
            stats.setTargetSchoolName(targetSchoolName);
            stats.setKeysEvicted(isTenantScoped ? totalKeysEvicted : null);
            stats.setFailedRegions(failedRegions);

            log.info("Cache clear completed. Regions: {} | Tenant: {} | keysEvicted: {}",
                    successCount,
                    isTenantScoped ? targetTenant : "ALL",
                    isTenantScoped ? totalKeysEvicted : "n/a");

            boolean allSucceeded = failedRegions.isEmpty();
            String message;
            if (isTenantScoped) {
                message = allSucceeded
                        ? String.format(
                        "Cleared %d cache region(s) for the selected school; removed ~%d Redis key(s). Next reads load fresh data.",
                        successCount, totalKeysEvicted)
                        : String.format(
                        "Cleared %d region(s) for the selected school; %d region(s) failed. Removed ~%d Redis key(s) from successful regions.",
                        successCount, failedRegions.size(), totalKeysEvicted);
            } else {
                message = allSucceeded
                        ? String.format(
                        "Cleared %d cache region(s) for all schools; next reads will reload from source.",
                        successCount)
                        : String.format(
                        "Cleared %d region(s) globally; %d region(s) failed and need retry.",
                        successCount, failedRegions.size());
            }
            return new PlatformDTOs.CacheClearResponse(allSucceeded, message, stats);

        } catch (Exception e) {
            log.error("Cache clear operation failed", e);
            return new PlatformDTOs.CacheClearResponse(
                    false,
                    "Failed to clear caches: " + e.getMessage(),
                    null
            );
        }
    }

    public PlatformDTOs.CacheClearResponse clearAllCaches() {
        return clearCaches(new PlatformDTOs.CacheClearRequest(null, null));
    }

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

    private static List<String> sanitizeRegions(List<String> regions) {
        if (regions == null || regions.isEmpty()) {
            return null;
        }
        LinkedHashSet<String> cleaned = regions.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        return cleaned.isEmpty() ? null : new ArrayList<>(cleaned);
    }
}
