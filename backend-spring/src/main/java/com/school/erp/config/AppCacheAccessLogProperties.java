package com.school.erp.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Observability for Spring Cache (Redis): log whether values are served from cache or loaded (typically DB).
 * Tune via env {@code APP_CACHE_ACCESS_LOG_*} so production can enable misses at INFO and hits at DEBUG only.
 */
@ConfigurationProperties(prefix = "app.cache.access-log")
public class AppCacheAccessLogProperties {

    /**
     * Master switch. When false, {@link com.school.erp.cache.logging.LoggingCache} delegates without logging.
     */
    private boolean enabled = true;

    /**
     * Log cache hits (served from Redis). Emitted at DEBUG to avoid log volume; enable
     * {@code logging.level.com.school.erp.cache.access=DEBUG} to see them.
     */
    private boolean logHits = true;

    /**
     * Log when a cache miss runs the loader (source is not Redis — typically DB / computation).
     * Emitted at INFO by default so prod can grep {@code CACHE source=loader}.
     */
    private boolean logMissLoads = true;

    /**
     * How much of the cache key to expose: {@code HASH} (recommended), {@code TRUNCATE}, or {@code NONE}.
     */
    private KeyPrivacy keyPrivacy = KeyPrivacy.HASH;

    public enum KeyPrivacy {
        /** SHA-256 prefix of the key string (no PII in clear text). */
        HASH,
        /** First N characters of key string (still may contain ids). */
        TRUNCATE,
        /** Omit key; only region name + tenant MDC. */
        NONE
    }

    private int truncateLength = 48;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public boolean isLogHits() {
        return logHits;
    }

    public void setLogHits(boolean logHits) {
        this.logHits = logHits;
    }

    public boolean isLogMissLoads() {
        return logMissLoads;
    }

    public void setLogMissLoads(boolean logMissLoads) {
        this.logMissLoads = logMissLoads;
    }

    public KeyPrivacy getKeyPrivacy() {
        return keyPrivacy;
    }

    public void setKeyPrivacy(KeyPrivacy keyPrivacy) {
        this.keyPrivacy = keyPrivacy;
    }

    public int getTruncateLength() {
        return truncateLength;
    }

    public void setTruncateLength(int truncateLength) {
        this.truncateLength = truncateLength;
    }
}
