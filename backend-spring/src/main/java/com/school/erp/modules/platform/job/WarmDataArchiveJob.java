package com.school.erp.modules.platform.job;

import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.tenant.TenantScopedExecution;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Moves aged OLTP rows to archive table payloads, then deletes source rows.
 * This keeps primary tables lean while preserving historical trace in archive JSON records.
 */
@Component
public class WarmDataArchiveJob {

    private static final Logger log = LoggerFactory.getLogger(WarmDataArchiveJob.class);
    private final TenantConfigRepository tenantConfigRepository;
    private final JdbcTemplate jdbcTemplate;

    @Value("${app.lifecycle.archive.enabled:false}")
    private boolean enabled;

    @Value("${app.lifecycle.archive.dry-run:true}")
    private boolean dryRun;

    @Value("${app.lifecycle.archive.retention-days:180}")
    private int retentionDays;

    @Value("${app.lifecycle.archive.batch-size:5000}")
    private int batchSize;

    public WarmDataArchiveJob(TenantConfigRepository tenantConfigRepository, JdbcTemplate jdbcTemplate) {
        this.tenantConfigRepository = tenantConfigRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Scheduled(cron = "${app.lifecycle.archive.cron:0 30 2 * * SAT}")
    @Transactional
    public void archiveTick() {
        if (!enabled) {
            return;
        }
        LocalDate attendanceCutoff = LocalDate.now().minusDays(retentionDays);
        LocalDateTime eventCutoff = LocalDateTime.now().minusDays(retentionDays);
        List<String> tenantIds = tenantConfigRepository.findAllTenantIds();
        if (dryRun) {
            log.info("lifecycle_archive dry-run tenants={} attendanceCutoff={} eventCutoff={} batchSize={}",
                    tenantIds.size(), attendanceCutoff, eventCutoff, batchSize);
            return;
        }
        int archivedRows = 0;
        for (String tenantId : tenantIds) {
            if (tenantId == null || tenantId.isBlank()) {
                continue;
            }
            archivedRows += TenantScopedExecution.execute(tenantId, null, "SYSTEM",
                    () -> archiveTenantRows(tenantId, attendanceCutoff, eventCutoff));
        }
        log.info("lifecycle_archive complete tenants={} archivedRows={}", tenantIds.size(), archivedRows);
    }

    private int archiveTenantRows(String tenantId, LocalDate attendanceCutoff, LocalDateTime eventCutoff) {
        int total = 0;
        total += archiveAttendanceRows(tenantId, attendanceCutoff);
        total += archiveAuditRows(tenantId, eventCutoff);
        total += archiveNotificationRows(tenantId, eventCutoff);
        return total;
    }

    private int archiveAttendanceRows(String tenantId, LocalDate cutoff) {
        int inserted = jdbcTemplate.update("""
                INSERT INTO lifecycle_archive_records (tenant_id, source_table, source_id, archived_at, source_created_at, payload_json)
                SELECT
                  a.tenant_id,
                  'attendance_records',
                  a.id,
                  NOW(),
                  a.created_at,
                  JSON_OBJECT(
                    'studentId', a.student_id,
                    'classId', a.class_id,
                    'sectionId', a.section_id,
                    'date', a.date,
                    'status', a.status
                  )
                FROM attendance_records a
                WHERE a.tenant_id = ? AND a.date < ?
                LIMIT ?
                ON DUPLICATE KEY UPDATE archived_at = VALUES(archived_at)
                """, tenantId, cutoff, batchSize);
        if (inserted > 0) {
            jdbcTemplate.update("""
                    DELETE a FROM attendance_records a
                    JOIN lifecycle_archive_records ar
                      ON ar.tenant_id = a.tenant_id
                     AND ar.source_table = 'attendance_records'
                     AND ar.source_id = a.id
                    WHERE a.tenant_id = ? AND a.date < ?
                    LIMIT ?
                    """, tenantId, cutoff, batchSize);
        }
        return inserted;
    }

    private int archiveAuditRows(String tenantId, LocalDateTime cutoff) {
        int inserted = jdbcTemplate.update("""
                INSERT INTO lifecycle_archive_records (tenant_id, source_table, source_id, archived_at, source_created_at, payload_json)
                SELECT
                  a.tenant_id,
                  'audit_logs',
                  a.id,
                  NOW(),
                  a.created_at,
                  JSON_OBJECT(
                    'action', a.action,
                    'entityType', a.entity_type,
                    'entityId', a.entity_id,
                    'description', a.description
                  )
                FROM audit_logs a
                WHERE a.tenant_id = ? AND a.created_at < ?
                LIMIT ?
                ON DUPLICATE KEY UPDATE archived_at = VALUES(archived_at)
                """, tenantId, cutoff, batchSize);
        if (inserted > 0) {
            jdbcTemplate.update("""
                    DELETE a FROM audit_logs a
                    JOIN lifecycle_archive_records ar
                      ON ar.tenant_id = a.tenant_id
                     AND ar.source_table = 'audit_logs'
                     AND ar.source_id = a.id
                    WHERE a.tenant_id = ? AND a.created_at < ?
                    LIMIT ?
                    """, tenantId, cutoff, batchSize);
        }
        return inserted;
    }

    private int archiveNotificationRows(String tenantId, LocalDateTime cutoff) {
        int inserted = jdbcTemplate.update("""
                INSERT INTO lifecycle_archive_records (tenant_id, source_table, source_id, archived_at, source_created_at, payload_json)
                SELECT
                  n.tenant_id,
                  'notifications',
                  n.id,
                  NOW(),
                  n.created_at,
                  JSON_OBJECT(
                    'userId', n.user_id,
                    'title', n.title,
                    'type', n.type,
                    'isRead', n.is_read
                  )
                FROM notifications n
                WHERE n.tenant_id = ? AND n.created_at < ? AND n.is_deleted = 1
                LIMIT ?
                ON DUPLICATE KEY UPDATE archived_at = VALUES(archived_at)
                """, tenantId, cutoff, batchSize);
        if (inserted > 0) {
            jdbcTemplate.update("""
                    DELETE n FROM notifications n
                    JOIN lifecycle_archive_records ar
                      ON ar.tenant_id = n.tenant_id
                     AND ar.source_table = 'notifications'
                     AND ar.source_id = n.id
                    WHERE n.tenant_id = ? AND n.created_at < ? AND n.is_deleted = 1
                    LIMIT ?
                    """, tenantId, cutoff, batchSize);
        }
        return inserted;
    }
}
