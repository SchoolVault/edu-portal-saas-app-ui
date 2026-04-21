package com.school.erp.modules.importexport.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.importer.ImportColumnMappingApplier;
import com.school.erp.common.importer.TabularImportStreamReader;
import com.school.erp.config.ImportRuntimeProperties;
import com.school.erp.modules.importexport.ImportJobType;
import com.school.erp.modules.importexport.dto.ImportExportDTOs;
import com.school.erp.modules.importexport.observability.ImportMetricsRecorder;
import com.school.erp.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Map;

/**
 * Validates a bulk file without persisting job rows (streams rows — no full in-memory list for 50k+ rows).
 */
@Service
public class ImportDryRunService {

    private static final Logger log = LoggerFactory.getLogger(ImportDryRunService.class);

    private final ImportRuntimeProperties importRuntimeProperties;
    private final ImportBulkRowValidator bulkRowValidator;
    private final BulkImportAcademicResolver academicResolver;
    private final ObjectMapper objectMapper;
    private final ImportMetricsRecorder importMetricsRecorder;

    public ImportDryRunService(ImportRuntimeProperties importRuntimeProperties,
                              ImportBulkRowValidator bulkRowValidator,
                              BulkImportAcademicResolver academicResolver,
                              ObjectMapper objectMapper,
                              ImportMetricsRecorder importMetricsRecorder) {
        this.importRuntimeProperties = importRuntimeProperties;
        this.bulkRowValidator = bulkRowValidator;
        this.academicResolver = academicResolver;
        this.objectMapper = objectMapper;
        this.importMetricsRecorder = importMetricsRecorder;
    }

    public ImportExportDTOs.DryRunResponse validate(MultipartFile file, String jobTypeParam, String columnMappingJson) {
        ImportJobType jobType = ImportJobType.fromParam(jobTypeParam);
        java.util.Map<String, String> columnMapping = ImportColumnMappingApplier.parseMappingJson(objectMapper, columnMappingJson);
        int maxRows = importRuntimeProperties.getMaxRowsPerFile();
        int batchSize = Math.max(100, importRuntimeProperties.getPersistJobLinesBatchSize());

        if (file == null || file.isEmpty()) {
            throw new BusinessException("Import file is required");
        }

        ImportExportDTOs.DryRunResponse res = new ImportExportDTOs.DryRunResponse();
        res.setJobType(jobType.name());
        res.setValidRows(0);
        res.setInvalidRows(0);
        res.setSampleErrors(new ArrayList<>());

        final Path temp;
        try {
            temp = Files.createTempFile("import-dryrun-", ".upload");
        } catch (IOException e) {
            throw new BusinessException("Could not prepare temp file: " + e.getMessage());
        }
        try {
            try {
                file.transferTo(temp);
            } catch (IOException e) {
                throw new BusinessException("Could not read upload: " + e.getMessage());
            }
            int maxSamples = Math.max(50, importRuntimeProperties.getDryRunMaxSampleErrors());
            final int[] valid = {0};
            final int[] invalid = {0};
            final int[] totalRows = {0};
            final boolean[] autoAcademicYearSeen = {false};

            TabularImportStreamReader.streamDataRows(
                    temp,
                    file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload",
                    jobType.csvEntryName(),
                    maxRows,
                    batchSize,
                    (batch, firstRowIndex) -> {
                        for (int i = 0; i < batch.size(); i++) {
                            Map<String, String> row = ImportColumnMappingApplier.applyMapping(batch.get(i), columnMapping);
                            int lineIndex = firstRowIndex + i;
                            totalRows[0]++;
                            if ((jobType == ImportJobType.CLASSES || jobType == ImportJobType.STUDENTS)
                                    && academicResolver.usesAutomaticAcademicYear(row.get("academicyearid"))) {
                                autoAcademicYearSeen[0] = true;
                            }
                            try {
                                bulkRowValidator.validateBeforePersist(jobType, row, true);
                                valid[0]++;
                            } catch (Exception ex) {
                                invalid[0]++;
                                if (res.getSampleErrors().size() < maxSamples) {
                                    ImportExportDTOs.DryRunRowError err = new ImportExportDTOs.DryRunRowError();
                                    err.setLineIndex(lineIndex);
                                    err.setMessage(ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName());
                                    res.getSampleErrors().add(err);
                                }
                            }
                        }
                    });
            res.setTotalRows(totalRows[0]);
            res.setValidRows(valid[0]);
            res.setInvalidRows(invalid[0]);
            if (autoAcademicYearSeen[0] && (jobType == ImportJobType.CLASSES || jobType == ImportJobType.STUDENTS)) {
                res.setAdvisoryMessage(academicResolver.buildAcademicYearResolutionMessage("CURRENT"));
            }
            importMetricsRecorder.recordDryRun(totalRows[0]);
            log.debug("Dry-run done tenant={} type={} total={} valid={} invalid={}",
                    TenantContext.getTenantId(), jobType.name(), totalRows[0], valid[0], invalid[0]);
            return res;
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Dry-run failed: {}", ex.toString());
            throw new BusinessException("Dry-run failed: " + (ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName()));
        } finally {
            try {
                Files.deleteIfExists(temp);
            } catch (Exception ignored) {
                // best-effort
            }
        }
    }
}
