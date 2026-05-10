package com.school.erp.common.lock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;
import java.util.function.Supplier;

@Service
public class TenantRedisLockService {
    private static final Logger log = LoggerFactory.getLogger(TenantRedisLockService.class);

    private final ObjectProvider<StringRedisTemplate> redisProvider;

    public TenantRedisLockService(ObjectProvider<StringRedisTemplate> redisProvider) {
        this.redisProvider = redisProvider;
    }

    /**
     * Best-effort lock wrapper: proceeds without lock when Redis is unavailable.
     */
    public <T> T withBestEffortLock(String lockKey, Duration ttl, Supplier<T> action) {
        StringRedisTemplate redis = redisProvider.getIfAvailable();
        if (redis == null) {
            return action.get();
        }
        String ownerToken = UUID.randomUUID().toString();
        try {
            Boolean acquired = redis.opsForValue().setIfAbsent(lockKey, ownerToken, ttl);
            if (!Boolean.TRUE.equals(acquired)) {
                throw new IllegalStateException("Concurrent financial operation in progress");
            }
            return action.get();
        } catch (RuntimeException ex) {
            if (ex instanceof IllegalStateException) {
                throw ex;
            }
            log.warn("Redis lock failure for key={} reason={} (continuing)", lockKey, ex.getMessage());
            return action.get();
        } finally {
            try {
                String current = redis.opsForValue().get(lockKey);
                if (ownerToken.equals(current)) {
                    redis.delete(lockKey);
                }
            } catch (Exception ignored) {
                // lock expires automatically by TTL.
            }
        }
    }
}
