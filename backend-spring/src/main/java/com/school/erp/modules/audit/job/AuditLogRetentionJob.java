package com.school.erp.modules.audit.job;

import com.school.erp.modules.audit.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
public class AuditLogRetentionJob {

    private static final Logger log = LoggerFactory.getLogger(AuditLogRetentionJob.class);

    private final AuditLogRepository auditLogRepository;

    @Value("${app.audit.retention.enabled:true}")
    private boolean enabled;

    @Value("${app.audit.retention.dry-run:false}")
    private boolean dryRun;

    @Value("${app.audit.retention.months:2}")
    private int retentionMonths;

    public AuditLogRetentionJob(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Scheduled(cron = "${app.audit.retention.cron:0 5 2 1 */2 *}")
    @Transactional
    public void evictExpiredAuditRows() {
        if (!enabled) {
            return;
        }
        int safeMonths = Math.max(1, retentionMonths);
        LocalDateTime cutoff = LocalDateTime.now().minusMonths(safeMonths);
        long rows = auditLogRepository.countByCreatedAtBefore(cutoff);
        if (dryRun) {
            log.info("audit_retention dry-run: cutoff={} retentionMonths={} rowsToDelete={}", cutoff, safeMonths, rows);
            return;
        }
        int deleted = auditLogRepository.deleteByCreatedAtBefore(cutoff);
        log.info("audit_retention done: cutoff={} retentionMonths={} deletedRows={}", cutoff, safeMonths, deleted);
    }
}

