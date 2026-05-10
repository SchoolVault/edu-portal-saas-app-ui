package com.school.erp.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.cache.CacheService;
import com.school.erp.cache.RedisTenantCacheEvictor;
import com.school.erp.cache.logging.LoggingCacheManager;
import com.school.erp.modules.audit.service.AuditService;
import com.school.erp.modules.platform.service.CacheManagementService;
import com.school.erp.modules.parent.cache.ParentPortalExamPageCache;
import com.school.erp.modules.reports.service.DashboardSnapshotService;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.security.rbac.SlimJwtAuthorityCache;
import com.school.erp.tenant.TenantContext;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.KeyGenerator;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.data.redis.cache.CacheKeyPrefix;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.data.redis.core.StringRedisTemplate;

import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Redis-backed Spring Cache with <strong>tenant-scoped keys</strong> only.
 * Disable via {@code spring.cache.type=none} or env {@code CACHE_TYPE=none} when Redis is unavailable.
 * <p>
 * Value serialization uses {@link GenericJackson2JsonRedisSerializer} with {@link JacksonConfig#REDIS_OBJECT_MAPPER}
 * so Jackson embeds type metadata ({@code @class}) for Redis only. The HTTP {@code @Primary} mapper stays
 * untyped for normal REST JSON.
 */
@Configuration
@EnableCaching
@EnableConfigurationProperties({AppCacheTtlProperties.class, AppCacheAccessLogProperties.class})
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

    /** Shared catalogs (countries, static lookups) — long TTL; explicit evict on admin edits. */
    public static final String REFERENCE_DATA = "referenceData";
    /** Role / permission matrices per tenant. */
    public static final String PERMISSIONS = "permissions";
    /** Feature flags, theme, school branding JSON. */
    public static final String TENANT_CONFIG = "tenantConfig";
    /**
     * Tenant feature flag map ({@code Map<String,Boolean>}) — serialized as plain JSON without Jackson default typing.
     * Kept separate from {@link #SETTINGS_SNAPSHOT} so legacy Redis entries (no {@code @class}) and new typed snapshots coexist safely.
     */
    public static final String TENANT_FEATURE_FLAGS = "tenantFeatureFlags";
    /** Heavy report snapshots (optional L1 Caffeine in front later). */
    public static final String REPORT_RESULTS = "reportResults";
    /** KPI + role-specific dashboard payloads (hourly refresh typical for Aiven 1GB tier). */
    public static final String DASHBOARD_SNAPSHOTS = "dashboardSnapshots";
    /** Student list / roster reads (tenant + user + query params in key). */
    public static final String STUDENT_DIRECTORY = "studentDirectory";
    /** Teacher grid reads. */
    public static final String TEACHER_DIRECTORY = "teacherDirectory";
    /** Academic subject catalog, years, class tree — low churn. */
    public static final String ACADEMIC_CATALOG = "academicCatalog";
    public static final String SETTINGS_SNAPSHOT = "settingsSnapshot";
    public static final String LIBRARY_CATALOG = "libraryCatalog";
    public static final String LIBRARY_ISSUES = "libraryIssues";
    public static final String FEES_CATALOG = "feesCatalog";
    public static final String TIMETABLE_GRID = "timetableGrid";
    public static final String LEAVE_POLICY = "leavePolicy";
    public static final String LEAVE_BALANCE = "leaveBalance";

    @Bean
    public CacheManager cacheManager(
            RedisConnectionFactory connectionFactory,
            AppCacheTtlProperties ttlProps  ,
            AppCacheAccessLogProperties accessLogProps,
            Environment environment,
            @Qualifier("redisObjectMapper") ObjectMapper redisObjectMapper) {
        GenericJackson2JsonRedisSerializer json = new GenericJackson2JsonRedisSerializer(redisObjectMapper);
        RedisSerializationContext.SerializationPair<Object> plainJsonValues =
                RedisSerializationContext.SerializationPair.fromSerializer(RedisSerializer.json());

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
        perCache.put(REFERENCE_DATA, base.entryTtl(ttlProps.getReferenceData()));
        perCache.put(PERMISSIONS, base.entryTtl(ttlProps.getPermissions()));
        perCache.put(TENANT_CONFIG, base.entryTtl(ttlProps.getTenantConfig()));
        perCache.put(REPORT_RESULTS, base.entryTtl(ttlProps.getReportResults()));
        perCache.put(DASHBOARD_SNAPSHOTS, base.entryTtl(ttlProps.getDashboardSnapshots()));
        perCache.put(STUDENT_DIRECTORY, base.entryTtl(ttlProps.getStudentDirectory()));
        perCache.put(TEACHER_DIRECTORY, base.entryTtl(ttlProps.getTeacherDirectory()));
        perCache.put(ACADEMIC_CATALOG, base.entryTtl(ttlProps.getAcademicCatalog()));
        perCache.put(SETTINGS_SNAPSHOT, base.entryTtl(ttlProps.getSettingsSnapshot()));
        /* Same key prefix / TTL as settings snapshot; only value serialization differs (plain JSON map). */
        perCache.put(TENANT_FEATURE_FLAGS, base.serializeValuesWith(plainJsonValues).entryTtl(ttlProps.getSettingsSnapshot()));
        perCache.put(LIBRARY_CATALOG, base.entryTtl(ttlProps.getLibraryCatalog()));
        perCache.put(LIBRARY_ISSUES, base.entryTtl(ttlProps.getLibraryIssues()));
        perCache.put(FEES_CATALOG, base.entryTtl(ttlProps.getFeesCatalog()));
        perCache.put(TIMETABLE_GRID, base.entryTtl(ttlProps.getTimetableGrid()));
        perCache.put(LEAVE_POLICY, base.entryTtl(ttlProps.getLeavePolicy()));
        perCache.put(LEAVE_BALANCE, base.entryTtl(ttlProps.getLeaveBalance()));

        RedisCacheManager redis = RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(base.entryTtl(ttlProps.getDefaultTtl()))
                .withInitialCacheConfigurations(perCache)
                .transactionAware()
                .build();
        return new LoggingCacheManager(redis, accessLogProps);
    }

    /**
     * Facade + platform cache admin — registered here (not {@code @Service}) so they are created in the same
     * configuration slice as {@link #cacheManager}, avoiding component-scan order where {@code CacheManagementService}
     * could wire before {@code CacheService}.
     */
    @Bean
    public CacheService cacheService(CacheManager cacheManager) {
        return new CacheService(cacheManager);
    }

    @Bean
    public RedisTenantCacheEvictor redisTenantCacheEvictor(
            StringRedisTemplate stringRedisTemplate,
            Environment environment) {
        return new RedisTenantCacheEvictor(stringRedisTemplate, environment);
    }

    @Bean
    public CacheManagementService cacheManagementService(
            CacheService cacheService,
            AuditService auditService,
            CacheManager cacheManager,
            RedisTenantCacheEvictor redisTenantCacheEvictor,
            TenantConfigRepository tenantConfigRepository,
            DashboardSnapshotService dashboardSnapshotService,
            SlimJwtAuthorityCache slimJwtAuthorityCache,
            ParentPortalExamPageCache parentPortalExamPageCache) {
        return new CacheManagementService(
                cacheService,
                auditService,
                cacheManager,
                redisTenantCacheEvictor,
                tenantConfigRepository,
                dashboardSnapshotService,
                slimJwtAuthorityCache,
                parentPortalExamPageCache);
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

    /**
     * Tenant + authenticated user + role + method name + all method parameters (stable string form).
     * Use for paged rosters so teachers and admins do not share entries.
     */
    @Bean("tenantMethodParamsKeyGenerator")
    public KeyGenerator tenantMethodParamsKeyGenerator() {
        return (target, method, params) -> {
            String tid = TenantContext.getTenantId();
            tid = (tid == null || tid.isBlank()) ? "_no_tenant_" : tid;
            String uid = TenantContext.getUserId() != null ? TenantContext.getUserId().toString() : "anon";
            String role = TenantContext.getUserRole() != null ? TenantContext.getUserRole() : "";
            StringBuilder sb = new StringBuilder(tid)
                    .append(':').append(uid)
                    .append(':').append(role)
                    .append(':').append(method.getName());
            for (Object p : params) {
                if (p == null) {
                    sb.append(":_");
                } else if (p instanceof Enum<?> e) {
                    sb.append(':').append(e.name());
                } else {
                    sb.append(':').append(p);
                }
            }
            return sb.toString();
        };
    }

    /** Tenant + method name (no params) — shared for all users in the school (e.g. academic catalog). */
    @Bean("tenantMethodNameKeyGenerator")
    public KeyGenerator tenantMethodNameKeyGenerator() {
        return (target, method, params) -> {
            String tid = TenantContext.getTenantId();
            tid = (tid == null || tid.isBlank()) ? "_no_tenant_" : tid;
            return tid + ":" + method.getName();
        };
    }

    /** Tenant + method name + first parameter (e.g. class id). */
    @Bean("tenantMethodFirstParamKeyGenerator")
    public KeyGenerator tenantMethodFirstParamKeyGenerator() {
        return (target, method, params) -> {
            String tid = TenantContext.getTenantId();
            tid = (tid == null || tid.isBlank()) ? "_no_tenant_" : tid;
            Object first = params != null && params.length > 0 ? params[0] : "_";
            return tid + ":" + method.getName() + ":" + first;
        };
    }

    /**
     * Tenant + method + all parameters (no user/role) — shared within a school for timetables, library catalog, etc.
     */
    @Bean("tenantMethodParamsSchoolKeyGenerator")
    public KeyGenerator tenantMethodParamsSchoolKeyGenerator() {
        return (target, method, params) -> {
            String tid = TenantContext.getTenantId();
            tid = (tid == null || tid.isBlank()) ? "_no_tenant_" : tid;
            StringBuilder sb = new StringBuilder(tid).append(':').append(method.getName());
            if (params != null) {
                for (Object p : params) {
                    if (p == null) {
                        sb.append(":_");
                    } else if (p instanceof Enum<?> e) {
                        sb.append(':').append(e.name());
                    } else {
                        sb.append(':').append(p);
                    }
                }
            }
            return sb.toString();
        };
    }
}
