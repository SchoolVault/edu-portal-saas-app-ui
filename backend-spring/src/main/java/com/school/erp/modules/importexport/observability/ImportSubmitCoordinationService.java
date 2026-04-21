package com.school.erp.modules.importexport.observability;

import com.school.erp.common.exception.BusinessException;
import com.school.erp.config.ImportRuntimeProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;

/**
 * Cluster-safe coordination for idempotent import submit: wraps the DB check + job insert in a
 * short-lived Redis lock when available; otherwise falls back to JVM-local {@code synchronized}.
 */
@Service
public class ImportSubmitCoordinationService {

    private static final Logger log = LoggerFactory.getLogger(ImportSubmitCoordinationService.class);
    private static final String KEY_PREFIX = "sv:import:submit-lock:";

    private final ImportRuntimeProperties properties;
    private final ObjectProvider<StringRedisTemplate> redisProvider;

    public ImportSubmitCoordinationService(ImportRuntimeProperties properties,
                                          ObjectProvider<StringRedisTemplate> redisProvider) {
        this.properties = properties;
        this.redisProvider = redisProvider;
    }

    public void runWithSubmitLock(String idempotencyKey, Runnable work) {
        StringRedisTemplate redis = redisProvider.getIfAvailable();
        if (properties.isClusterSubmitLockEnabled() && redis != null) {
            String lockKey = KEY_PREFIX + sha256Hex(idempotencyKey);
            int maxAttempts = Math.max(5, properties.getClusterSubmitLockAcquireAttempts());
            for (int attempt = 0; attempt < maxAttempts; attempt++) {
                Boolean acquired = redis.opsForValue().setIfAbsent(lockKey, "1",
                        Duration.ofSeconds(properties.getClusterSubmitLockTtlSeconds()));
                if (Boolean.TRUE.equals(acquired)) {
                    try {
                        synchronized (localMonitor(idempotencyKey)) {
                            work.run();
                        }
                    } finally {
                        try {
                            redis.delete(lockKey);
                        } catch (Exception ex) {
                            log.warn("Could not release import submit lock {}: {}", lockKey, ex.getMessage());
                        }
                    }
                    return;
                }
                try {
                    Thread.sleep(100L + (long) attempt * 50L);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new BusinessException("Import interrupted");
                }
            }
            log.warn("Could not acquire import submit lock after {} attempts keyPrefix={}", maxAttempts, lockKey.substring(0, Math.min(24, lockKey.length())));
            throw new BusinessException("Another import with the same file is being queued; please retry in a few seconds.");
        }
        synchronized (localMonitor(idempotencyKey)) {
            work.run();
        }
    }

    private static Object localMonitor(String idempotencyKey) {
        return idempotencyKey.intern();
    }

    private static String sha256Hex(String utf8) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(utf8.getBytes(StandardCharsets.UTF_8));
            StringBuilder out = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                out.append(String.format("%02x", b));
            }
            return out.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
