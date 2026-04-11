package com.school.erp.modules.importexport;

import com.school.erp.modules.importexport.service.ImportJobOrchestrator;
import com.school.erp.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class ImportJobAsyncLauncher {
    private static final Logger log = LoggerFactory.getLogger(ImportJobAsyncLauncher.class);
    private final ImportJobOrchestrator orchestrator;

    public ImportJobAsyncLauncher(ImportJobOrchestrator orchestrator) {
        this.orchestrator = orchestrator;
    }

    @Async
    public void start(Long jobId, String tenantId, Long userId, String userRole) {
        try {
            TenantContext.setTenantId(tenantId);
            TenantContext.setUserId(userId);
            TenantContext.setUserRole(userRole);
            orchestrator.runJob(jobId, tenantId);
        } catch (Exception ex) {
            log.error("Import job {} failed: {}", jobId, ex.getMessage(), ex);
            orchestrator.markJobFailed(jobId, tenantId, ex.getMessage());
        } finally {
            TenantContext.clear();
        }
    }
}
