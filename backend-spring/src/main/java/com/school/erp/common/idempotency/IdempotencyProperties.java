package com.school.erp.common.idempotency;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.idempotency")
public class IdempotencyProperties {

    private boolean enabled = true;
    /** When Redis errors, continue the request instead of failing (availability vs safety). */
    private boolean failOpenOnRedisError = true;
    private int responseTtlSeconds = 86400;
    private int lockTtlSeconds = 120;
    private int maxBodyBytes = 262144;
    private int maxKeyLength = 128;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public boolean isFailOpenOnRedisError() {
        return failOpenOnRedisError;
    }

    public void setFailOpenOnRedisError(boolean failOpenOnRedisError) {
        this.failOpenOnRedisError = failOpenOnRedisError;
    }

    public int getResponseTtlSeconds() {
        return responseTtlSeconds;
    }

    public void setResponseTtlSeconds(int responseTtlSeconds) {
        this.responseTtlSeconds = responseTtlSeconds;
    }

    public int getLockTtlSeconds() {
        return lockTtlSeconds;
    }

    public void setLockTtlSeconds(int lockTtlSeconds) {
        this.lockTtlSeconds = lockTtlSeconds;
    }

    public int getMaxBodyBytes() {
        return maxBodyBytes;
    }

    public void setMaxBodyBytes(int maxBodyBytes) {
        this.maxBodyBytes = maxBodyBytes;
    }

    public int getMaxKeyLength() {
        return maxKeyLength;
    }

    public void setMaxKeyLength(int maxKeyLength) {
        this.maxKeyLength = maxKeyLength;
    }
}
