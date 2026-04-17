package com.school.erp.modules.platform.job;

import com.school.erp.modules.audit.repository.AuditLogRepository;
import com.school.erp.modules.notification.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * One transaction per tenant so a failure in one school does not roll back others.
 * Deletes are scoped with {@code tenant_id} in JPQL — never rely on {@link com.school.erp.tenant.TenantContext} alone for purge SQL.
 */
@Service
public class SoftDeletedPurgeTenantRunner {

    private final AuditLogRepository auditLogRepository;
    private final NotificationRepository notificationRepository;

    public SoftDeletedPurgeTenantRunner(
            AuditLogRepository auditLogRepository,
            NotificationRepository notificationRepository) {
        this.auditLogRepository = auditLogRepository;
        this.notificationRepository = notificationRepository;
    }

    public record TenantPurgeResult(String tenantId, int auditDeleted, int notificationsDeleted) {
    }

    /**
     * Notifications first, then audit logs (defensive ordering if future FKs link audit → notification).
     */
    @Transactional
    public TenantPurgeResult purgeSoftDeletedForTenant(String tenantId, LocalDateTime cutoff) {
        int notif = notificationRepository.deleteSoftDeletedBeforeForTenant(tenantId, cutoff);
        int audit = auditLogRepository.deleteSoftDeletedBeforeForTenant(tenantId, cutoff);
        return new TenantPurgeResult(tenantId, audit, notif);
    }
}
