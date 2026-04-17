package com.school.erp.modules.communication.job;

import com.school.erp.common.logging.MdcKeys;
import com.school.erp.modules.communication.service.CommunicationRetentionService;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Periodic soft-delete of announcements and in-app notifications older than a configurable age per tenant.
 * <p>
 * Defaults are safe (disabled / dry-run). Aligns with {@code app.lifecycle.purge} tenant allow-list pattern.
 */
@Component
public class CommunicationInboxRetentionJob {

    private static final Logger log = LoggerFactory.getLogger(CommunicationInboxRetentionJob.class);

    private final TenantConfigRepository tenantConfigRepository;
    private final CommunicationRetentionService retentionService;

    @Value("${app.communication.retention.enabled:false}")
    private boolean enabled;

    @Value("${app.communication.retention.dry-run:true}")
    private boolean dryRun;

    @Value("${app.communication.retention.months:8}")
    private int retentionMonths;

    @Value("${app.communication.retention.tenant-ids:}")
    private String tenantIdsCsv;

    @Value("${app.communication.retention.allow-all-tenants:false}")
    private boolean allowAllTenants;

    public CommunicationInboxRetentionJob(
            final TenantConfigRepository tenantConfigRepository,
            final CommunicationRetentionService retentionService) {
        this.tenantConfigRepository = tenantConfigRepository;
        this.retentionService = retentionService;
    }

    @Scheduled(cron = "${app.communication.retention.cron:0 20 3 * * SUN}")
    public void runRetention() {
        if (!enabled) {
            return;
        }
        int months = Math.max(1, retentionMonths);
        LocalDateTime cutoff = LocalDateTime.now().minusMonths(months);
        List<String> tenantIds = resolveTargetTenantIds();
        if (tenantIds.isEmpty()) {
            log.warn("communication_retention: no tenant ids (set app.communication.retention.tenant-ids or allow-all-tenants=true)");
            return;
        }
        if (dryRun) {
            log.info("communication_retention dry-run: would soft-delete rows older than {} for tenants={}", cutoff, tenantIds);
            return;
        }
        int totalA = 0;
        int totalN = 0;
        for (String tenantId : tenantIds) {
            if (tenantId == null || tenantId.isBlank()) {
                continue;
            }
            try {
                TenantContext.setTenantId(tenantId);
                MDC.put(MdcKeys.TENANT_ID, tenantId);
                CommunicationRetentionService.RetentionSweepResult r =
                        retentionService.softDeleteOlderThanForTenant(tenantId, cutoff);
                totalA += r.announcementsSoftDeleted();
                totalN += r.notificationsSoftDeleted();
                if (r.announcementsSoftDeleted() > 0 || r.notificationsSoftDeleted() > 0) {
                    log.info("communication_retention tenant={} announcements_soft_deleted={} notifications_soft_deleted={} cutoff={}",
                            tenantId, r.announcementsSoftDeleted(), r.notificationsSoftDeleted(), cutoff);
                }
            } catch (Exception ex) {
                log.error("communication_retention failed tenant={}", tenantId, ex);
            } finally {
                TenantContext.clear();
                MdcKeys.clearTenantUser();
            }
        }
        log.info("communication_retention complete tenants={} total_announcements={} total_notifications={} cutoff={}",
                tenantIds.size(), totalA, totalN, cutoff);
    }

    private List<String> resolveTargetTenantIds() {
        List<String> fromDb = tenantConfigRepository.findAllTenantIds().stream()
                .filter(StringUtils::hasText)
                .distinct()
                .collect(Collectors.toList());

        if (!StringUtils.hasText(tenantIdsCsv)) {
            if (!allowAllTenants) {
                return List.of();
            }
            return fromDb;
        }

        Set<String> requested = Arrays.stream(tenantIdsCsv.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        Set<String> known = new LinkedHashSet<>(fromDb);
        return requested.stream().filter(known::contains).collect(Collectors.toCollection(ArrayList::new));
    }
}
