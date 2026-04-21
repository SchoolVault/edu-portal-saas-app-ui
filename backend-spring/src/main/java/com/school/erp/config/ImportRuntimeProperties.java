package com.school.erp.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Tunable limits for large-school bulk imports (10k+ rows). Override via env / ConfigMap.
 */
@ConfigurationProperties(prefix = "app.import")
public class ImportRuntimeProperties {

    /** Hard cap per upload to protect memory and DB transaction load. */
    private int maxRowsPerFile = 50_000;

    /** How many pending lines to load per orchestrator cycle (streaming). */
    private int orchestratorPageSize = 500;

    /** Optional cooperative scheduling pause between line batches (ms). 0 = none. */
    private int yieldSleepMillisBetweenPages = 0;

    /** Chunk size when persisting {@code import_job_line} rows after submit (reduces flush size for 10k+ rows). */
    private int persistJobLinesBatchSize = 500;

    /** Max error rows returned in dry-run sample (capped for payload size). */
    private int dryRunMaxSampleErrors = 200;

    /**
     * Max concurrent import jobs executing on this JVM (orchestrator running). 0 = unlimited (only thread pool applies).
     */
    private int maxConcurrentImportJobsPerJvm = 8;

    /**
     * When true and Redis is available, use a short-lived distributed lock during submit (cluster idempotency).
     */
    private boolean clusterSubmitLockEnabled = true;

    /** Redis key TTL for submit lock (seconds). */
    private int clusterSubmitLockTtlSeconds = 180;

    /** Retries to acquire Redis submit lock before failing with a friendly message. */
    private int clusterSubmitLockAcquireAttempts = 25;

    /** Thread pool for {@code @Async("importJobExecutor")}. */
    private int executorCorePoolSize = 2;
    private int executorMaxPoolSize = 8;
    private int executorQueueCapacity = 200;

    public int getMaxRowsPerFile() {
        return maxRowsPerFile;
    }

    public void setMaxRowsPerFile(int maxRowsPerFile) {
        this.maxRowsPerFile = maxRowsPerFile;
    }

    public int getOrchestratorPageSize() {
        return orchestratorPageSize;
    }

    public void setOrchestratorPageSize(int orchestratorPageSize) {
        this.orchestratorPageSize = orchestratorPageSize;
    }

    public int getYieldSleepMillisBetweenPages() {
        return yieldSleepMillisBetweenPages;
    }

    public void setYieldSleepMillisBetweenPages(int yieldSleepMillisBetweenPages) {
        this.yieldSleepMillisBetweenPages = yieldSleepMillisBetweenPages;
    }

    public int getPersistJobLinesBatchSize() {
        return persistJobLinesBatchSize;
    }

    public void setPersistJobLinesBatchSize(int persistJobLinesBatchSize) {
        this.persistJobLinesBatchSize = persistJobLinesBatchSize;
    }

    public int getDryRunMaxSampleErrors() {
        return dryRunMaxSampleErrors;
    }

    public void setDryRunMaxSampleErrors(int dryRunMaxSampleErrors) {
        this.dryRunMaxSampleErrors = dryRunMaxSampleErrors;
    }

    public int getMaxConcurrentImportJobsPerJvm() {
        return maxConcurrentImportJobsPerJvm;
    }

    public void setMaxConcurrentImportJobsPerJvm(int maxConcurrentImportJobsPerJvm) {
        this.maxConcurrentImportJobsPerJvm = maxConcurrentImportJobsPerJvm;
    }

    public boolean isClusterSubmitLockEnabled() {
        return clusterSubmitLockEnabled;
    }

    public void setClusterSubmitLockEnabled(boolean clusterSubmitLockEnabled) {
        this.clusterSubmitLockEnabled = clusterSubmitLockEnabled;
    }

    public int getClusterSubmitLockTtlSeconds() {
        return clusterSubmitLockTtlSeconds;
    }

    public void setClusterSubmitLockTtlSeconds(int clusterSubmitLockTtlSeconds) {
        this.clusterSubmitLockTtlSeconds = clusterSubmitLockTtlSeconds;
    }

    public int getClusterSubmitLockAcquireAttempts() {
        return clusterSubmitLockAcquireAttempts;
    }

    public void setClusterSubmitLockAcquireAttempts(int clusterSubmitLockAcquireAttempts) {
        this.clusterSubmitLockAcquireAttempts = clusterSubmitLockAcquireAttempts;
    }

    public int getExecutorCorePoolSize() {
        return executorCorePoolSize;
    }

    public void setExecutorCorePoolSize(int executorCorePoolSize) {
        this.executorCorePoolSize = executorCorePoolSize;
    }

    public int getExecutorMaxPoolSize() {
        return executorMaxPoolSize;
    }

    public void setExecutorMaxPoolSize(int executorMaxPoolSize) {
        this.executorMaxPoolSize = executorMaxPoolSize;
    }

    public int getExecutorQueueCapacity() {
        return executorQueueCapacity;
    }

    public void setExecutorQueueCapacity(int executorQueueCapacity) {
        this.executorQueueCapacity = executorQueueCapacity;
    }
}
