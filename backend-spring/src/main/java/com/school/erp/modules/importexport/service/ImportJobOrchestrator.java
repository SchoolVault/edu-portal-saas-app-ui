package com.school.erp.modules.importexport.service;

import com.school.erp.config.ImportRuntimeProperties;
import com.school.erp.modules.importexport.ImportJobConstants;
import com.school.erp.modules.importexport.observability.ImportMetricsRecorder;
import com.school.erp.modules.importexport.entity.ImportJob;
import com.school.erp.modules.importexport.entity.ImportJobLine;
import com.school.erp.modules.importexport.repository.ImportJobLineRepository;
import com.school.erp.modules.importexport.repository.ImportJobRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
public class ImportJobOrchestrator {
    private static final Logger log = LoggerFactory.getLogger(ImportJobOrchestrator.class);
    private final ImportJobRepository jobRepository;
    private final ImportJobLineRepository lineRepository;
    private final ImportLineTransactionalRunner lineRunner;
    private final ImportLineFailureService failureService;
    private final ImportJobStateService jobStateService;
    private final ImportRuntimeProperties importRuntimeProperties;
    private final ImportMetricsRecorder importMetricsRecorder;

    public ImportJobOrchestrator(ImportJobRepository jobRepository,
                                 ImportJobLineRepository lineRepository,
                                 ImportLineTransactionalRunner lineRunner,
                                 ImportLineFailureService failureService,
                                 ImportJobStateService jobStateService,
                                 ImportRuntimeProperties importRuntimeProperties,
                                 ImportMetricsRecorder importMetricsRecorder) {
        this.jobRepository = jobRepository;
        this.lineRepository = lineRepository;
        this.lineRunner = lineRunner;
        this.failureService = failureService;
        this.jobStateService = jobStateService;
        this.importRuntimeProperties = importRuntimeProperties;
        this.importMetricsRecorder = importMetricsRecorder;
    }

    public void runJob(Long jobId, String tenantId) {
        MDC.put("importJobId", String.valueOf(jobId));
        try {
            runJobInternal(jobId, tenantId);
        } finally {
            MDC.remove("importJobId");
        }
    }

    private void runJobInternal(Long jobId, String tenantId) {
        ImportJob job = jobRepository.findByIdAndTenantIdAndIsDeletedFalse(jobId, tenantId).orElse(null);
        if (job == null) {
            log.warn("Import job not found jobId={} tenant={}", jobId, tenantId);
            return;
        }
        if (!ImportJobConstants.JOB_QUEUED.equals(job.getStatus())) {
            log.debug("Import job not in QUEUED state id={} status={}", jobId, job.getStatus());
            return;
        }
        jobStateService.markRunning(jobId, tenantId);
        int pageSize = Math.max(50, importRuntimeProperties.getOrchestratorPageSize());
        int batchIndex = 0;
        while (true) {
            Page<ImportJobLine> batch = lineRepository.findByJobIdAndTenantIdAndStatusAndIsDeletedFalseOrderByLineIndexAsc(
                    jobId, tenantId, ImportJobConstants.LINE_PENDING, PageRequest.of(0, pageSize));
            if (batch.isEmpty()) {
                break;
            }
            batchIndex++;
            log.debug("Import job {} processing batch #{} (up to {} pending lines)", jobId, batchIndex, batch.getNumberOfElements());
            for (ImportJobLine line : batch.getContent()) {
                try {
                    lineRunner.runLine(jobId, line.getId(), tenantId);
                    importMetricsRecorder.incrementLinesSuccess(1);
                } catch (Exception ex) {
                    log.warn("Import line failed jobId={} lineId={}: {}", jobId, line.getId(), ex.getMessage());
                    importMetricsRecorder.incrementLinesFailed(1);
                    failureService.markLineFailed(line.getId(), tenantId, ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName());
                }
            }
            if (importRuntimeProperties.getYieldSleepMillisBetweenPages() > 0) {
                try {
                    Thread.sleep(importRuntimeProperties.getYieldSleepMillisBetweenPages());
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
        jobStateService.finalizeJob(jobId, tenantId);
        importMetricsRecorder.incrementJobsCompleted();
    }

    public void markJobFailed(Long jobId, String tenantId, String message) {
        jobStateService.markJobFailed(jobId, tenantId, message);
    }
}
