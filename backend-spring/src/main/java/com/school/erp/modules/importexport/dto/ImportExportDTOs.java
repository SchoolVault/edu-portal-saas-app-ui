package com.school.erp.modules.importexport.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class ImportExportDTOs {

    /** Response for {@code POST /import-export/jobs/preview-headers} — drives the column-mapping wizard step. */
    public static class FileHeaderPreviewResponse {
        private String jobType;
        private List<String> detectedHeaders;
        private List<String> canonicalFields;
        /** Suggested map: file header (lowercase) → canonical key. Client may edit before dry-run / submit. */
        private Map<String, String> suggestedMapping;

        public String getJobType() {
            return jobType;
        }

        public void setJobType(String jobType) {
            this.jobType = jobType;
        }

        public List<String> getDetectedHeaders() {
            return detectedHeaders;
        }

        public void setDetectedHeaders(List<String> detectedHeaders) {
            this.detectedHeaders = detectedHeaders;
        }

        public List<String> getCanonicalFields() {
            return canonicalFields;
        }

        public void setCanonicalFields(List<String> canonicalFields) {
            this.canonicalFields = canonicalFields;
        }

        public Map<String, String> getSuggestedMapping() {
            return suggestedMapping;
        }

        public void setSuggestedMapping(Map<String, String> suggestedMapping) {
            this.suggestedMapping = suggestedMapping;
        }
    }

    public static class DryRunResponse {
        private String jobType;
        private int totalRows;
        private int validRows;
        private int invalidRows;
        /** Human-readable guidance for non-technical operators (e.g., which academic year auto-selected). */
        private String advisoryMessage;
        private List<DryRunRowError> sampleErrors;
        /** When true, the server recommends not queueing an import (ratio guard or future hard blocks). */
        private boolean importBlocked;
        private String importBlockCode;
        private String importBlockMessage;
        private double createOnlyDuplicateRatio;
        private int createOnlyEvaluatedRows;
        private int createOnlyCollisionRows;

        public String getJobType() {
            return jobType;
        }

        public void setJobType(String jobType) {
            this.jobType = jobType;
        }

        public int getTotalRows() {
            return totalRows;
        }

        public void setTotalRows(int totalRows) {
            this.totalRows = totalRows;
        }

        public int getValidRows() {
            return validRows;
        }

        public void setValidRows(int validRows) {
            this.validRows = validRows;
        }

        public int getInvalidRows() {
            return invalidRows;
        }

        public void setInvalidRows(int invalidRows) {
            this.invalidRows = invalidRows;
        }

        public String getAdvisoryMessage() {
            return advisoryMessage;
        }

        public void setAdvisoryMessage(String advisoryMessage) {
            this.advisoryMessage = advisoryMessage;
        }

        public List<DryRunRowError> getSampleErrors() {
            return sampleErrors;
        }

        public void setSampleErrors(List<DryRunRowError> sampleErrors) {
            this.sampleErrors = sampleErrors;
        }

        public boolean isImportBlocked() {
            return importBlocked;
        }

        public void setImportBlocked(boolean importBlocked) {
            this.importBlocked = importBlocked;
        }

        public String getImportBlockCode() {
            return importBlockCode;
        }

        public void setImportBlockCode(String importBlockCode) {
            this.importBlockCode = importBlockCode;
        }

        public String getImportBlockMessage() {
            return importBlockMessage;
        }

        public void setImportBlockMessage(String importBlockMessage) {
            this.importBlockMessage = importBlockMessage;
        }

        public double getCreateOnlyDuplicateRatio() {
            return createOnlyDuplicateRatio;
        }

        public void setCreateOnlyDuplicateRatio(double createOnlyDuplicateRatio) {
            this.createOnlyDuplicateRatio = createOnlyDuplicateRatio;
        }

        public int getCreateOnlyEvaluatedRows() {
            return createOnlyEvaluatedRows;
        }

        public void setCreateOnlyEvaluatedRows(int createOnlyEvaluatedRows) {
            this.createOnlyEvaluatedRows = createOnlyEvaluatedRows;
        }

        public int getCreateOnlyCollisionRows() {
            return createOnlyCollisionRows;
        }

        public void setCreateOnlyCollisionRows(int createOnlyCollisionRows) {
            this.createOnlyCollisionRows = createOnlyCollisionRows;
        }
    }

    public static class DryRunRowError {
        private int lineIndex;
        private String errorCode;
        private String message;
        private String dedupeKey;

        public int getLineIndex() {
            return lineIndex;
        }

        public void setLineIndex(int lineIndex) {
            this.lineIndex = lineIndex;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public String getErrorCode() {
            return errorCode;
        }

        public void setErrorCode(String errorCode) {
            this.errorCode = errorCode;
        }

        public String getDedupeKey() {
            return dedupeKey;
        }

        public void setDedupeKey(String dedupeKey) {
            this.dedupeKey = dedupeKey;
        }
    }

    public static class JobSubmitResponse {
        private Long jobId;
        private String status;
        private int totalRows;
        /** BEST_EFFORT | ALL_OR_NOTHING */
        private String executionMode;
        /** True when an in-flight job with the same payload hash already existed (idempotent replay). */
        private boolean idempotentReplay;
        /** SHA-256 hex of uploaded bytes (for client-side correlation). */
        private String payloadHash;
        /** Human-readable note shown immediately after queueing (e.g., academic year fallback used). */
        private String advisoryMessage;

        public Long getJobId() {
            return jobId;
        }

        public void setJobId(Long jobId) {
            this.jobId = jobId;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public int getTotalRows() {
            return totalRows;
        }

        public void setTotalRows(int totalRows) {
            this.totalRows = totalRows;
        }

        public String getExecutionMode() {
            return executionMode;
        }

        public void setExecutionMode(String executionMode) {
            this.executionMode = executionMode;
        }

        public boolean isIdempotentReplay() {
            return idempotentReplay;
        }

        public void setIdempotentReplay(boolean idempotentReplay) {
            this.idempotentReplay = idempotentReplay;
        }

        public String getPayloadHash() {
            return payloadHash;
        }

        public void setPayloadHash(String payloadHash) {
            this.payloadHash = payloadHash;
        }

        public String getAdvisoryMessage() {
            return advisoryMessage;
        }

        public void setAdvisoryMessage(String advisoryMessage) {
            this.advisoryMessage = advisoryMessage;
        }
    }

    public static class JobSummaryResponse {
        private Long id;
        private String jobType;
        private String status;
        private String originalFilename;
        private int totalRows;
        private int successCount;
        private int failCount;
        private LocalDateTime startedAt;
        private LocalDateTime finishedAt;
        private String summaryMessage;
        private LocalDateTime createdAt;
        private String payloadHash;
        private String executionMode;
        private boolean reprocessRequested;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getJobType() {
            return jobType;
        }

        public void setJobType(String jobType) {
            this.jobType = jobType;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getOriginalFilename() {
            return originalFilename;
        }

        public void setOriginalFilename(String originalFilename) {
            this.originalFilename = originalFilename;
        }

        public int getTotalRows() {
            return totalRows;
        }

        public void setTotalRows(int totalRows) {
            this.totalRows = totalRows;
        }

        public int getSuccessCount() {
            return successCount;
        }

        public void setSuccessCount(int successCount) {
            this.successCount = successCount;
        }

        public int getFailCount() {
            return failCount;
        }

        public void setFailCount(int failCount) {
            this.failCount = failCount;
        }

        public LocalDateTime getStartedAt() {
            return startedAt;
        }

        public void setStartedAt(LocalDateTime startedAt) {
            this.startedAt = startedAt;
        }

        public LocalDateTime getFinishedAt() {
            return finishedAt;
        }

        public void setFinishedAt(LocalDateTime finishedAt) {
            this.finishedAt = finishedAt;
        }

        public String getSummaryMessage() {
            return summaryMessage;
        }

        public void setSummaryMessage(String summaryMessage) {
            this.summaryMessage = summaryMessage;
        }

        public LocalDateTime getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
        }

        public String getPayloadHash() {
            return payloadHash;
        }

        public void setPayloadHash(String payloadHash) {
            this.payloadHash = payloadHash;
        }

        public String getExecutionMode() {
            return executionMode;
        }

        public void setExecutionMode(String executionMode) {
            this.executionMode = executionMode;
        }

        public boolean isReprocessRequested() {
            return reprocessRequested;
        }

        public void setReprocessRequested(boolean reprocessRequested) {
            this.reprocessRequested = reprocessRequested;
        }
    }

    /** Tenant-scoped summary for admin UI + alignment with Prometheus names (see {@code ImportMetricsRecorder#METER_NS}). */
    public static class ImportMetricsSummaryResponse {
        private long jobsCreatedLast24h;
        private long jobsCompletedLast24h;
        private long jobsFailedLast24h;
        private long jobsRunningNow;
        private long rowsSucceededLast24h;
        private long rowsFailedLast24h;
        private String meterNamespaceHint;

        public long getJobsCreatedLast24h() {
            return jobsCreatedLast24h;
        }

        public void setJobsCreatedLast24h(long jobsCreatedLast24h) {
            this.jobsCreatedLast24h = jobsCreatedLast24h;
        }

        public long getJobsCompletedLast24h() {
            return jobsCompletedLast24h;
        }

        public void setJobsCompletedLast24h(long jobsCompletedLast24h) {
            this.jobsCompletedLast24h = jobsCompletedLast24h;
        }

        public long getJobsFailedLast24h() {
            return jobsFailedLast24h;
        }

        public void setJobsFailedLast24h(long jobsFailedLast24h) {
            this.jobsFailedLast24h = jobsFailedLast24h;
        }

        public long getJobsRunningNow() {
            return jobsRunningNow;
        }

        public void setJobsRunningNow(long jobsRunningNow) {
            this.jobsRunningNow = jobsRunningNow;
        }

        public long getRowsSucceededLast24h() {
            return rowsSucceededLast24h;
        }

        public void setRowsSucceededLast24h(long rowsSucceededLast24h) {
            this.rowsSucceededLast24h = rowsSucceededLast24h;
        }

        public long getRowsFailedLast24h() {
            return rowsFailedLast24h;
        }

        public void setRowsFailedLast24h(long rowsFailedLast24h) {
            this.rowsFailedLast24h = rowsFailedLast24h;
        }

        public String getMeterNamespaceHint() {
            return meterNamespaceHint;
        }

        public void setMeterNamespaceHint(String meterNamespaceHint) {
            this.meterNamespaceHint = meterNamespaceHint;
        }
    }

    public static class LineResponse {
        private Long id;
        private int lineIndex;
        private String status;
        private String errorMessage;
        private String entityType;
        private Long entityId;
        private String payloadJson;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public int getLineIndex() {
            return lineIndex;
        }

        public void setLineIndex(int lineIndex) {
            this.lineIndex = lineIndex;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getErrorMessage() {
            return errorMessage;
        }

        public void setErrorMessage(String errorMessage) {
            this.errorMessage = errorMessage;
        }

        public String getEntityType() {
            return entityType;
        }

        public void setEntityType(String entityType) {
            this.entityType = entityType;
        }

        public Long getEntityId() {
            return entityId;
        }

        public void setEntityId(Long entityId) {
            this.entityId = entityId;
        }

        public String getPayloadJson() {
            return payloadJson;
        }

        public void setPayloadJson(String payloadJson) {
            this.payloadJson = payloadJson;
        }
    }

    /** One ledger row per successful import line (create / update / skip). */
    public static class LedgerLineResponse {
        private Long id;
        private Long jobLineId;
        private int lineIndex;
        private String outcome;
        private String entityType;
        private Long entityId;
        private String naturalKey;
        private String rollbackGuidance;
        private java.time.LocalDateTime createdAt;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public Long getJobLineId() {
            return jobLineId;
        }

        public void setJobLineId(Long jobLineId) {
            this.jobLineId = jobLineId;
        }

        public int getLineIndex() {
            return lineIndex;
        }

        public void setLineIndex(int lineIndex) {
            this.lineIndex = lineIndex;
        }

        public String getOutcome() {
            return outcome;
        }

        public void setOutcome(String outcome) {
            this.outcome = outcome;
        }

        public String getEntityType() {
            return entityType;
        }

        public void setEntityType(String entityType) {
            this.entityType = entityType;
        }

        public Long getEntityId() {
            return entityId;
        }

        public void setEntityId(Long entityId) {
            this.entityId = entityId;
        }

        public String getNaturalKey() {
            return naturalKey;
        }

        public void setNaturalKey(String naturalKey) {
            this.naturalKey = naturalKey;
        }

        public String getRollbackGuidance() {
            return rollbackGuidance;
        }

        public void setRollbackGuidance(String rollbackGuidance) {
            this.rollbackGuidance = rollbackGuidance;
        }

        public java.time.LocalDateTime getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(java.time.LocalDateTime createdAt) {
            this.createdAt = createdAt;
        }
    }

    /** Guided undo steps for operators (best-effort; no automatic deletes). */
    public static class RollbackBundleResponse {
        private long jobId;
        private long ledgerRowCount;
        private long createdCount;
        private long updatedCount;
        private long skippedCount;
        private java.util.List<String> suggestedOperatorSteps;

        public long getJobId() {
            return jobId;
        }

        public void setJobId(long jobId) {
            this.jobId = jobId;
        }

        public long getLedgerRowCount() {
            return ledgerRowCount;
        }

        public void setLedgerRowCount(long ledgerRowCount) {
            this.ledgerRowCount = ledgerRowCount;
        }

        public long getCreatedCount() {
            return createdCount;
        }

        public void setCreatedCount(long createdCount) {
            this.createdCount = createdCount;
        }

        public long getUpdatedCount() {
            return updatedCount;
        }

        public void setUpdatedCount(long updatedCount) {
            this.updatedCount = updatedCount;
        }

        public long getSkippedCount() {
            return skippedCount;
        }

        public void setSkippedCount(long skippedCount) {
            this.skippedCount = skippedCount;
        }

        public java.util.List<String> getSuggestedOperatorSteps() {
            return suggestedOperatorSteps;
        }

        public void setSuggestedOperatorSteps(java.util.List<String> suggestedOperatorSteps) {
            this.suggestedOperatorSteps = suggestedOperatorSteps;
        }
    }
}
