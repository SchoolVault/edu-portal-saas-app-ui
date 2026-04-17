package com.school.erp.modules.platform.job;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Placeholder for moving aged OLTP rows to archive tables. Safe default: logs only.
 */
@Component
public class WarmDataArchiveJob {

    private static final Logger log = LoggerFactory.getLogger(WarmDataArchiveJob.class);

    @Value("${app.lifecycle.archive.enabled:false}")
    private boolean enabled;

    @Value("${app.lifecycle.archive.dry-run:true}")
    private boolean dryRun;

    @Scheduled(cron = "${app.lifecycle.archive.cron:0 30 2 * * SAT}")
    public void archiveTick() {
        if (!enabled) {
            return;
        }
        if (dryRun) {
            log.info("lifecycle_archive dry-run: no archive tables configured yet (attendance, fees, audit partitions TBD)");
        } else {
            log.warn("lifecycle_archive enabled without archive schema — no action");
        }
    }
}
