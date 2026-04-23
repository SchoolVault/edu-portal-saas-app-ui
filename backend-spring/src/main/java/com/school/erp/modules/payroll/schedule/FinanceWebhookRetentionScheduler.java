package com.school.erp.modules.payroll.schedule;

import com.school.erp.modules.fees.repository.PaymentWebhookEventRepository;
import com.school.erp.modules.payroll.observability.FinanceOpsMetricsRecorder;
import com.school.erp.modules.payroll.repository.PayrollPayoutWebhookEventRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class FinanceWebhookRetentionScheduler {
    private static final Logger log = LoggerFactory.getLogger(FinanceWebhookRetentionScheduler.class);

    private final PaymentWebhookEventRepository feeWebhookRepo;
    private final PayrollPayoutWebhookEventRepository payrollWebhookRepo;
    private final FinanceOpsMetricsRecorder metrics;

    @Value("${app.finance.webhook-retention.enabled:true}")
    private boolean enabled;

    @Value("${app.finance.webhook-retention.days:180}")
    private int retentionDays;

    public FinanceWebhookRetentionScheduler(
            PaymentWebhookEventRepository feeWebhookRepo,
            PayrollPayoutWebhookEventRepository payrollWebhookRepo,
            FinanceOpsMetricsRecorder metrics) {
        this.feeWebhookRepo = feeWebhookRepo;
        this.payrollWebhookRepo = payrollWebhookRepo;
        this.metrics = metrics;
    }

    @Scheduled(cron = "${app.finance.webhook-retention.cron:0 20 2 * * *}")
    @Transactional
    public void cleanupExpiredWebhookPayloads() {
        if (!enabled) return;
        Instant cutoff = Instant.now().minus(Math.max(30, retentionDays), ChronoUnit.DAYS);
        metrics.incrementWebhookRetentionRuns();
        long feeRows = feeWebhookRepo.countByCreatedAtBefore(cutoff);
        long payrollRows = payrollWebhookRepo.countByCreatedAtBefore(cutoff);
        long total = feeRows + payrollRows;
        if (feeRows > 0) feeWebhookRepo.deleteByCreatedAtBefore(cutoff);
        if (payrollRows > 0) payrollWebhookRepo.deleteByCreatedAtBefore(cutoff);
        metrics.incrementWebhookRetentionDeleted(total);
        if (total > 0) {
            log.info("Finance webhook retention deleted {} row(s) older than {} days", total, retentionDays);
        }
    }
}
