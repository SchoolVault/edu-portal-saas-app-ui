package com.school.erp.modules.reports.job;

import com.school.erp.modules.reports.service.ReportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class DashboardSnapshotWarmupJob {
    private static final Logger log = LoggerFactory.getLogger(DashboardSnapshotWarmupJob.class);

    private final ReportService reportService;

    @Value("${app.reports.snapshots.warmup.enabled:false}")
    private boolean warmupEnabled;

    @Value("${app.reports.snapshots.warmup.tenant-limit:30}")
    private int warmupTenantLimit;

    public DashboardSnapshotWarmupJob(ReportService reportService) {
        this.reportService = reportService;
    }

    @Scheduled(cron = "${app.reports.snapshots.warmup.cron:0 */15 * * * *}")
    public void warmupSnapshots() {
        if (!warmupEnabled) {
            return;
        }
        int warmed = reportService.warmupDashboardSnapshots(warmupTenantLimit);
        if (warmed > 0) {
            log.debug("Dashboard snapshot warmup processedTenants={}", warmed);
        }
    }
}
