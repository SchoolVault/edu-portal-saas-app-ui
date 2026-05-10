package com.school.erp.modules.importexport.service;

import com.school.erp.tenant.TenantContext;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class CanonicalExportJobAsyncLauncher {
    private final CanonicalExportJobService canonicalExportJobService;

    public CanonicalExportJobAsyncLauncher(CanonicalExportJobService canonicalExportJobService) {
        this.canonicalExportJobService = canonicalExportJobService;
    }

    @Async("importJobExecutor")
    public void start(Long jobId, String tenantId, Long userId, String userRole) {
        try {
            TenantContext.setTenantId(tenantId);
            TenantContext.setUserId(userId);
            TenantContext.setUserRole(userRole);
            canonicalExportJobService.executeJob(jobId, tenantId);
        } finally {
            TenantContext.clear();
        }
    }
}
