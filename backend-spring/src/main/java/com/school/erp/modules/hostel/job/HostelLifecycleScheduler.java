package com.school.erp.modules.hostel.job;

import com.school.erp.modules.hostel.dto.HostelDTOs;
import com.school.erp.modules.hostel.entity.Hostel;
import com.school.erp.modules.hostel.repository.HostelRepository;
import com.school.erp.modules.hostel.service.HostelService;
import com.school.erp.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class HostelLifecycleScheduler {
    private static final Logger log = LoggerFactory.getLogger(HostelLifecycleScheduler.class);
    private final HostelRepository hostelRepository;
    private final HostelService hostelService;

    public HostelLifecycleScheduler(HostelRepository hostelRepository, HostelService hostelService) {
        this.hostelRepository = hostelRepository;
        this.hostelService = hostelService;
    }

    @Scheduled(cron = "${app.hostel.billing.nightly-cron:0 10 1 * * *}")
    public void runNightlyBilling() {
        Set<String> tenants = hostelRepository.findAll().stream()
                .map(Hostel::getTenantId)
                .filter(t -> t != null && !t.isBlank())
                .collect(Collectors.toSet());
        for (String tenantId : tenants) {
            try {
                TenantContext.setTenantId(tenantId);
                HostelDTOs.BillingRunRequest req = new HostelDTOs.BillingRunRequest();
                req.setDueDate(LocalDate.now());
                req.setIdempotencyKey("NIGHTLY-" + LocalDate.now());
                req.setNote("Nightly hostel billing scheduler");
                hostelService.triggerBillingRun(req);
            } catch (Exception ex) {
                log.warn("Hostel nightly billing failed tenant={}: {}", tenantId, ex.getMessage());
            } finally {
                TenantContext.clear();
            }
        }
    }

    @Scheduled(cron = "${app.hostel.incident.sla-cron:0 */20 * * * *}")
    public void runIncidentSlaSweep() {
        Set<String> tenants = hostelRepository.findAll().stream()
                .map(Hostel::getTenantId)
                .filter(t -> t != null && !t.isBlank())
                .collect(Collectors.toSet());
        for (String tenantId : tenants) {
            try {
                TenantContext.setTenantId(tenantId);
                int escalated = hostelService.runIncidentSlaSweep();
                if (escalated > 0) {
                    log.info("Hostel SLA sweep escalated {} incidents for tenant={}", escalated, tenantId);
                }
            } catch (Exception ex) {
                log.warn("Hostel SLA sweep failed tenant={}: {}", tenantId, ex.getMessage());
            } finally {
                TenantContext.clear();
            }
        }
    }
}
