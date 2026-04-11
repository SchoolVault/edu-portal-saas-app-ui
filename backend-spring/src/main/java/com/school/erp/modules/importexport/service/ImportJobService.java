package com.school.erp.modules.importexport.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.importer.ZipCsvImportUtil;
import com.school.erp.modules.importexport.ImportJobAsyncLauncher;
import com.school.erp.modules.importexport.ImportJobConstants;
import com.school.erp.modules.importexport.ImportJobType;
import com.school.erp.modules.importexport.dto.ImportExportDTOs;
import com.school.erp.modules.importexport.entity.ImportJob;
import com.school.erp.modules.importexport.entity.ImportJobLine;
import com.school.erp.modules.importexport.repository.ImportJobLineRepository;
import com.school.erp.modules.importexport.repository.ImportJobRepository;
import com.school.erp.tenant.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ImportJobService {
    private final ImportJobRepository jobRepository;
    private final ImportJobLineRepository lineRepository;
    private final ObjectMapper objectMapper;
    private final ImportJobAsyncLauncher asyncLauncher;

    public ImportJobService(ImportJobRepository jobRepository,
                          ImportJobLineRepository lineRepository,
                          ObjectMapper objectMapper,
                          ImportJobAsyncLauncher asyncLauncher) {
        this.jobRepository = jobRepository;
        this.lineRepository = lineRepository;
        this.objectMapper = objectMapper;
        this.asyncLauncher = asyncLauncher;
    }

    @Transactional
    public ImportExportDTOs.JobSubmitResponse submit(MultipartFile file, String jobTypeParam) {
        ImportJobType jobType = ImportJobType.fromParam(jobTypeParam);
        String tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();
        String role = TenantContext.getUserRole();

        List<Map<String, String>> rows = ZipCsvImportUtil.readRows(file, jobType.csvEntryName());

        ImportJob job = new ImportJob();
        job.setTenantId(tenantId);
        job.setCreatedByUserId(userId);
        job.setJobType(jobType.name());
        job.setStatus(ImportJobConstants.JOB_QUEUED);
        job.setOriginalFilename(file.getOriginalFilename());
        job.setTotalRows(rows.size());
        job.setSuccessCount(0);
        job.setFailCount(0);
        job.setCreatedBy(userId != null ? userId.toString() : null);
        jobRepository.save(job);

        List<ImportJobLine> lines = new ArrayList<>();
        for (int i = 0; i < rows.size(); i++) {
            ImportJobLine line = new ImportJobLine();
            line.setTenantId(tenantId);
            line.setJobId(job.getId());
            line.setLineIndex(i);
            line.setStatus(ImportJobConstants.LINE_PENDING);
            try {
                line.setPayloadJson(objectMapper.writeValueAsString(rows.get(i)));
            } catch (Exception ex) {
                line.setPayloadJson("{}");
            }
            line.setCreatedBy(userId != null ? userId.toString() : null);
            lines.add(line);
        }
        lineRepository.saveAll(lines);

        Long jobId = job.getId();
        Runnable start = () -> asyncLauncher.start(jobId, tenantId, userId, role);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    start.run();
                }
            });
        } else {
            start.run();
        }

        ImportExportDTOs.JobSubmitResponse res = new ImportExportDTOs.JobSubmitResponse();
        res.setJobId(job.getId());
        res.setStatus(job.getStatus());
        res.setTotalRows(rows.size());
        return res;
    }

    @Transactional(readOnly = true)
    public PageResponse<ImportExportDTOs.JobSummaryResponse> listJobs(int page, int size) {
        String tenantId = TenantContext.getTenantId();
        Page<ImportJob> p = jobRepository.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(tenantId, PageRequest.of(page, size));
        List<ImportExportDTOs.JobSummaryResponse> content = p.getContent().stream().map(this::toSummary).toList();
        return PageResponse.of(content, page, size, p.getTotalElements());
    }

    @Transactional(readOnly = true)
    public ImportExportDTOs.JobSummaryResponse getJob(Long jobId) {
        ImportJob job = jobRepository.findByIdAndTenantIdAndIsDeletedFalse(jobId, TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("ImportJob", jobId));
        return toSummary(job);
    }

    @Transactional(readOnly = true)
    public PageResponse<ImportExportDTOs.LineResponse> getLines(Long jobId, int page, int size) {
        String tenantId = TenantContext.getTenantId();
        jobRepository.findByIdAndTenantIdAndIsDeletedFalse(jobId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("ImportJob", jobId));
        Page<ImportJobLine> p = lineRepository.findByJobIdAndTenantIdAndIsDeletedFalseOrderByLineIndexAsc(jobId, tenantId, PageRequest.of(page, size));
        List<ImportExportDTOs.LineResponse> content = p.getContent().stream().map(this::toLine).toList();
        return PageResponse.of(content, page, size, p.getTotalElements());
    }

    @Transactional
    public ImportExportDTOs.JobSubmitResponse retryFailed(Long jobId) {
        String tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();
        String role = TenantContext.getUserRole();
        ImportJob job = jobRepository.findByIdAndTenantIdAndIsDeletedFalse(jobId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("ImportJob", jobId));
        if (ImportJobConstants.JOB_RUNNING.equals(job.getStatus())) {
            throw new com.school.erp.common.exception.BusinessException("Job is still running");
        }
        List<ImportJobLine> lines = lineRepository.findByJobIdAndTenantIdAndIsDeletedFalseOrderByLineIndexAsc(jobId, tenantId);
        int n = 0;
        for (ImportJobLine line : lines) {
            if (ImportJobConstants.LINE_FAILED.equals(line.getStatus())) {
                line.setStatus(ImportJobConstants.LINE_PENDING);
                line.setErrorMessage(null);
                line.setEntityType(null);
                line.setEntityId(null);
                n++;
            }
        }
        if (n == 0) {
            throw new com.school.erp.common.exception.BusinessException("No failed rows to retry");
        }
        lineRepository.saveAll(lines);
        job.setStatus(ImportJobConstants.JOB_QUEUED);
        job.setStartedAt(null);
        job.setFinishedAt(null);
        job.setSummaryMessage(null);
        job.setSuccessCount(0);
        job.setFailCount(0);
        jobRepository.save(job);

        Long jid = job.getId();
        Runnable start = () -> asyncLauncher.start(jid, tenantId, userId, role);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    start.run();
                }
            });
        } else {
            start.run();
        }

        ImportExportDTOs.JobSubmitResponse res = new ImportExportDTOs.JobSubmitResponse();
        res.setJobId(job.getId());
        res.setStatus(job.getStatus());
        res.setTotalRows(n);
        return res;
    }

    private ImportExportDTOs.JobSummaryResponse toSummary(ImportJob j) {
        ImportExportDTOs.JobSummaryResponse r = new ImportExportDTOs.JobSummaryResponse();
        r.setId(j.getId());
        r.setJobType(j.getJobType());
        r.setStatus(j.getStatus());
        r.setOriginalFilename(j.getOriginalFilename());
        r.setTotalRows(j.getTotalRows() != null ? j.getTotalRows() : 0);
        r.setSuccessCount(j.getSuccessCount() != null ? j.getSuccessCount() : 0);
        r.setFailCount(j.getFailCount() != null ? j.getFailCount() : 0);
        r.setStartedAt(j.getStartedAt());
        r.setFinishedAt(j.getFinishedAt());
        r.setSummaryMessage(j.getSummaryMessage());
        r.setCreatedAt(j.getCreatedAt());
        return r;
    }

    private ImportExportDTOs.LineResponse toLine(ImportJobLine line) {
        ImportExportDTOs.LineResponse r = new ImportExportDTOs.LineResponse();
        r.setId(line.getId());
        r.setLineIndex(line.getLineIndex());
        r.setStatus(line.getStatus());
        r.setErrorMessage(line.getErrorMessage());
        r.setEntityType(line.getEntityType());
        r.setEntityId(line.getEntityId());
        r.setPayloadJson(line.getPayloadJson());
        return r;
    }
}
