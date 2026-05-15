package com.school.erp.modules.platform.job;

import com.school.erp.modules.academic.entity.AcademicYear;
import com.school.erp.modules.academic.repository.AcademicYearRepository;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.modules.platform.service.ExamArchiveGovernanceService;
import com.school.erp.tenant.TenantScopedExecution;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Moves year-closed tenant data from hot OLTP tables to archive tables.
 * Safe no-op when no tenants/academic years exist.
 */
@Component
public class AcademicYearArchiveJob {

    private static final Logger log = LoggerFactory.getLogger(AcademicYearArchiveJob.class);

    private static final List<TableArchivePlan> TABLE_PLANS = List.of(
            new TableArchivePlan("attendance_records", "attendance_records_archive"),
            new TableArchivePlan("mark_records", "mark_records_archive"),
            new TableArchivePlan("fee_transactions", "fee_transactions_archive"),
            new TableArchivePlan("fee_payments", "fee_payments_archive"),
            new TableArchivePlan("fee_payment_attempts", "fee_payment_attempts_archive"),
            new TableArchivePlan("notifications", "notifications_archive"),
            new TableArchivePlan("announcements", "announcements_archive"),
            new TableArchivePlan("communication_events", "communication_events_archive"),
            new TableArchivePlan("book_issues", "book_issues_archive"),
            new TableArchivePlan("leave_requests", "leave_requests_archive")
    );

    private final TenantConfigRepository tenantConfigRepository;
    private final AcademicYearRepository academicYearRepository;
    private final JdbcTemplate jdbcTemplate;
    private final ExamArchiveGovernanceService examArchiveGovernanceService;

    @Value("${app.lifecycle.academic-year-archive.enabled:false}")
    private boolean enabled;

    @Value("${app.lifecycle.academic-year-archive.dry-run:true}")
    private boolean dryRun;

    @Value("${app.lifecycle.academic-year-archive.cron:0 40 2 * * SUN}")
    private String cronExpression;

    @Value("${app.lifecycle.academic-year-archive.batch-size:5000}")
    private int batchSize;

    @Value("${app.lifecycle.academic-year-archive.grace-days-after-end:30}")
    private int graceDaysAfterEnd;

    public AcademicYearArchiveJob(
            TenantConfigRepository tenantConfigRepository,
            AcademicYearRepository academicYearRepository,
            JdbcTemplate jdbcTemplate,
            ExamArchiveGovernanceService examArchiveGovernanceService) {
        this.tenantConfigRepository = tenantConfigRepository;
        this.academicYearRepository = academicYearRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.examArchiveGovernanceService = examArchiveGovernanceService;
    }

    @Scheduled(cron = "${app.lifecycle.academic-year-archive.cron:0 40 2 * * SUN}")
    @Transactional
    public void archiveClosedAcademicYears() {
        if (!enabled) {
            return;
        }
        LocalDate cutoffDate = LocalDate.now().minusDays(Math.max(0, graceDaysAfterEnd));
        List<String> tenantIds = tenantConfigRepository.findAllTenantIds().stream()
                .filter(t -> t != null && !t.isBlank())
                .toList();
        if (tenantIds.isEmpty()) {
            log.info("academic_year_archive no-op: no tenants");
            return;
        }
        if (dryRun) {
            log.info("academic_year_archive dry-run tenants={} cutoffDate={} cron={} batchSize={}",
                    tenantIds.size(), cutoffDate, cronExpression, batchSize);
            return;
        }
        int movedRows = 0;
        for (String tenantId : tenantIds) {
            movedRows += TenantScopedExecution.execute(tenantId, null, "SYSTEM",
                    () -> archiveTenantClosedYears(tenantId, cutoffDate));
        }
        log.info("academic_year_archive complete tenants={} movedRows={}", tenantIds.size(), movedRows);
    }

