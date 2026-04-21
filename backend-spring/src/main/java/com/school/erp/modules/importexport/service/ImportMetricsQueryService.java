package com.school.erp.modules.importexport.service;

import com.school.erp.modules.importexport.ImportJobConstants;
import com.school.erp.modules.importexport.dto.ImportExportDTOs;
import com.school.erp.modules.importexport.observability.ImportMetricsRecorder;
import com.school.erp.modules.importexport.repository.ImportJobRepository;
import com.school.erp.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Read-model for import activity in the current tenant (last 24h + running). Complements JVM-wide Micrometer metrics
 * exposed at {@code /actuator/metrics}.
 */
@Service
public class ImportMetricsQueryService {

    private final ImportJobRepository jobRepository;

    public ImportMetricsQueryService(ImportJobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

    @Transactional(readOnly = true)
    public ImportExportDTOs.ImportMetricsSummaryResponse tenantSummaryLast24Hours() {
        String tenantId = TenantContext.getTenantId();
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        ImportExportDTOs.ImportMetricsSummaryResponse r = new ImportExportDTOs.ImportMetricsSummaryResponse();
        r.setJobsCreatedLast24h(jobRepository.countByTenantIdAndIsDeletedFalseAndCreatedAtAfter(tenantId, since));
        r.setJobsCompletedLast24h(jobRepository.countByTenantStatusCreatedSince(tenantId, ImportJobConstants.JOB_COMPLETED, since));
        r.setJobsFailedLast24h(jobRepository.countByTenantStatusCreatedSince(tenantId, ImportJobConstants.JOB_FAILED, since));
        r.setJobsRunningNow(jobRepository.countByTenantIdAndIsDeletedFalseAndStatus(tenantId, ImportJobConstants.JOB_RUNNING));
        r.setRowsSucceededLast24h(jobRepository.sumSuccessRowsSince(tenantId, since));
        r.setRowsFailedLast24h(jobRepository.sumFailedRowsSince(tenantId, since));
        r.setMeterNamespaceHint(ImportMetricsRecorder.METER_NS);
        return r;
    }
}
