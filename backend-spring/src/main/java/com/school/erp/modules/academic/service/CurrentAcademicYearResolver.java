package com.school.erp.modules.academic.service;

import com.school.erp.modules.academic.repository.AcademicYearRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Resolves active academic year for a tenant with a short-lived in-memory cache.
 */
@Service
public class CurrentAcademicYearResolver {

    private static final Duration CACHE_TTL = Duration.ofMinutes(5);

    private final AcademicYearRepository academicYearRepository;
    private final Map<String, CacheEntry> activeYearCache = new ConcurrentHashMap<>();

    public CurrentAcademicYearResolver(AcademicYearRepository academicYearRepository) {
        this.academicYearRepository = academicYearRepository;
    }

    public Long resolveCurrentAcademicYearId(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return null;
        }
        CacheEntry existing = activeYearCache.get(tenantId);
        Instant now = Instant.now();
        if (existing != null && now.isBefore(existing.expiresAt())) {
            return existing.academicYearId();
        }
        Long academicYearId = academicYearRepository
                .findFirstByTenantIdAndIsCurrentTrueAndIsDeletedFalse(tenantId)
                .map(academicYear -> academicYear.getId())
                .orElse(null);
        activeYearCache.put(tenantId, new CacheEntry(academicYearId, now.plus(CACHE_TTL)));
        return academicYearId;
    }

    public void evictTenant(String tenantId) {
        if (tenantId != null) {
            activeYearCache.remove(tenantId);
        }
    }

    private record CacheEntry(Long academicYearId, Instant expiresAt) {
    }
}
