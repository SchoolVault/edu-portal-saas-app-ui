package com.school.erp.modules.reports.service;

import com.school.erp.cache.RedisTenantCacheEvictor;
import com.school.erp.config.CacheConfig;
import com.school.erp.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardSnapshotInvalidationService {
    private static final Logger log = LoggerFactory.getLogger(DashboardSnapshotInvalidationService.class);

    private final ObjectProvider<RedisTenantCacheEvictor> redisTenantCacheEvictorProvider;
    private final DashboardSnapshotService dashboardSnapshotService;

    public DashboardSnapshotInvalidationService(
            ObjectProvider<RedisTenantCacheEvictor> redisTenantCacheEvictorProvider,
            DashboardSnapshotService dashboardSnapshotService) {
        this.redisTenantCacheEvictorProvider = redisTenantCacheEvictorProvider;
        this.dashboardSnapshotService = dashboardSnapshotService;
    }

    @Transactional
    public void invalidateCurrentTenant(String reason) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            return;
        }
        RedisTenantCacheEvictor redisTenantCacheEvictor = redisTenantCacheEvictorProvider.getIfAvailable();
        long evicted = 0;
        if (redisTenantCacheEvictor != null) {
            evicted = redisTenantCacheEvictor.evictTenantEntriesInRegion(CacheConfig.DASHBOARD_SNAPSHOTS, tenantId);
        }
        int marked = dashboardSnapshotService.markCurrentTenantRefreshRequired(reason);
        log.info("Dashboard snapshot invalidated tenantId={} reason={} cacheKeysEvicted={} dbRowsMarked={}",
                tenantId, reason, evicted, marked);
    }
}
