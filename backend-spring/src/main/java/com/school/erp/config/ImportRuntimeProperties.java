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

    /**
     * When enabled, submit treats an already completed payload+mapping+jobType as idempotent replay
     * and returns that job instead of creating a new one.
     */
    private boolean completedJobIdempotencyEnabled = true;

    /**
     * Allows explicit submit-time override ({@code reprocess=true}) to bypass completed-job idempotent replay.
     * Keep disabled in production unless operators need same-file corrective UPSERT reruns.
     */
    private boolean allowReprocessOverride = true;

    /**
     * Row cap for ALL_OR_NOTHING mode (0 = unlimited — not recommended for production timeouts).
     */
    private int maxAllOrNothingRows = 3_000;

    /** Jobs stuck in RUNNING longer than this are marked FAILED by the watchdog. */
    private int stuckRunningThresholdMinutes = 120;

    /** How often the stuck-job watchdog runs (ms). */
    private int stuckJobPollIntervalMs = 300_000;

    /**
     * When true, dry-run can block submit if CREATE-only rows would mostly collide with existing data
     * (prevents a bad re-upload of the same file).
     */
    private boolean createOnlyDuplicateBlockEnabled = true;

    /**
     * If the ratio of CREATE-only rows that would hit an existing key exceeds this (0.0 - 1.0), dry-run is blocked.
     * Example: 0.40 = more than 40% duplicates stops the operator before queueing a job.
     */
    private double createOnlyDuplicateMaxRatio = 0.40d;

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

    public boolean isCompletedJobIdempotencyEnabled() {
        return completedJobIdempotencyEnabled;
    }

    public void setCompletedJobIdempotencyEnabled(boolean completedJobIdempotencyEnabled) {
        this.completedJobIdempotencyEnabled = completedJobIdempotencyEnabled;
    }

    public boolean isAllowReprocessOverride() {
        return allowReprocessOverride;
    }

    public void setAllowReprocessOverride(boolean allowReprocessOverride) {
        this.allowReprocessOverride = allowReprocessOverride;
    }

    public int getMaxAllOrNothingRows() {
        return maxAllOrNothingRows;
    }

    public void setMaxAllOrNothingRows(int maxAllOrNothingRows) {
        this.maxAllOrNothingRows = maxAllOrNothingRows;
    }

    public int getStuckRunningThresholdMinutes() {
        return stuckRunningThresholdMinutes;
    }

    public void setStuckRunningThresholdMinutes(int stuckRunningThresholdMinutes) {
        this.stuckRunningThresholdMinutes = stuckRunningThresholdMinutes;
    }

    public int getStuckJobPollIntervalMs() {
        return stuckJobPollIntervalMs;
    }

    public void setStuckJobPollIntervalMs(int stuckJobPollIntervalMs) {
        this.stuckJobPollIntervalMs = stuckJobPollIntervalMs;
    }

    public boolean isCreateOnlyDuplicateBlockEnabled() {
        return createOnlyDuplicateBlockEnabled;
    }

    public void setCreateOnlyDuplicateBlockEnabled(boolean createOnlyDuplicateBlockEnabled) {
        this.createOnlyDuplicateBlockEnabled = createOnlyDuplicateBlockEnabled;
    }

    public double getCreateOnlyDuplicateMaxRatio() {
        return createOnlyDuplicateMaxRatio;
    }

    public void setCreateOnlyDuplicateMaxRatio(double createOnlyDuplicateMaxRatio) {
        this.createOnlyDuplicateMaxRatio = createOnlyDuplicateMaxRatio;
    }
}
