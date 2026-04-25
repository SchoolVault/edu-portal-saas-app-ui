package com.school.erp.modules.importexport.schedule;

import com.school.erp.config.ImportRuntimeProperties;
import com.school.erp.modules.importexport.ImportJobConstants;
import com.school.erp.modules.importexport.entity.ImportJob;
import com.school.erp.modules.importexport.repository.ImportJobRepository;
import com.school.erp.modules.importexport.service.ImportJobStateService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Marks import jobs that remain {@link ImportJobConstants#JOB_RUNNING} longer than a threshold
 * (e.g. JVM crash) as {@link ImportJobConstants#JOB_FAILED} so the UI is not stuck forever.
 */
@Component
public class ImportStuckJobWatchdog {
    private static final Logger log = LoggerFactory.getLogger(ImportStuckJobWatchdog.class);
    private final ImportJobRepository importJobRepository;
    private final ImportJobStateService importJobStateService;
    private final ImportRuntimeProperties importRuntimeProperties;

    public ImportStuckJobWatchdog(ImportJobRepository importJobRepository,
                                 ImportJobStateService importJobStateService,
                                 ImportRuntimeProperties importRuntimeProperties) {
        this.importJobRepository = importJobRepository;
        this.importJobStateService = importJobStateService;
        this.importRuntimeProperties = importRuntimeProperties;
    }

    @Scheduled(fixedDelayString = "${app.import.stuckJobPollIntervalMs:300000}", initialDelayString = "120000")
    public void markStuckRunningJobs() {
        int min = Math.max(5, importRuntimeProperties.getStuckRunningThresholdMinutes());
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(min);
        List<ImportJob> stuck = importJobRepository.findByStatusAndIsDeletedFalseAndStartedAtBefore(
                ImportJobConstants.JOB_RUNNING, cutoff);
        for (ImportJob j : stuck) {
            String tenantId = j.getTenantId();
            if (tenantId == null) {
                continue;
            }
            log.warn("Marking stuck import job as FAILED jobId={} tenant={} startedAt={}", j.getId(), tenantId, j.getStartedAt());
            importJobStateService.markJobFailed(j.getId(), tenantId,
                    "Import job was stuck in RUNNING and was marked failed by the system watchdog. Re-upload to retry.");
        }
    }
}
