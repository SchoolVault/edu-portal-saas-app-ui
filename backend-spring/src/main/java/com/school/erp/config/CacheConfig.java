package com.school.erp.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.tenant.TenantContext;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.KeyGenerator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.data.redis.cache.CacheKeyPrefix;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Redis-backed Spring Cache with <strong>tenant-scoped keys</strong> only.
 * Disable via {@code spring.cache.type=none} or env {@code CACHE_TYPE=none} when Redis is unavailable.
 */
@Configuration
@EnableCaching
@EnableConfigurationProperties(AppCacheTtlProperties.class)
@ConditionalOnProperty(prefix = "spring.cache", name = "type", havingValue = "redis")
public class CacheConfig {

    /** Route list + live coords — evicted on any transport mutation for that tenant. */
    public static final String TRANSPORT_ROUTES = "transportRoutes";

    /**
     * Header/widget previews — key includes user+role (audience differs). Short TTL; no cross-user evict on write.
     */
    public static final String ANNOUNCEMENT_PREVIEWS = "announcementPreviews";

    /** Salary structure grid — evicted when structures change. */
    public static final String PAYROLL_STRUCTURES = "payrollStructures";

    @Bean
    public CacheManager cacheManager(
            RedisConnectionFactory connectionFactory,
            ObjectMapper objectMapper,
            AppCacheTtlProperties ttlProps,
            Environment environment) {
        GenericJackson2JsonRedisSerializer json = new GenericJackson2JsonRedisSerializer(objectMapper);

        RedisCacheConfiguration base = RedisCacheConfiguration.defaultCacheConfig()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(json))
                .disableCachingNullValues();

        String keyPrefix = environment.getProperty("spring.cache.redis.key-prefix", "sv::");
        if (StringUtils.hasText(keyPrefix)) {
            String p = keyPrefix.endsWith("::") ? keyPrefix : keyPrefix + "::";
            base = base.computePrefixWith(CacheKeyPrefix.prefixed(p));
        }

        Map<String, RedisCacheConfiguration> perCache = new HashMap<>();
        perCache.put(TRANSPORT_ROUTES, base.entryTtl(ttlProps.getTransportRoutes()));
        perCache.put(ANNOUNCEMENT_PREVIEWS, base.entryTtl(ttlProps.getAnnouncementPreviews()));
        perCache.put(PAYROLL_STRUCTURES, base.entryTtl(ttlProps.getPayrollStructures()));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(base.entryTtl(ttlProps.getDefaultTtl()))
                .withInitialCacheConfigurations(perCache)
                .transactionAware()
                .build();
    }

    /** Cache key = current tenant id (never share across schools). */
    @Bean("tenantKeyGenerator")
    public KeyGenerator tenantKeyGenerator() {
        return (target, method, params) -> {
            String tid = TenantContext.getTenantId();
            return (tid == null || tid.isBlank()) ? "_no_tenant_" : tid;
        };
    }

    /** Cache key = tenant + user + role (announcement visibility is audience-specific). */
    @Bean("tenantUserRoleKeyGenerator")
    public KeyGenerator tenantUserRoleKeyGenerator() {
        return (target, method, params) -> {
            String tid = TenantContext.getTenantId();
            tid = (tid == null || tid.isBlank()) ? "_no_tenant_" : tid;
            String uid = TenantContext.getUserId() != null ? TenantContext.getUserId().toString() : "anon";
            String role = TenantContext.getUserRole() != null ? TenantContext.getUserRole() : "";
            return tid + ":" + uid + ":" + role;
        };
    }
}
