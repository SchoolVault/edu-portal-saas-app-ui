package com.school.erp.modules.transport.job;

import com.school.erp.modules.transport.repository.TransportRouteRepository;
import com.school.erp.modules.transport.service.TransportOperationsService;
import com.school.erp.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class TransportOpsScheduler {
    private static final Logger log = LoggerFactory.getLogger(TransportOpsScheduler.class);

    private final TransportRouteRepository routeRepo;
    private final TransportOperationsService transportOperationsService;

    public TransportOpsScheduler(
            TransportRouteRepository routeRepo,
            TransportOperationsService transportOperationsService) {
        this.routeRepo = routeRepo;
        this.transportOperationsService = transportOperationsService;
    }

    @Scheduled(cron = "${app.transport.ops.dlq-retry-cron:0 */5 * * * *}")
    public void retryDeadLetterEvents() {
        for (String tenantId : routeRepo.findDistinctTenantIds()) {
            try {
                TenantContext.setTenantId(tenantId);
                int retried = transportOperationsService.runDlqRetrySweepForTenant(tenantId);
                if (retried > 0) {
                    log.info("Transport DLQ retry sweep tenant={} retried={}", tenantId, retried);
                }
            } catch (Exception ex) {
                log.warn("Transport DLQ retry sweep failed tenant={}: {}", tenantId, ex.getMessage());
            } finally {
                TenantContext.clear();
            }
        }
    }

    @Scheduled(cron = "${app.transport.ops.escalation-cron:0 */10 * * * *}")
    public void runEscalationSweep() {
        for (String tenantId : routeRepo.findDistinctTenantIds()) {
            try {
                TenantContext.setTenantId(tenantId);
                int escalated = transportOperationsService.runEscalationSweepForTenant(tenantId);
                if (escalated > 0) {
                    log.info("Transport escalation sweep tenant={} escalated={}", tenantId, escalated);
                }
            } catch (Exception ex) {
                log.warn("Transport escalation sweep failed tenant={}: {}", tenantId, ex.getMessage());
            } finally {
                TenantContext.clear();
            }
        }
    }

    @Scheduled(cron = "${app.transport.ops.retention-cron:0 25 2 * * *}")
    public void runRetentionSweep() {
        for (String tenantId : routeRepo.findDistinctTenantIds()) {
            try {
                TenantContext.setTenantId(tenantId);
                int changed = transportOperationsService.runRetentionForTenant(tenantId);
                if (changed > 0) {
                    log.info("Transport retention sweep tenant={} affectedRows={}", tenantId, changed);
                }
            } catch (Exception ex) {
                log.warn("Transport retention sweep failed tenant={}: {}", tenantId, ex.getMessage());
            } finally {
                TenantContext.clear();
            }
        }
    }
}