    private int archiveTenantClosedYears(String tenantId, LocalDate cutoffDate) {
        var policyMap = examArchiveGovernanceService.loadPolicyMap(tenantId);
        List<AcademicYear> closedYears = academicYearRepository.findByTenantIdAndIsDeletedFalseOrderByEndDateAsc(tenantId).stream()
                .filter(year -> !Boolean.TRUE.equals(year.getIsCurrent()))
                .filter(year -> year.getEndDate() != null && year.getEndDate().isBefore(cutoffDate))
                .toList();
        if (closedYears.isEmpty()) {
            return 0;
        }

        int movedRows = 0;
        for (AcademicYear year : closedYears) {
            if (examArchiveGovernanceService.isLegalHoldActive(tenantId, year.getId())) {
                log.info("academic_year_archive skipped tenantId={} academicYearId={} reason=legal_hold_active", tenantId, year.getId());
                continue;
            }
            for (TableArchivePlan tablePlan : TABLE_PLANS) {
                var policy = policyMap.get(tablePlan.sourceTable().toLowerCase());
                if (policy != null && !policy.enabled()) {
                    continue;
                }
                int retentionDays = policy != null ? Math.max(0, policy.retentionDays()) : Math.max(0, graceDaysAfterEnd);
                if (year.getEndDate() == null || !year.getEndDate().isBefore(LocalDate.now().minusDays(retentionDays))) {
                    continue;
                }
                movedRows += archiveYearForTable(tenantId, year.getId(), tablePlan);
            }
        }
        return movedRows;
    }

    private int archiveYearForTable(String tenantId, Long academicYearId, TableArchivePlan tablePlan) {
        if (!archiveTableExists(tablePlan.archiveTable())) {
            log.warn("academic_year_archive skipped table={} reason=archive_table_missing archiveTable={}",
                    tablePlan.sourceTable(), tablePlan.archiveTable());
            return 0;
        }
        int inserted = jdbcTemplate.update(
                "INSERT IGNORE INTO " + tablePlan.archiveTable()
                        + " SELECT * FROM " + tablePlan.sourceTable()
                        + " WHERE tenant_id = ? AND academic_year_id = ? LIMIT ?",
                tenantId, academicYearId, Math.max(1, batchSize));
        if (inserted <= 0) {
            return 0;
        }
        int deleted = jdbcTemplate.update(
                "DELETE FROM " + tablePlan.sourceTable()
                        + " WHERE tenant_id = ? AND academic_year_id = ? LIMIT ?",
                tenantId, academicYearId, Math.max(1, batchSize));
        int moved = Math.min(inserted, deleted);
        if (moved > 0) {
            examArchiveGovernanceService.recordArchiveManifest(tenantId, academicYearId, tablePlan.sourceTable(), tablePlan.archiveTable(), moved);
            long sourceRows = countRows(tablePlan.sourceTable(), tenantId, academicYearId);
            long archiveRows = countRows(tablePlan.archiveTable(), tenantId, academicYearId);
            examArchiveGovernanceService.recordVerification(
                    tenantId,
                    academicYearId,
                    tablePlan.sourceTable(),
                    tablePlan.archiveTable(),
                    "ARCHIVE",
                    sourceRows,
                    archiveRows,
                    sourceRows == 0 ? "OK" : "WARN",
                    sourceRows == 0 ? "Source rows drained after archive batch" : "Source rows still present, next tick will continue");
            log.info("academic_year_archive movedRows={} tenantId={} academicYearId={} table={}",
                    moved, tenantId, academicYearId, tablePlan.sourceTable());
        }
        return moved;
    }

    private long countRows(String tableName, String tenantId, Long academicYearId) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + tableName + " WHERE tenant_id = ? AND academic_year_id = ?",
                Long.class,
                tenantId,
                academicYearId);
        return count != null ? count : 0L;
    }

    private boolean archiveTableExists(String archiveTableName) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
                Integer.class,
                archiveTableName);
        return count != null && count > 0;
    }

    private record TableArchivePlan(String sourceTable, String archiveTable) {
    }
}
