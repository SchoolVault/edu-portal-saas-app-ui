package com.school.erp.modules.importexport.service;

import com.school.erp.modules.importexport.ImportJobConstants;
import com.school.erp.modules.importexport.entity.ImportJob;
import com.school.erp.modules.importexport.repository.ImportJobLineRepository;
import com.school.erp.modules.importexport.repository.ImportJobRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class ImportJobStateService {
    private final ImportJobRepository jobRepository;
    private final ImportJobLineRepository lineRepository;

    public ImportJobStateService(ImportJobRepository jobRepository, ImportJobLineRepository lineRepository) {
        this.jobRepository = jobRepository;
        this.lineRepository = lineRepository;
    }

    @Transactional
    public void markRunning(Long jobId, String tenantId) {
        ImportJob job = jobRepository.findByIdAndTenantIdAndIsDeletedFalse(jobId, tenantId).orElseThrow();
        job.setStatus(ImportJobConstants.JOB_RUNNING);
        job.setStartedAt(LocalDateTime.now());
        jobRepository.save(job);
    }

    @Transactional
    public void finalizeJob(Long jobId, String tenantId) {
        ImportJob job = jobRepository.findByIdAndTenantIdAndIsDeletedFalse(jobId, tenantId).orElseThrow();
        long ok = lineRepository.countByJobIdAndTenantIdAndStatusAndIsDeletedFalse(jobId, tenantId, ImportJobConstants.LINE_SUCCESS);
        long bad = lineRepository.countByJobIdAndTenantIdAndStatusAndIsDeletedFalse(jobId, tenantId, ImportJobConstants.LINE_FAILED);
        job.setSuccessCount((int) ok);
        job.setFailCount((int) bad);
        job.setStatus(ImportJobConstants.JOB_COMPLETED);
        job.setFinishedAt(LocalDateTime.now());
        job.setSummaryMessage("Processed " + job.getTotalRows() + " row(s): " + ok + " succeeded, " + bad + " failed.");
        jobRepository.save(job);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markJobFailed(Long jobId, String tenantId, String message) {
        jobRepository.findByIdAndTenantIdAndIsDeletedFalse(jobId, tenantId).ifPresent(job -> {
            job.setStatus(ImportJobConstants.JOB_FAILED);
            job.setFinishedAt(LocalDateTime.now());
            job.setSummaryMessage(message != null && message.length() > 500 ? message.substring(0, 500) : message);
            jobRepository.save(job);
        });
    }
}
