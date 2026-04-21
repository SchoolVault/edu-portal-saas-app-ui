package com.school.erp.modules.importexport.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.importer.ImportColumnMappingApplier;
import com.school.erp.common.importer.ImportFilePayloadHasher;
import com.school.erp.common.importer.TabularImportStreamReader;
import com.school.erp.config.ImportRuntimeProperties;
import com.school.erp.modules.importexport.ImportJobAsyncLauncher;
import com.school.erp.modules.importexport.observability.ImportMetricsRecorder;
import com.school.erp.modules.importexport.observability.ImportSubmitCoordinationService;
import com.school.erp.modules.importexport.ImportJobConstants;
import com.school.erp.modules.importexport.ImportJobType;
import com.school.erp.modules.importexport.dto.ImportExportDTOs;
import com.school.erp.modules.importexport.entity.ImportJob;
import com.school.erp.modules.importexport.entity.ImportJobLine;
import com.school.erp.modules.importexport.repository.ImportJobLineRepository;
import com.school.erp.modules.importexport.repository.ImportJobRepository;
import com.school.erp.tenant.TenantContext;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ImportJobService {
    private static final Logger log = LoggerFactory.getLogger(ImportJobService.class);

    private final ImportJobRepository jobRepository;
    private final ImportJobLineRepository lineRepository;
    private final ObjectMapper objectMapper;
    private final ImportJobAsyncLauncher asyncLauncher;
    private final ImportRuntimeProperties importRuntimeProperties;
    private final ImportSubmitCoordinationService submitCoordination;
    private final ImportMetricsRecorder importMetricsRecorder;
    private final BulkImportAcademicResolver academicResolver;

    @PersistenceContext
    private EntityManager entityManager;

    public ImportJobService(ImportJobRepository jobRepository,
                          ImportJobLineRepository lineRepository,
                          ObjectMapper objectMapper,
                          ImportJobAsyncLauncher asyncLauncher,
                          ImportRuntimeProperties importRuntimeProperties,
                          ImportSubmitCoordinationService submitCoordination,
                          ImportMetricsRecorder importMetricsRecorder,
                          BulkImportAcademicResolver academicResolver) {
        this.jobRepository = jobRepository;
        this.lineRepository = lineRepository;
        this.objectMapper = objectMapper;
        this.asyncLauncher = asyncLauncher;
        this.importRuntimeProperties = importRuntimeProperties;
        this.submitCoordination = submitCoordination;
        this.importMetricsRecorder = importMetricsRecorder;
        this.academicResolver = academicResolver;
    }

    @Transactional
    public ImportExportDTOs.JobSubmitResponse submit(MultipartFile file, String jobTypeParam, String columnMappingJson) {
        ImportJobType jobType = ImportJobType.fromParam(jobTypeParam);
        String tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();
        String role = TenantContext.getUserRole();

        if (file == null || file.isEmpty()) {
            throw new BusinessException("Import file is required");
        }

        Map<String, String> columnMapping = ImportColumnMappingApplier.parseMappingJson(objectMapper, columnMappingJson);
        String mappingHash = ImportColumnMappingApplier.mappingFingerprintSha256(columnMapping);

        final Path temp;
        try {
            temp = Files.createTempFile("import-submit-", ".upload");
        } catch (IOException e) {
            throw new BusinessException("Could not prepare temp file: " + e.getMessage());
        }
        try {
            try {
                file.transferTo(temp);
            } catch (IOException e) {
                throw new BusinessException("Could not read upload: " + e.getMessage());
            }
            String payloadHash = ImportFilePayloadHasher.sha256Hex(temp);
            int maxRows = importRuntimeProperties.getMaxRowsPerFile();
            int lineBatch = Math.max(100, importRuntimeProperties.getPersistJobLinesBatchSize());

            String idemKey = tenantId + "|" + jobType.name() + "|" + payloadHash + "|" + mappingHash;
            final ImportExportDTOs.JobSubmitResponse[] resultHolder = new ImportExportDTOs.JobSubmitResponse[1];
            submitCoordination.runWithSubmitLock(idemKey, () -> {
                Optional<ImportJob> inflight = jobRepository.findFirstByTenantIdAndJobTypeAndPayloadHashAndColumnMappingHashAndStatusInAndIsDeletedFalseOrderByCreatedAtDesc(
                        tenantId,
                        jobType.name(),
                        payloadHash,
                        mappingHash,
                        List.of(ImportJobConstants.JOB_QUEUED, ImportJobConstants.JOB_RUNNING));
                if (inflight.isPresent()) {
                    ImportJob existing = inflight.get();
                    log.info("Import submit idempotent: returning existing in-flight job id={} tenant={} type={} hashPrefix={}",
                            existing.getId(), tenantId, jobType.name(), hashPrefix(payloadHash));
                    importMetricsRecorder.incrementIdempotentReplay();
                    resultHolder[0] = buildSubmitResponse(existing, existing.getTotalRows() != null ? existing.getTotalRows() : 0,
                            true, payloadHash);
                    return;
                }

                importMetricsRecorder.incrementJobsSubmitted();
                ImportJob job = new ImportJob();
                job.setTenantId(tenantId);
                job.setCreatedByUserId(userId);
                job.setJobType(jobType.name());
                job.setStatus(ImportJobConstants.JOB_QUEUED);
                job.setOriginalFilename(file.getOriginalFilename());
                job.setPayloadHash(payloadHash);
                job.setColumnMappingHash(mappingHash);
                job.setTotalRows(0);
                job.setSuccessCount(0);
                job.setFailCount(0);
                job.setCreatedBy(userId != null ? userId.toString() : null);
                jobRepository.saveAndFlush(job);
                Long jobId = job.getId();

                final int[] totalRows = {0};
                final boolean[] autoAcademicYearSeen = {false};
                try {
                    TabularImportStreamReader.streamDataRows(
                            temp,
                            file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload",
                            jobType.csvEntryName(),
                            maxRows,
                            lineBatch,
                            (batch, firstRowIndex) -> {
                                List<ImportJobLine> lines = new ArrayList<>(batch.size());
                                for (int i = 0; i < batch.size(); i++) {
                                    ImportJobLine line = new ImportJobLine();
                                    line.setTenantId(tenantId);
                                    line.setJobId(jobId);
                                    line.setLineIndex(firstRowIndex + i);
                                    line.setStatus(ImportJobConstants.LINE_PENDING);
                                    try {
                                        Map<String, String> canonicalRow = ImportColumnMappingApplier.applyMapping(batch.get(i), columnMapping);
                                        if ((jobType == ImportJobType.CLASSES || jobType == ImportJobType.STUDENTS)
                                                && academicResolver.usesAutomaticAcademicYear(canonicalRow.get("academicyearid"))) {
                                            autoAcademicYearSeen[0] = true;
                                        }
                                        line.setPayloadJson(objectMapper.writeValueAsString(canonicalRow));
                                    } catch (Exception ex) {
                                        line.setPayloadJson("{}");
                                    }
                                    line.setCreatedBy(userId != null ? userId.toString() : null);
                                    lines.add(line);
                                }
                                lineRepository.saveAll(lines);
                                entityManager.flush();
                                entityManager.clear();
                                totalRows[0] += batch.size();
                            });
                } catch (Exception ex) {
                    if (ex instanceof RuntimeException re) {
                        throw re;
                    }
                    throw new RuntimeException(ex);
                }

                ImportJob persisted = jobRepository.findByIdAndTenantIdAndIsDeletedFalse(jobId, tenantId)
                        .orElseThrow(() -> new ResourceNotFoundException("ImportJob", jobId));
                persisted.setTotalRows(totalRows[0]);
                jobRepository.save(persisted);

                log.info("Import job queued id={} tenant={} type={} rows={} hashPrefix={}",
                        jobId, tenantId, jobType.name(), totalRows[0], hashPrefix(payloadHash));

                scheduleAsyncStart(jobId, tenantId, userId, role);
                resultHolder[0] = buildSubmitResponse(persisted, totalRows[0], false, payloadHash);
                if (autoAcademicYearSeen[0] && (jobType == ImportJobType.CLASSES || jobType == ImportJobType.STUDENTS)) {
                    resultHolder[0].setAdvisoryMessage(academicResolver.buildAcademicYearResolutionMessage("CURRENT"));
                }
            });
            if (resultHolder[0] == null) {
                throw new BusinessException("Import submit did not produce a response");
            }
            return resultHolder[0];
        } catch (BusinessException | ResourceNotFoundException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Import submit failed tenant={} type={}: {}", tenantId, jobType.name(), ex.toString());
            throw new BusinessException("Failed to queue import: " + (ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName()));
        } finally {
            try {
                Files.deleteIfExists(temp);
            } catch (Exception ignored) {
                // best-effort temp cleanup
            }
        }
    }

    private static String hashPrefix(String hex) {
        if (hex == null || hex.length() < 12) {
            return hex;
        }
        return hex.substring(0, 12) + "…";
    }

    private static ImportExportDTOs.JobSubmitResponse buildSubmitResponse(ImportJob job, int totalRows,
                                                                       boolean idempotentReplay, String payloadHash) {
        ImportExportDTOs.JobSubmitResponse res = new ImportExportDTOs.JobSubmitResponse();
        res.setJobId(job.getId());
        res.setStatus(job.getStatus());
        res.setTotalRows(totalRows);
        res.setIdempotentReplay(idempotentReplay);
        res.setPayloadHash(payloadHash);
        return res;
    }

    private void scheduleAsyncStart(Long jobId, String tenantId, Long userId, String role) {
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
            throw new BusinessException("Job is still running");
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
            throw new BusinessException("No failed rows to retry");
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
        res.setIdempotentReplay(false);
        res.setPayloadHash(job.getPayloadHash());
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
        r.setPayloadHash(j.getPayloadHash());
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
