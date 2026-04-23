package com.school.erp.modules.importexport.service;

import com.school.erp.config.ImportRuntimeProperties;
import com.school.erp.modules.importexport.ImportJobConstants;
import com.school.erp.modules.importexport.entity.ImportJobLine;
import com.school.erp.modules.importexport.observability.ImportMetricsRecorder;
import com.school.erp.modules.importexport.repository.ImportJobLineRepository;
import com.school.erp.modules.importexport.repository.ImportJobRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Runs all pending import lines in a <strong>single</strong> database transaction so a failure on any
 * line rolls back the entire job (all-or-nothing). Intended for smaller imports.
 */
@Service
public class ImportJobAllOrNothingService {
    private final ImportJobRepository jobRepository;
    private final ImportJobLineRepository lineRepository;
    private final ImportLineTransactionalRunner lineRunner;
    private final ImportJobStateService jobStateService;
    private final ImportRuntimeProperties importRuntimeProperties;
    private final ImportMetricsRecorder importMetricsRecorder;

    public ImportJobAllOrNothingService(ImportJobRepository jobRepository,
                                       ImportJobLineRepository lineRepository,
                                       ImportLineTransactionalRunner lineRunner,
                                       ImportJobStateService jobStateService,
                                       ImportRuntimeProperties importRuntimeProperties,
                                       ImportMetricsRecorder importMetricsRecorder) {
        this.jobRepository = jobRepository;
        this.lineRepository = lineRepository;
        this.lineRunner = lineRunner;
        this.jobStateService = jobStateService;
        this.importRuntimeProperties = importRuntimeProperties;
        this.importMetricsRecorder = importMetricsRecorder;
    }

    @Transactional(rollbackFor = Exception.class)
    public void runEntireJobSingleTransaction(Long jobId, String tenantId) throws Exception {
        if (jobRepository.findByIdAndTenantIdAndIsDeletedFalse(jobId, tenantId).isEmpty()) {
            return;
        }
        jobStateService.markRunning(jobId, tenantId);
        int maxRows = importRuntimeProperties.getMaxAllOrNothingRows();
        int processed = 0;
        int pageSize = Math.max(50, importRuntimeProperties.getOrchestratorPageSize());
        while (true) {
            Page<ImportJobLine> batch = lineRepository.findByJobIdAndTenantIdAndStatusAndIsDeletedFalseOrderByLineIndexAsc(
                    jobId, tenantId, ImportJobConstants.LINE_PENDING, PageRequest.of(0, pageSize));
            if (batch.isEmpty()) {
                break;
            }
            for (ImportJobLine line : batch.getContent()) {
                if (maxRows > 0 && processed >= maxRows) {
                    throw new com.school.erp.common.exception.BusinessException(
                            "This file has too many rows for ALL_OR_NOTHING on this server (max " + maxRows
                                    + "). Use BEST_EFFORT or split the file.");
                }
                lineRunner.runLineParticipating(jobId, line.getId(), tenantId);
                importMetricsRecorder.incrementLinesSuccess(1);
                processed++;
            }
        }
        jobStateService.finalizeJob(jobId, tenantId);
        importMetricsRecorder.incrementJobsCompleted();
    }
}
