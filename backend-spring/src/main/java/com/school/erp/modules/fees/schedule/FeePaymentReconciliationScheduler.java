package com.school.erp.modules.fees.schedule;

import com.school.erp.modules.fees.service.FeeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class FeePaymentReconciliationScheduler {
    private static final Logger log = LoggerFactory.getLogger(FeePaymentReconciliationScheduler.class);

    private final FeeService feeService;

    @Value("${app.fees.reconciliation.enabled:true}")
    private boolean enabled;

    @Value("${app.fees.reconciliation.stale-timeout-minutes:15}")
    private int staleTimeoutMinutes;

    public FeePaymentReconciliationScheduler(FeeService feeService) {
        this.feeService = feeService;
    }

    @Scheduled(fixedDelayString = "${app.fees.reconciliation.poll-interval-ms:300000}")
    public void reconcilePendingFeeAttempts() {
        if (!enabled) {
            return;
        }
        try {
            feeService.timeoutStaleAttempts(staleTimeoutMinutes);
            feeService.reconcilePendingAttempts();
        } catch (Exception ex) {
            log.warn("Fee reconciliation scheduler run failed: {}", ex.getMessage());
        }
    }
}
