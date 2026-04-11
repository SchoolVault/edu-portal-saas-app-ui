package com.school.erp.modules.importexport.service;

import com.school.erp.modules.importexport.ImportJobConstants;
import com.school.erp.modules.importexport.entity.ImportJob;
import com.school.erp.modules.importexport.entity.ImportJobLine;
import com.school.erp.modules.importexport.repository.ImportJobLineRepository;
import com.school.erp.modules.importexport.repository.ImportJobRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ImportJobOrchestrator {
    private static final Logger log = LoggerFactory.getLogger(ImportJobOrchestrator.class);
    private final ImportJobRepository jobRepository;
    private final ImportJobLineRepository lineRepository;
    private final ImportLineTransactionalRunner lineRunner;
    private final ImportLineFailureService failureService;
    private final ImportJobStateService jobStateService;

    public ImportJobOrchestrator(ImportJobRepository jobRepository,
                                 ImportJobLineRepository lineRepository,
                                 ImportLineTransactionalRunner lineRunner,
                                 ImportLineFailureService failureService,
                                 ImportJobStateService jobStateService) {
        this.jobRepository = jobRepository;
        this.lineRepository = lineRepository;
        this.lineRunner = lineRunner;
        this.failureService = failureService;
        this.jobStateService = jobStateService;
    }

    public void runJob(Long jobId, String tenantId) {
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
        List<ImportJobLine> lines = lineRepository.findByJobIdAndTenantIdAndIsDeletedFalseOrderByLineIndexAsc(jobId, tenantId);
        for (ImportJobLine line : lines) {
            if (!ImportJobConstants.LINE_PENDING.equals(line.getStatus())) {
                continue;
            }
            try {
                lineRunner.runLine(jobId, line.getId(), tenantId);
            } catch (Exception ex) {
                log.warn("Import line failed jobId={} lineId={}: {}", jobId, line.getId(), ex.getMessage());
                failureService.markLineFailed(line.getId(), tenantId, ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName());
            }
        }
        jobStateService.finalizeJob(jobId, tenantId);
    }

    public void markJobFailed(Long jobId, String tenantId, String message) {
        jobStateService.markJobFailed(jobId, tenantId, message);
    }
}
