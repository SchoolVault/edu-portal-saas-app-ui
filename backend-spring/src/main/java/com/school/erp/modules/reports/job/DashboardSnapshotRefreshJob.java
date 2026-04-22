package com.school.erp.modules.reports.job;

import com.school.erp.modules.reports.service.DashboardSnapshotService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class DashboardSnapshotRefreshJob {
    private static final Logger log = LoggerFactory.getLogger(DashboardSnapshotRefreshJob.class);

    private final DashboardSnapshotService dashboardSnapshotService;

    @Value("${app.reports.snapshots.refresh-batch-size:50}")
    private int refreshBatchSize;

    public DashboardSnapshotRefreshJob(DashboardSnapshotService dashboardSnapshotService) {
        this.dashboardSnapshotService = dashboardSnapshotService;
    }

    @Scheduled(fixedDelayString = "${app.reports.snapshots.refresh-poll-ms:60000}")
    public void refreshSnapshots() {
        int refreshed = dashboardSnapshotService.refreshDueSnapshots(refreshBatchSize);
        if (refreshed > 0) {
            log.debug("Dashboard snapshots refreshed={}", refreshed);
        }
    }
}
