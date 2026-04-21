package com.school.erp.modules.importexport.observability;

import com.school.erp.config.ImportRuntimeProperties;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.concurrent.Semaphore;

/**
 * Limits how many import jobs run concurrently <strong>on this JVM</strong>. Complements the thread pool size:
 * pool caps threads; this caps concurrent long-running jobs (fairness under multi-tenant load).
 */
@Component
public class ImportJvmConcurrencyLimiter {

    private static final Logger log = LoggerFactory.getLogger(ImportJvmConcurrencyLimiter.class);

    private final ImportRuntimeProperties properties;
    private Semaphore semaphore;

    public ImportJvmConcurrencyLimiter(ImportRuntimeProperties properties) {
        this.properties = properties;
    }

    @PostConstruct
    void init() {
        int permits = properties.getMaxConcurrentImportJobsPerJvm();
        if (permits > 0) {
            this.semaphore = new Semaphore(permits);
            log.info("Import JVM concurrency limit enabled: maxConcurrentImportJobsPerJvm={}", permits);
        } else {
            log.info("Import JVM concurrency limit disabled (maxConcurrentImportJobsPerJvm=0)");
        }
    }

    /**
     * Blocks until a permit is available (or no limit configured). Uses an uninterruptible acquire so
     * {@code @Async} methods do not need checked-exception handling.
     */
    public void acquireJobSlot() {
        if (semaphore != null) {
            semaphore.acquireUninterruptibly();
        }
    }

    public void releaseJobSlot() {
        if (semaphore != null) {
            semaphore.release();
        }
    }
}
