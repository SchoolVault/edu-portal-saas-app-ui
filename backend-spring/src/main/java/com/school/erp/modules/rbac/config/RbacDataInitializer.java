package com.school.erp.modules.rbac.config;

import com.school.erp.modules.rbac.service.RbacTenantBootstrapService;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.task.TaskExecutor;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

/**
 * One-time (idempotent) seed per school tenant after deploy: default role rows + backfill from legacy
 * {@code users.role} if assignments are empty.
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE - 20)
public class RbacDataInitializer implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(RbacDataInitializer.class);

    private final TenantConfigRepository tenantConfigRepository;
    private final RbacTenantBootstrapService rbacTenantBootstrapService;
    private final TaskExecutor taskExecutor;
    private final boolean blockingStartup;
    private final int maxAttemptsPerTenant;
    private final long retryBackoffMillis;
    private final Counter tenantsProcessedCounter;
    private final Counter tenantsFailedCounter;
    private final Counter tenantRetryCounter;
    private final Timer bootstrapDurationTimer;

    public RbacDataInitializer(
            TenantConfigRepository tenantConfigRepository,
            RbacTenantBootstrapService rbacTenantBootstrapService,
            @Qualifier("rbacBootstrapExecutor") TaskExecutor taskExecutor,
            ObjectProvider<MeterRegistry> meterRegistryProvider,
            @Value("${app.rbac.bootstrap.blocking-startup:false}") boolean blockingStartup,
            @Value("${app.rbac.bootstrap.max-attempts-per-tenant:2}") int configuredMaxAttemptsPerTenant,
            @Value("${app.rbac.bootstrap.retry-backoff-ms:250}") long configuredRetryBackoffMillis) {
        this.tenantConfigRepository = tenantConfigRepository;
        this.rbacTenantBootstrapService = rbacTenantBootstrapService;
        this.taskExecutor = taskExecutor;
        this.blockingStartup = blockingStartup;
        this.maxAttemptsPerTenant = Math.max(1, configuredMaxAttemptsPerTenant);
        this.retryBackoffMillis = Math.max(0, configuredRetryBackoffMillis);

        MeterRegistry meterRegistry = meterRegistryProvider.getIfAvailable();
        if (meterRegistry == null) {
            this.tenantsProcessedCounter = null;
            this.tenantsFailedCounter = null;
            this.tenantRetryCounter = null;
            this.bootstrapDurationTimer = null;
        } else {
            this.tenantsProcessedCounter = Counter.builder("school.rbac.bootstrap.tenants.processed")
                    .description("Number of tenants successfully processed by RBAC bootstrap")
                    .register(meterRegistry);
            this.tenantsFailedCounter = Counter.builder("school.rbac.bootstrap.tenants.failed")
                    .description("Number of tenants that failed RBAC bootstrap after retries")
                    .register(meterRegistry);
            this.tenantRetryCounter = Counter.builder("school.rbac.bootstrap.tenants.retried")
                    .description("Number of retry attempts performed during RBAC bootstrap")
                    .register(meterRegistry);
            this.bootstrapDurationTimer = Timer.builder("school.rbac.bootstrap.duration")
                    .description("Duration of a full RBAC bootstrap run")
                    .register(meterRegistry);
        }
    }

    @Override
    public void run(ApplicationArguments args) {
        if (blockingStartup) {
            seedAllTenants();
            return;
        }

        taskExecutor.execute(this::seedAllTenants);
        log.info("RBAC bootstrap scheduled asynchronously on executor=rbacBootstrapExecutor");
    }

    private void seedAllTenants() {
        long startedAt = System.currentTimeMillis();
        int total = 0;
        int seeded = 0;
        int failed = 0;
        log.info("RBAC bootstrap started mode={} maxAttemptsPerTenant={} retryBackoffMs={}",
                blockingStartup ? "blocking" : "async",
                maxAttemptsPerTenant,
                retryBackoffMillis);
        for (String tid : tenantConfigRepository.findAllTenantIds()) {
            total++;
            if (seedTenantWithRetry(tid)) {
                seeded++;
            } else {
                failed++;
            }
        }
        long elapsedMs = System.currentTimeMillis() - startedAt;
        if (bootstrapDurationTimer != null) {
            bootstrapDurationTimer.record(elapsedMs, TimeUnit.MILLISECONDS);
        }
        log.info("RBAC bootstrap completed totalTenants={} succeeded={} failed={} elapsedMs={}",
                total, seeded, failed, elapsedMs);
    }

    private boolean seedTenantWithRetry(String tenantId) {
        for (int attempt = 1; attempt <= maxAttemptsPerTenant; attempt++) {
            try {
                rbacTenantBootstrapService.ensureTenantSeeded(tenantId);
                if (tenantsProcessedCounter != null) {
                    tenantsProcessedCounter.increment();
                }
                if (attempt > 1) {
                    log.info("RBAC seed recovered for tenantId={} on attempt={}", tenantId, attempt);
                }
                return true;
            } catch (Exception ex) {
                boolean willRetry = attempt < maxAttemptsPerTenant;
                log.warn("RBAC seed failed tenantId={} attempt={}/{} retry={} message={}",
                        tenantId,
                        attempt,
                        maxAttemptsPerTenant,
                        willRetry,
                        ex.getMessage());
                if (willRetry) {
                    if (tenantRetryCounter != null) {
                        tenantRetryCounter.increment();
                    }
                    sleepBeforeRetry();
                    continue;
                }
                if (tenantsFailedCounter != null) {
                    tenantsFailedCounter.increment();
                }
                return false;
            }
        }
        return false;
    }

    private void sleepBeforeRetry() {
        if (retryBackoffMillis <= 0) {
            return;
        }
        try {
            Thread.sleep(retryBackoffMillis);
        } catch (InterruptedException interruptedException) {
            Thread.currentThread().interrupt();
            log.warn("RBAC bootstrap retry sleep interrupted, continuing with interrupt flag set");
        }
    }
}
