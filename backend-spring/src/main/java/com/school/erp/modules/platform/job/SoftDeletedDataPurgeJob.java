package com.school.erp.modules.platform.job;

import com.school.erp.common.logging.MdcKeys;
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
 * Hard-deletes <strong>per-tenant</strong> rows that were soft-deleted longer than {@code app.lifecycle.purge.retention-days} ago,
 * from a <strong>small set of tables</strong> (audit + in-app notifications today). This is <strong>not</strong> full school erasure.
 * <p>
 * <strong>Safety:</strong> By default {@code allow-all-tenants=false}, so you must set {@code app.lifecycle.purge.tenant-ids}
 * (comma-separated). Nothing runs against “every school” unless ops explicitly sets {@code allow-all-tenants=true}.
 * <p>
 * <strong>Full legal / GDPR wipe of one org</strong> (all tables, one tenant): Super Admin suspends the workspace, then
 * {@code POST /api/v1/platform/schools/{tenantId}/purge-data} with school-code confirmation → {@link com.school.erp.modules.platform.purge.TenantDataPurgeExecutor}.
 */
@Component
public class SoftDeletedDataPurgeJob {

    private static final Logger log = LoggerFactory.getLogger(SoftDeletedDataPurgeJob.class);

    private final TenantConfigRepository tenantConfigRepository;
    private final SoftDeletedPurgeTenantRunner perTenantRunner;

    @Value("${app.lifecycle.purge.enabled:false}")
    private boolean enabled;

    @Value("${app.lifecycle.purge.dry-run:true}")
    private boolean dryRun;

    @Value("${app.lifecycle.purge.retention-days:90}")
    private int retentionDays;

    /**
     * Comma-separated tenant ids to process (must be registered in {@code tenant_configs}).
     * When {@code allow-all-tenants=false} (default), this list is <strong>required</strong> — empty means the job does nothing.
     */
    @Value("${app.lifecycle.purge.tenant-ids:}")
    private String tenantIdsCsv;

    /**
     * If true, empty {@link #tenantIdsCsv} means “all tenants in tenant_configs” (dangerous in prod). Default false.
     */
    @Value("${app.lifecycle.purge.allow-all-tenants:false}")
    private boolean allowAllTenants;

    public SoftDeletedDataPurgeJob(
            TenantConfigRepository tenantConfigRepository,
            SoftDeletedPurgeTenantRunner perTenantRunner) {
        this.tenantConfigRepository = tenantConfigRepository;
        this.perTenantRunner = perTenantRunner;
    }

    @Scheduled(cron = "${app.lifecycle.purge.cron:0 0 4 * * SUN}")
    public void purgeExpiredSoftDeletes() {
        if (!enabled) {
            return;
        }
        LocalDateTime cutoff = LocalDateTime.now().minusDays(retentionDays);
        List<String> tenantIds = resolveTargetTenantIds();
        if (tenantIds.isEmpty()) {
            log.warn("lifecycle_purge: no tenant ids to process. Set app.lifecycle.purge.tenant-ids or enable app.lifecycle.purge.allow-all-tenants (not recommended).");
            return;
        }
        if (allowAllTenants && !StringUtils.hasText(tenantIdsCsv)) {
            log.warn("lifecycle_purge: allow-all-tenants=true — processing {} school(s) for soft-delete retention only (not full wipe)", tenantIds.size());
        }
        if (dryRun) {
            log.info("lifecycle_purge dry-run: would purge soft-deleted rows per tenant before {} tenants={} count={}",
                    cutoff, tenantIds, tenantIds.size());
            return;
        }
        int totalAudit = 0;
        int totalNotif = 0;
        for (String tenantId : tenantIds) {
            if (tenantId == null || tenantId.isBlank()) {
                continue;
            }
            try {
                TenantContext.setTenantId(tenantId);
                MDC.put(MdcKeys.TENANT_ID, tenantId);
                SoftDeletedPurgeTenantRunner.TenantPurgeResult r = perTenantRunner.purgeSoftDeletedForTenant(tenantId, cutoff);
                totalAudit += r.auditDeleted();
                totalNotif += r.notificationsDeleted();
                if (r.auditDeleted() > 0 || r.notificationsDeleted() > 0) {
                    log.info("lifecycle_purge tenant={} audit_deleted={} notifications_deleted={} cutoff={}",
                            tenantId, r.auditDeleted(), r.notificationsDeleted(), cutoff);
                }
            } catch (Exception ex) {
                log.error("lifecycle_purge failed tenant={} — other tenants unaffected", tenantId, ex);
            } finally {
                TenantContext.clear();
                MdcKeys.clearTenantUser();
            }
        }
        log.info("lifecycle_purge batch complete tenants_processed={} total_audit_deleted={} total_notifications_deleted={} cutoff={}",
                tenantIds.size(), totalAudit, totalNotif, cutoff);
    }

    private List<String> resolveTargetTenantIds() {
        List<String> fromDb = tenantConfigRepository.findAllTenantIds().stream()
                .filter(StringUtils::hasText)
                .distinct()
                .collect(Collectors.toList());

        if (!StringUtils.hasText(tenantIdsCsv)) {
            if (!allowAllTenants) {
                log.info("lifecycle_purge skipped: tenant-ids empty and allow-all-tenants=false (safe default)");
                return List.of();
            }
            return fromDb;
        }

        Set<String> requested = Arrays.stream(tenantIdsCsv.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        Set<String> known = new LinkedHashSet<>(fromDb);
        List<String> unknown = requested.stream().filter(id -> !known.contains(id)).collect(Collectors.toList());
        if (!unknown.isEmpty()) {
            log.warn("lifecycle_purge: tenant-ids not found in tenant_configs (ignored): {}", unknown);
        }

        return requested.stream().filter(known::contains).collect(Collectors.toCollection(ArrayList::new));
    }
}
