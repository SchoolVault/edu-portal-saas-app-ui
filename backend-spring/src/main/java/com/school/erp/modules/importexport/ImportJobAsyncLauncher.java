package com.school.erp.modules.importexport;

import com.school.erp.modules.importexport.observability.ImportJvmConcurrencyLimiter;
import com.school.erp.modules.importexport.observability.ImportMetricsRecorder;
import com.school.erp.modules.importexport.service.ImportJobOrchestrator;
import com.school.erp.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class ImportJobAsyncLauncher {
    private static final Logger log = LoggerFactory.getLogger(ImportJobAsyncLauncher.class);
    private final ImportJobOrchestrator orchestrator;
    private final ImportJvmConcurrencyLimiter concurrencyLimiter;
    private final ImportMetricsRecorder importMetricsRecorder;

    public ImportJobAsyncLauncher(ImportJobOrchestrator orchestrator,
                                  ImportJvmConcurrencyLimiter concurrencyLimiter,
                                  ImportMetricsRecorder importMetricsRecorder) {
        this.orchestrator = orchestrator;
        this.concurrencyLimiter = concurrencyLimiter;
        this.importMetricsRecorder = importMetricsRecorder;
    }

    @Async("importJobExecutor")
    public void start(Long jobId, String tenantId, Long userId, String userRole) {
        try {
            TenantContext.setTenantId(tenantId);
            TenantContext.setUserId(userId);
            TenantContext.setUserRole(userRole);
            MDC.put("importJobId", String.valueOf(jobId));
            concurrencyLimiter.acquireJobSlot();
            importMetricsRecorder.activeJobStarted();
            long t0 = System.currentTimeMillis();
            try {
                orchestrator.runJob(jobId, tenantId);
                importMetricsRecorder.recordJobDurationMs(System.currentTimeMillis() - t0);
            } catch (Exception ex) {
                log.error("Import job {} failed: {}", jobId, ex.getMessage(), ex);
                importMetricsRecorder.incrementJobsFailed();
                orchestrator.markJobFailed(jobId, tenantId,
                        ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName());
            } finally {
                importMetricsRecorder.activeJobFinished();
                concurrencyLimiter.releaseJobSlot();
            }
        } finally {
            MDC.remove("importJobId");
            TenantContext.clear();
        }
    }
}
