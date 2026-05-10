package com.school.erp.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Runtime sizing knobs for AI orchestration/streaming executor.
 * Tuned per environment via {@code app.ai.executor.*}.
 */
@ConfigurationProperties(prefix = "app.ai.executor")
public class AiExecutorProperties {
    /** Core threads kept warm for low-latency stream startup. */
    private int corePoolSize = 4;
    /** Max burst threads during concurrent AI conversations. */
    private int maxPoolSize = 12;
    /** Back-pressure queue for short burst buffering. */
    private int queueCapacity = 300;
    /** Prefix used for diagnostics and thread dumps. */
    private String threadNamePrefix = "sv-ai-agent-";
    /** Whether core threads are allowed to time out under light load. */
    private boolean allowCoreThreadTimeout = true;
    /** Keep-alive for non-core threads (seconds). */
    private int keepAliveSeconds = 60;

    public int getCorePoolSize() {
        return corePoolSize;
    }

    public void setCorePoolSize(int corePoolSize) {
        this.corePoolSize = corePoolSize;
    }

    public int getMaxPoolSize() {
        return maxPoolSize;
    }

    public void setMaxPoolSize(int maxPoolSize) {
        this.maxPoolSize = maxPoolSize;
    }

    public int getQueueCapacity() {
        return queueCapacity;
    }

    public void setQueueCapacity(int queueCapacity) {
        this.queueCapacity = queueCapacity;
    }

    public String getThreadNamePrefix() {
        return threadNamePrefix;
    }

    public void setThreadNamePrefix(String threadNamePrefix) {
        this.threadNamePrefix = threadNamePrefix;
    }

    public boolean isAllowCoreThreadTimeout() {
        return allowCoreThreadTimeout;
    }

    public void setAllowCoreThreadTimeout(boolean allowCoreThreadTimeout) {
        this.allowCoreThreadTimeout = allowCoreThreadTimeout;
    }

    public int getKeepAliveSeconds() {
        return keepAliveSeconds;
    }

    public void setKeepAliveSeconds(int keepAliveSeconds) {
        this.keepAliveSeconds = keepAliveSeconds;
    }
}
