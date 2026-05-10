package com.school.erp.modules.payroll.schedule;

import com.school.erp.modules.payroll.observability.FinanceOpsMetricsRecorder;
import com.school.erp.modules.payroll.repository.SalaryDisbursementAttemptRepository;
import com.school.erp.modules.payroll.service.PayrollService;
import java.time.LocalDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class PayrollDisbursementReconciliationScheduler {
    private static final Logger log = LoggerFactory.getLogger(PayrollDisbursementReconciliationScheduler.class);

    private final PayrollService payrollService;
    private final SalaryDisbursementAttemptRepository salaryDisbursementAttemptRepository;
    private final FinanceOpsMetricsRecorder financeOpsMetricsRecorder;

    @Value("${app.payroll.reconciliation.enabled:true}")
    private boolean enabled;

    @Value("${app.payroll.reconciliation.max-batch-size-per-tenant:50}")
    private int maxBatchSizePerTenant;

    @Value("${app.payroll.reconciliation.stale-submitted-threshold-minutes:30}")
    private int staleSubmittedThresholdMinutes;

    public PayrollDisbursementReconciliationScheduler(
            PayrollService payrollService,
            SalaryDisbursementAttemptRepository salaryDisbursementAttemptRepository,
            FinanceOpsMetricsRecorder financeOpsMetricsRecorder) {
        this.payrollService = payrollService;
        this.salaryDisbursementAttemptRepository = salaryDisbursementAttemptRepository;
        this.financeOpsMetricsRecorder = financeOpsMetricsRecorder;
    }

    @Scheduled(fixedDelayString = "${app.payroll.reconciliation.poll-interval-ms:300000}")
    public void reconcilePendingPayrollDisbursements() {
        if (!enabled) {
            return;
        }
        try {
            financeOpsMetricsRecorder.incrementPayrollReconciliationRuns();
            int processed = payrollService.reconcilePendingDisbursementsForAllTenants(maxBatchSizePerTenant);
            long staleSubmitted = salaryDisbursementAttemptRepository.countByStatusInAndCreatedAtBeforeAndIsDeletedFalse(
                    List.of("INITIATED", "SUBMITTED"),
                    LocalDateTime.now().minusMinutes(Math.max(1, staleSubmittedThresholdMinutes)));
            financeOpsMetricsRecorder.setStaleSubmittedPayouts(staleSubmitted);
            if (processed > 0) {
                log.info("Payroll reconciliation processed {} disbursement attempt(s)", processed);
            }
            if (staleSubmitted > 0) {
                log.warn("Detected {} stale submitted payroll disbursement attempt(s)", staleSubmitted);
            }
        } catch (Exception ex) {
            financeOpsMetricsRecorder.incrementPayrollReconciliationFailures();
            log.warn("Payroll reconciliation scheduler run failed: {}", ex.getMessage());
        }
    }
}
