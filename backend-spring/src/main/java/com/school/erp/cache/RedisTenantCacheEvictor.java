package com.school.erp.cache;

import org.springframework.core.env.Environment;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.util.Objects;

/**
 * Deletes Spring Data Redis cache keys belonging to one tenant. Spring {@link org.springframework.cache.Cache}
 * does not expose key iteration; we match the same key layout as {@link com.school.erp.config.CacheConfig}
 * ({@code prefix + cacheName + "::" + suffix}) where {@code suffix} is either exactly {@code tenantId} or
 * {@code tenantId + ":" + ...} from tenant key generators.
 */
public final class RedisTenantCacheEvictor {

    private final StringRedisTemplate redis;
    private final Environment environment;

    public RedisTenantCacheEvictor(StringRedisTemplate redis, Environment environment) {
        this.redis = Objects.requireNonNull(redis);
        this.environment = Objects.requireNonNull(environment);
    }

    /**
     * Removes cache entries for {@code tenantId} in the given Spring cache region name (e.g. {@code transportRoutes}).
     *
     * @return number of keys removed
     */
    public long evictTenantEntriesInRegion(String cacheRegionName, String tenantId) {
        if (!StringUtils.hasText(tenantId)) {
            throw new IllegalArgumentException("tenantId is required");
        }
        if (!StringUtils.hasText(cacheRegionName)) {
            throw new IllegalArgumentException("cacheRegionName is required");
        }
        String keyPrefix = resolveKeyPrefix();
        String regionPrefix = keyPrefix + cacheRegionName + "::";

        if (containsGlobMeta(tenantId)) {
            return evictByBroadScanAndFilter(regionPrefix, tenantId);
        }
        return redis.execute((RedisCallback<Long>) connection -> {
            long removed = 0;
            byte[] exactKey = (regionPrefix + tenantId).getBytes(StandardCharsets.UTF_8);
            if (Boolean.TRUE.equals(connection.exists(exactKey))) {
                Long d = connection.unlink(exactKey);
                removed += d != null ? d : 0;
            }
            String subPattern = regionPrefix + tenantId + ":*";
            ScanOptions opts = ScanOptions.scanOptions().match(subPattern).count(500).build();
            try (Cursor<byte[]> cursor = connection.scan(opts)) {
                while (cursor.hasNext()) {
                    byte[] kb = cursor.next();
                    Long d = connection.unlink(kb);
                    removed += d != null ? d : 0;
                }
            }
            return removed;
        });
    }

    private long evictByBroadScanAndFilter(String regionPrefix, String tenantId) {
        String pattern = regionPrefix + "*";
        return redis.execute((RedisCallback<Long>) connection -> {
            long removed = 0;
            ScanOptions opts = ScanOptions.scanOptions().match(pattern).count(500).build();
            try (Cursor<byte[]> cursor = connection.scan(opts)) {
                while (cursor.hasNext()) {
                    byte[] kb = cursor.next();
                    String full = new String(kb, StandardCharsets.UTF_8);
                    if (!full.startsWith(regionPrefix)) {
                        continue;
                    }
                    String suffix = full.substring(regionPrefix.length());
                    if (suffixBelongsToTenant(suffix, tenantId)) {
                        Long d = connection.unlink(kb);
                        removed += d != null ? d : 0;
                    }
                }
            }
            return removed;
        });
    }

    static boolean suffixBelongsToTenant(String suffix, String tenantId) {
        return suffix.equals(tenantId) || suffix.startsWith(tenantId + ":");
    }

    private static boolean containsGlobMeta(String tenantId) {
        for (int i = 0; i < tenantId.length(); i++) {
            char c = tenantId.charAt(i);
            if (c == '*' || c == '?' || c == '[' || c == '\\') {
                return true;
            }
        }
        return false;
    }

    private String resolveKeyPrefix() {
        String keyPrefix = environment.getProperty("spring.cache.redis.key-prefix", "sv::");
        if (!StringUtils.hasText(keyPrefix)) {
            return "sv::";
        }
        String p = keyPrefix.trim();
        return p.endsWith("::") ? p : p + "::";
    }
}
