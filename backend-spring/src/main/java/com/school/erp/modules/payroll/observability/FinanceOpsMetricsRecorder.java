package com.school.erp.modules.payroll.observability;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Component;

/**
 * Low-cardinality operational metrics for fees + payroll reconciliation.
 */
@Component
public class FinanceOpsMetricsRecorder {
    private static final String NS = "school.finance";

    private final Counter payrollReconciliationRuns;
    private final Counter payrollReconciliationFailures;
    private final Counter webhookRetentionRuns;
    private final Counter webhookRetentionDeleted;
    private final AtomicLong staleSubmittedPayouts = new AtomicLong(0);

    public FinanceOpsMetricsRecorder(MeterRegistry meterRegistry) {
        this.payrollReconciliationRuns = Counter.builder(NS + ".payroll.reconciliation.runs")
                .description("Payroll reconciliation scheduler runs")
                .register(meterRegistry);
        this.payrollReconciliationFailures = Counter.builder(NS + ".payroll.reconciliation.failures")
                .description("Payroll reconciliation scheduler failures")
                .register(meterRegistry);
        this.webhookRetentionRuns = Counter.builder(NS + ".webhook.retention.runs")
                .description("Webhook retention cleanup runs")
                .register(meterRegistry);
        this.webhookRetentionDeleted = Counter.builder(NS + ".webhook.retention.deleted")
                .description("Webhook rows deleted by retention policy")
                .register(meterRegistry);
        Gauge.builder(NS + ".payroll.stale_submitted.count", staleSubmittedPayouts, AtomicLong::get)
                .description("Submitted payroll payouts older than stale threshold")
                .register(meterRegistry);
    }

    public void incrementPayrollReconciliationRuns() { payrollReconciliationRuns.increment(); }
    public void incrementPayrollReconciliationFailures() { payrollReconciliationFailures.increment(); }
    public void incrementWebhookRetentionRuns() { webhookRetentionRuns.increment(); }
    public void incrementWebhookRetentionDeleted(long count) {
        if (count > 0) webhookRetentionDeleted.increment(count);
    }
    public void setStaleSubmittedPayouts(long count) { staleSubmittedPayouts.set(Math.max(0, count)); }
}
