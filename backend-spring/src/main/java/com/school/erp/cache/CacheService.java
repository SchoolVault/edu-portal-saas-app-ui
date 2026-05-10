package com.school.erp.cache;

import com.school.erp.config.CacheConfig;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.lang.Nullable;

import java.util.Optional;
import java.util.concurrent.Callable;

/**
 * Tenant-aware cache façade over Spring {@link CacheManager} (Redis today; same API if you add Caffeine L1).
 * Use {@link CacheRegion} names aligned with {@link CacheConfig} cache names.
 * <p>Bean: {@link CacheConfig#cacheService(CacheManager)} (not component-scanned) so it always wires after the Redis {@link CacheManager}.
 */
public class CacheService {

    public enum CacheRegion {
        REFERENCE_DATA(CacheConfig.REFERENCE_DATA),
        PERMISSIONS(CacheConfig.PERMISSIONS),
        TENANT_CONFIG(CacheConfig.TENANT_CONFIG),
        /** Feature-flag map per tenant (separate Redis value serializer from {@link #SETTINGS_SNAPSHOT}). */
        TENANT_FEATURE_FLAGS(CacheConfig.TENANT_FEATURE_FLAGS),
        REPORT_RESULTS(CacheConfig.REPORT_RESULTS),
        TRANSPORT_ROUTES(CacheConfig.TRANSPORT_ROUTES),
        ANNOUNCEMENT_PREVIEWS(CacheConfig.ANNOUNCEMENT_PREVIEWS),
        PAYROLL_STRUCTURES(CacheConfig.PAYROLL_STRUCTURES),
        DASHBOARD_SNAPSHOTS(CacheConfig.DASHBOARD_SNAPSHOTS),
        STUDENT_DIRECTORY(CacheConfig.STUDENT_DIRECTORY),
        TEACHER_DIRECTORY(CacheConfig.TEACHER_DIRECTORY),
        ACADEMIC_CATALOG(CacheConfig.ACADEMIC_CATALOG),
        SETTINGS_SNAPSHOT(CacheConfig.SETTINGS_SNAPSHOT),
        LIBRARY_CATALOG(CacheConfig.LIBRARY_CATALOG),
        LIBRARY_ISSUES(CacheConfig.LIBRARY_ISSUES),
        FEES_CATALOG(CacheConfig.FEES_CATALOG),
        TIMETABLE_GRID(CacheConfig.TIMETABLE_GRID);

        private final String cacheName;

        CacheRegion(String cacheName) {
            this.cacheName = cacheName;
        }

        public String cacheName() {
            return cacheName;
        }
    }

    private final CacheManager cacheManager;

    public CacheService(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    @Nullable
    public <T> T get(CacheRegion region, Object key, Class<T> type) {
        Cache c = cacheManager.getCache(region.cacheName());
        if (c == null) {
            return null;
        }
        return c.get(key, type);
    }

    public <T> T getOrLoad(CacheRegion region, Object key, Callable<T> loader) {
        Cache c = requireCache(region);
        try {
            return c.get(key, loader);
        } catch (Exception e) {
            if (e instanceof RuntimeException re) {
                throw re;
            }
            throw new IllegalStateException(e);
        }
    }

    public void put(CacheRegion region, Object key, @Nullable Object value) {
        Cache c = requireCache(region);
        if (value == null) {
            c.evict(key);
        } else {
            c.put(key, value);
        }
    }

    public void evict(CacheRegion region, Object key) {
        Optional.ofNullable(cacheManager.getCache(region.cacheName())).ifPresent(c -> c.evict(key));
    }

    /**
     * Clears every entry in the named Redis cache region (all tenants). Prefer {@link #evict} with a concrete key
     * for tenant-scoped data; use this only for truly global regions or maintenance.
     */
    public void clearRegion(CacheRegion region) {
        Optional.ofNullable(cacheManager.getCache(region.cacheName())).ifPresent(Cache::clear);
    }

    private Cache requireCache(CacheRegion region) {
        Cache c = cacheManager.getCache(region.cacheName());
        if (c == null) {
            throw new IllegalStateException("Unknown cache region: " + region.cacheName());
        }
        return c;
    }
}
