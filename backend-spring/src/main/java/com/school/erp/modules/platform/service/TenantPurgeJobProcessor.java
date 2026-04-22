package com.school.erp.modules.platform.service;

import com.school.erp.modules.platform.entity.PlatformTenantPurgeJob;
import com.school.erp.modules.platform.purge.TenantDataPurgeExecutor;
import com.school.erp.modules.platform.repository.PlatformTenantPurgeJobRepository;
import com.school.erp.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
public class TenantPurgeJobProcessor {
    private static final Logger log = LoggerFactory.getLogger(TenantPurgeJobProcessor.class);

    private final PlatformTenantPurgeJobRepository jobRepository;
    private final TenantDataPurgeExecutor purgeExecutor;

    public TenantPurgeJobProcessor(PlatformTenantPurgeJobRepository jobRepository, TenantDataPurgeExecutor purgeExecutor) {
        this.jobRepository = jobRepository;
        this.purgeExecutor = purgeExecutor;
    }

    @Async
    public void processJobAsync(Long jobId) {
        PlatformTenantPurgeJob job = jobRepository.findById(jobId).orElse(null);
        if (job == null) {
            return;
        }
        try {
            TenantContext.setTenantId(job.getTenantId());
            job.setStatus("RUNNING");
            job.setStartedAt(LocalDateTime.now());
            jobRepository.save(job);
            TenantDataPurgeExecutor.PurgeExecutionSummary summary = purgeExecutor.purgeTenantData(job.getTenantId());
            PlatformTenantPurgeJob updated = jobRepository.findById(jobId).orElse(job);
            updated.setStatus("COMPLETED");
            updated.setRowsDeletedEstimate((int) Math.min(Integer.MAX_VALUE, summary.totalRowsDeleted()));
            updated.setCompletedAt(LocalDateTime.now());
            if (updated.getStartedAt() != null) {
                updated.setExecutionDurationMs(ChronoUnit.MILLIS.between(updated.getStartedAt(), updated.getCompletedAt()));
            }
            jobRepository.save(updated);
        } catch (Exception e) {
            log.error("Tenant purge job {} failed for tenant {}", jobId, job.getTenantId(), e);
            PlatformTenantPurgeJob updated = jobRepository.findById(jobId).orElse(job);
            updated.setStatus("FAILED");
            updated.setErrorMessage(e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
            updated.setCompletedAt(LocalDateTime.now());
            if (updated.getStartedAt() != null) {
                updated.setExecutionDurationMs(ChronoUnit.MILLIS.between(updated.getStartedAt(), updated.getCompletedAt()));
            }
            jobRepository.save(updated);
        } finally {
            TenantContext.clear();
        }
    }
}
