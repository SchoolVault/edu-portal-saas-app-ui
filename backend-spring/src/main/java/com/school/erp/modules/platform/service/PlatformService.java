package com.school.erp.modules.platform.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.export.CsvExportSupport;
import com.school.erp.common.export.SchoolExportBranding;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.dto.AuthManagementDTOs;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.auth.service.AuthService;
import com.school.erp.modules.notification.entity.Notification;
import com.school.erp.modules.notification.repository.NotificationRepository;
import com.school.erp.modules.platform.dto.PlatformDTOs;
import com.school.erp.modules.platform.entity.PlatformTenantPurgeJob;
import com.school.erp.modules.messaging.OutboundNotificationFanout;
import com.school.erp.modules.platform.repository.PlatformTenantPurgeJobRepository;
import com.school.erp.modules.reports.repository.DashboardSnapshotRepository;
import com.school.erp.modules.reports.repository.ReportGenerationJobRepository;
import com.school.erp.modules.reports.service.ReportBinaryStorageService;
import com.school.erp.modules.reports.service.ReportPerformanceMetricsService;
import com.school.erp.modules.settings.entity.TenantConfig;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.tenant.TenantContext;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.io.IOException;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileStore;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;
import javax.sql.DataSource;
import com.zaxxer.hikari.HikariDataSource;

@Service
public class PlatformService {

    private static final Logger log = LoggerFactory.getLogger(PlatformService.class);

    private final TenantConfigRepository tenantConfigRepository;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final PlatformTenantPurgeJobRepository purgeJobRepository;
    private final TenantPurgeJobProcessor tenantPurgeJobProcessor;
    private final NotificationRepository notificationRepository;
    private final OutboundNotificationFanout outboundNotificationFanout;
    private final AuthService authService;
    private final DashboardSnapshotRepository dashboardSnapshotRepository;
    private final ReportGenerationJobRepository reportGenerationJobRepository;
    private final ReportBinaryStorageService reportBinaryStorageService;
    private final ReportPerformanceMetricsService reportPerformanceMetricsService;
    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    @Value("${app.observability.slo.report-read-p95-warn-ms:800}")
    private double reportReadP95WarnMs;
    @Value("${app.observability.slo.report-read-p95-critical-ms:1500}")
    private double reportReadP95CriticalMs;
    @Value("${app.observability.slo.snapshot-hit-rate-warn-pct:70}")
    private double snapshotHitRateWarnPct;
    @Value("${app.observability.slo.snapshot-hit-rate-critical-pct:50}")
    private double snapshotHitRateCriticalPct;
    @Value("${app.observability.slo.snapshot-refresh-backlog-warn:50}")
    private double snapshotBacklogWarn;
    @Value("${app.observability.slo.snapshot-refresh-backlog-critical:120}")
    private double snapshotBacklogCritical;
    @Value("${app.observability.slo.db-pool-pending-warn:5}")
    private double dbPoolPendingWarn;
    @Value("${app.observability.slo.db-pool-pending-critical:12}")
    private double dbPoolPendingCritical;
    @Value("${app.observability.slo.jvm-heap-warn-pct:85}")
    private double jvmHeapWarnPct;
    @Value("${app.observability.slo.jvm-heap-critical-pct:93}")
    private double jvmHeapCriticalPct;
    @Value("${app.lifecycle.storage.missing-files-warn:10}")
    private double storageMissingWarn;
    @Value("${app.lifecycle.storage.missing-files-critical:30}")
    private double storageMissingCritical;
    @Value("${app.lifecycle.storage.reconcile-max-sample:20}")
    private int storageReconcileMaxSample;
    @Value("${app.lifecycle.archive.lag-warn-days:2}")
    private double archiveLagWarnDays;
    @Value("${app.lifecycle.archive.lag-critical-days:5}")
    private double archiveLagCriticalDays;

    /** Mutable in-process catalog (replace with persistence + audit when billing service is integrated). */
    private final List<PlatformDTOs.SubscriptionPlanRow> subscriptionPlanCatalog = new CopyOnWriteArrayList<>();

    @PostConstruct
    void initSubscriptionPlanCatalog() {
        if (!subscriptionPlanCatalog.isEmpty()) {
            return;
        }
        subscriptionPlanCatalog.addAll(buildDefaultSubscriptionPlans());
    }

    @Transactional(readOnly = true)
    public PlatformDTOs.PlatformDashboardResponse getDashboard() {
        log.debug("Building platform dashboard aggregate");
        List<TenantConfig> schools = tenantConfigRepository.findAll().stream()
                .filter(config -> !Boolean.TRUE.equals(config.getIsDeleted()))
                .toList();

        PlatformDTOs.PlatformDashboardResponse response = new PlatformDTOs.PlatformDashboardResponse();
        response.setTotalSchools(schools.size());
        response.setActiveSchools(schools.stream().filter(config -> Boolean.TRUE.equals(config.getIsActive())).count());
        response.setTotalStudents(studentRepository.countByIsDeletedFalse());
        response.setTotalTeachers(teacherRepository.countByIsDeletedFalse());
        response.setTotalAdmins(userRepository.countByRoleAndIsDeletedFalse(Enums.Role.ADMIN));
        response.setSchoolGrowth(List.of(
                new PlatformDTOs.MetricPoint("Nov", 4),
                new PlatformDTOs.MetricPoint("Dec", 6),
                new PlatformDTOs.MetricPoint("Jan", 7),
                new PlatformDTOs.MetricPoint("Feb", 9),
                new PlatformDTOs.MetricPoint("Mar", 11),
                new PlatformDTOs.MetricPoint("Apr", Math.max(1, schools.size()))
        ));
        response.setRevenueTrend(List.of(
                new PlatformDTOs.MetricPoint("Nov", 18000),
                new PlatformDTOs.MetricPoint("Dec", 22500),
                new PlatformDTOs.MetricPoint("Jan", 26400),
                new PlatformDTOs.MetricPoint("Feb", 30100),
                new PlatformDTOs.MetricPoint("Mar", 34800),
                new PlatformDTOs.MetricPoint("Apr", 39200)
        ));
        response.setRecentActivities(List.of(
                new PlatformDTOs.PlatformActivity("School onboarded", "A new campus workspace completed provisioning", "success", "2 hours ago"),
                new PlatformDTOs.PlatformActivity("Admin access reviewed", "Two inactive campus admins were suspended for policy cleanup", "warning", "Today"),
                new PlatformDTOs.PlatformActivity("Billing sync scheduled", "Monthly subscription reconciliation queued for all active tenants", "info", "Today")
        ));
        response.setTopSchools(schools.stream()
                .map(this::toSchoolSummary)
                .sorted(Comparator.comparingLong(PlatformDTOs.SchoolSummary::getStudentCount).reversed())
                .limit(5)
                .toList());
        log.info("Platform dashboard ready schools={} activeSchools={}", response.getTotalSchools(), response.getActiveSchools());
        return response;
    }

    /**
     * Lightweight runtime snapshot (extend later with Actuator / Redis ping / external probes).
     */
    public PlatformDTOs.PlatformHealthResponse getHealthSnapshot() {
        log.debug("Collecting platform health snapshot");
        PlatformDTOs.PlatformHealthResponse out = new PlatformDTOs.PlatformHealthResponse();
        out.setCheckedAt(Instant.now().toString());
        MemoryMXBean mem = ManagementFactory.getMemoryMXBean();
        long used = mem.getHeapMemoryUsage().getUsed();
        long max = Math.max(mem.getHeapMemoryUsage().getMax(), 1L);
        int pct = (int) Math.min(100, (used * 100) / max);
        PlatformDTOs.JvmMemory jvm = new PlatformDTOs.JvmMemory();
        jvm.setHeapUsedBytes(used);
        jvm.setHeapMaxBytes(max);
        jvm.setHeapUsagePercent(pct);
        out.setJvm(jvm);
        Path root = Path.of(System.getProperty("user.dir", ".")).toAbsolutePath().normalize();
        PlatformDTOs.DiskSpace disk = new PlatformDTOs.DiskSpace();
        disk.setPath(root.toString());
        try {
            FileStore store = Files.getFileStore(root);
            long total = store.getTotalSpace();
            long usable = store.getUsableSpace();
            disk.setTotalBytes(total);
            disk.setUsableBytes(usable);
            if (total > 0) {
                disk.setUsagePercent((int) Math.min(100, ((total - usable) * 100) / total));
            } else {
                disk.setUsagePercent(0);
            }
        } catch (IOException e) {
            log.warn("Disk space probe failed for {}: {}", root, e.getMessage());
            disk.setTotalBytes(0);
            disk.setUsableBytes(0);
            disk.setUsagePercent(0);
        }
        out.setDisk(disk);
        List<PlatformDTOs.ComponentHealth> comps = new ArrayList<>();
        comps.add(new PlatformDTOs.ComponentHealth("API runtime", "UP", "Spring Boot process responding"));
        comps.add(buildDbPoolHealthComponent());
        comps.add(new PlatformDTOs.ComponentHealth("Object storage", "WARN", "Attach S3/MinIO health when media module is enabled"));
        out.setComponents(comps);
        out.setSloSignals(buildSloSignals(out.getJvm().getHeapUsagePercent()));
        out.setAlerts(buildOperationalAlerts(out.getSloSignals()));
        log.info("Health snapshot heapUsagePercent={} diskUsagePercent={}", out.getJvm().getHeapUsagePercent(), out.getDisk().getUsagePercent());
        return out;
    }

    @Transactional(readOnly = true)
    public PlatformDTOs.LifecycleSummaryResponse getLifecycleSummary() {
        PlatformDTOs.LifecycleSummaryResponse response = new PlatformDTOs.LifecycleSummaryResponse();
        // Lifecycle summary powers super-admin operational visibility for hot/warm/cold health.
        Long archivedRecordCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM lifecycle_archive_records", Long.class);
        String latestArchivedAt = jdbcTemplate.queryForObject(
                "SELECT CAST(MAX(archived_at) AS CHAR) FROM lifecycle_archive_records",
                String.class);
        response.setArchivedRecordCount(archivedRecordCount != null ? archivedRecordCount : 0L);
        response.setLatestArchivedAt(latestArchivedAt);
        response.setReportStorageTrackedRows(reportGenerationJobRepository.countByIsDeletedFalseAndFileStoragePathIsNotNull());
        response.setReportStorageMissingFiles(computeMissingReportStorageFileCount());
        return response;
    }

    @Transactional
    public PlatformDTOs.StorageReconciliationResponse reconcileReportStorage(boolean dryRun, boolean deleteOrphans) {
        // Reconcile DB metadata with physical report files to prevent silent storage drift.
        Set<String> referencedFiles = reportGenerationJobRepository.findActiveStoragePaths().stream()
                .filter(path -> path != null && !path.isBlank())
                .map(path -> Path.of(path).toAbsolutePath().normalize().toString())
                .collect(Collectors.toCollection(HashSet::new));
        Set<String> scannedFiles = reportBinaryStorageService.listStoredFiles().stream()
                .map(path -> path.toAbsolutePath().normalize().toString())
                .collect(Collectors.toCollection(HashSet::new));

        List<String> missingSamples = referencedFiles.stream()
                .filter(path -> !scannedFiles.contains(path))
                .limit(storageReconcileMaxSample)
                .toList();
        List<String> orphanSamples = scannedFiles.stream()
                .filter(path -> !referencedFiles.contains(path))
                .limit(storageReconcileMaxSample)
                .toList();
        int deletedOrphans = 0;
        if (!dryRun && deleteOrphans) {
            for (String orphan : orphanSamples) {
                if (reportBinaryStorageService.deleteIfExists(Path.of(orphan))) {
                    deletedOrphans++;
                }
            }
        }

        PlatformDTOs.StorageReconciliationResponse response = new PlatformDTOs.StorageReconciliationResponse();
        response.setDryRun(dryRun);
        response.setScannedFiles(scannedFiles.size());
        response.setReferencedFiles(referencedFiles.size());
        response.setMissingFiles((int) referencedFiles.stream().filter(path -> !scannedFiles.contains(path)).count());
        response.setOrphanFiles((int) scannedFiles.stream().filter(path -> !referencedFiles.contains(path)).count());
        response.setDeletedOrphanFiles(deletedOrphans);
        response.setSampleMissingFiles(missingSamples);
        response.setSampleOrphanFiles(orphanSamples);
        return response;
    }

    @Transactional(readOnly = true)
    public PlatformDTOs.LifecycleObservabilityResponse getLifecycleObservability() {
        PlatformDTOs.LifecycleObservabilityResponse response = new PlatformDTOs.LifecycleObservabilityResponse();
        Long totalArchived = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM lifecycle_archive_records", Long.class);
        String latestArchivedAt = jdbcTemplate.queryForObject(
                "SELECT CAST(MAX(archived_at) AS CHAR) FROM lifecycle_archive_records",
                String.class);
        response.setTotalArchivedRecords(totalArchived != null ? totalArchived : 0L);
        response.setLatestArchivedAt(latestArchivedAt);
        response.setArchiveLagDays(computeArchiveLagDays(latestArchivedAt));
        response.setSourceStats(loadArchiveSourceStats(jdbcTemplate));
        response.setDailyTrend(loadArchiveDailyTrend(jdbcTemplate));
        return response;
    }

    private PlatformDTOs.ComponentHealth buildDbPoolHealthComponent() {
        if (dataSource instanceof HikariDataSource hikariDataSource && hikariDataSource.getHikariPoolMXBean() != null) {
            int active = hikariDataSource.getHikariPoolMXBean().getActiveConnections();
            int idle = hikariDataSource.getHikariPoolMXBean().getIdleConnections();
            int pending = hikariDataSource.getHikariPoolMXBean().getThreadsAwaitingConnection();
            String status = pending >= dbPoolPendingCritical
                    ? "DOWN"
                    : pending >= dbPoolPendingWarn ? "WARN" : "UP";
            return new PlatformDTOs.ComponentHealth(
                    "Database pool",
                    status,
                    "active=" + active + ", idle=" + idle + ", pending=" + pending);
        }
        return new PlatformDTOs.ComponentHealth("Database pool", "WARN", "Hikari pool metrics unavailable");
    }

    private List<PlatformDTOs.SloSignal> buildSloSignals(int heapUsagePercent) {
        List<PlatformDTOs.SloSignal> signals = new ArrayList<>();
        Map<String, Object> metrics = reportPerformanceMetricsService.readMetricsSnapshot();
        double reportReadP95 = resolveMaxP95FromOperations(metrics.get("operations"));
        signals.add(buildSloSignal(
                "report_read_p95_ms",
                "Report read P95 latency",
                "ms",
                reportReadP95,
                reportReadP95WarnMs,
                reportReadP95CriticalMs));

        double snapshotHitRate = resolveSnapshotHitRate(metrics.get("snapshots"));
        signals.add(buildSloSignal(
                "snapshot_hit_rate_pct",
                "Dashboard snapshot hit rate",
                "%",
                snapshotHitRate,
                snapshotHitRateWarnPct,
                snapshotHitRateCriticalPct,
                true));

        long refreshBacklog = dashboardSnapshotRepository.countByRefreshRequiredTrueAndIsDeletedFalse();
        signals.add(buildSloSignal(
                "snapshot_refresh_backlog",
                "Snapshot refresh backlog",
                "count",
                refreshBacklog,
                snapshotBacklogWarn,
                snapshotBacklogCritical));

        signals.add(buildSloSignal(
                "jvm_heap_usage_pct",
                "JVM heap usage",
                "%",
                heapUsagePercent,
                jvmHeapWarnPct,
                jvmHeapCriticalPct));

        signals.add(buildSloSignal(
                "db_pool_pending_connections",
                "DB pool pending threads",
                "count",
                resolveDbPoolPendingConnections(),
                dbPoolPendingWarn,
                dbPoolPendingCritical));
        signals.add(buildSloSignal(
                "report_storage_missing_files",
                "Report storage missing files",
                "count",
                computeMissingReportStorageFileCount(),
                storageMissingWarn,
                storageMissingCritical));
        signals.add(buildSloSignal(
                "archive_lag_days",
                "Archive job lag",
                "days",
                resolveArchiveLagDays(),
                archiveLagWarnDays,
                archiveLagCriticalDays));
        return signals;
    }

    private List<PlatformDTOs.OperationalAlert> buildOperationalAlerts(List<PlatformDTOs.SloSignal> signals) {
        List<PlatformDTOs.OperationalAlert> alerts = new ArrayList<>();
        for (PlatformDTOs.SloSignal signal : signals) {
            if ("OK".equalsIgnoreCase(signal.getStatus())) {
                continue;
            }
            PlatformDTOs.OperationalAlert alert = new PlatformDTOs.OperationalAlert();
            alert.setSeverity("CRITICAL".equalsIgnoreCase(signal.getStatus()) ? "critical" : "warning");
            alert.setCode(signal.getKey());
            alert.setTitle(signal.getLabel() + " is " + signal.getStatus());
            alert.setDetail(String.format(
                    Locale.ROOT,
                    "Current %.2f%s, warn %.2f, critical %.2f",
                    signal.getValue(),
                    signal.getUnit() != null ? signal.getUnit() : "",
                    signal.getWarnThreshold(),
                    signal.getCriticalThreshold()));
            alert.setSuggestedAction(suggestActionForSignal(signal.getKey()));
            alerts.add(alert);
        }
        return alerts;
    }

    private String suggestActionForSignal(String key) {
        return switch (key) {
            case "report_read_p95_ms" -> "Inspect slow-query logs and run EXPLAIN ANALYZE for top report endpoints.";
            case "snapshot_hit_rate_pct" -> "Review cache TTLs and snapshot invalidation events; run snapshot warmup.";
            case "snapshot_refresh_backlog" -> "Increase refresh job batch size and verify job scheduler health.";
            case "jvm_heap_usage_pct" -> "Check memory pressure and GC behavior, then review heap settings.";
            case "db_pool_pending_connections" -> "Review connection pool size, long-running transactions, and DB saturation.";
            case "report_storage_missing_files" -> "Run report storage reconciliation and restore/delete inconsistent file entries.";
            case "archive_lag_days" -> "Check lifecycle archive scheduler and retention job logs, then run archive tick manually.";
            default -> "Investigate platform metrics and recent deployments.";
        };
    }

    private double resolveArchiveLagDays() {
        String latestArchivedAt = jdbcTemplate.queryForObject(
                "SELECT CAST(MAX(archived_at) AS CHAR) FROM lifecycle_archive_records",
                String.class);
        return computeArchiveLagDays(latestArchivedAt);
    }

    private long computeArchiveLagDays(String latestArchivedAt) {
        if (latestArchivedAt == null || latestArchivedAt.isBlank()) {
            return 999;
        }
        try {
            LocalDateTime archiveTime = LocalDateTime.parse(latestArchivedAt.replace(" ", "T"));
            return Math.max(0, ChronoUnit.DAYS.between(archiveTime, LocalDateTime.now()));
        } catch (Exception ignored) {
            return 999;
        }
    }

    private List<PlatformDTOs.LifecycleArchiveSourceStat> loadArchiveSourceStats(
            org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        return jdbcTemplate.query(
                """
                SELECT source_table, COUNT(*) AS cnt, CAST(MAX(archived_at) AS CHAR) AS latest_archived_at
                FROM lifecycle_archive_records
                GROUP BY source_table
                ORDER BY cnt DESC
                """,
                (rs, rowNum) -> {
                    PlatformDTOs.LifecycleArchiveSourceStat row = new PlatformDTOs.LifecycleArchiveSourceStat();
                    row.setSourceTable(rs.getString("source_table"));
                    row.setRecordCount(rs.getLong("cnt"));
                    row.setLatestArchivedAt(rs.getString("latest_archived_at"));
                    return row;
                });
    }

    private List<PlatformDTOs.LifecycleDailyArchivePoint> loadArchiveDailyTrend(
            org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        return jdbcTemplate.query(
                """
                SELECT DATE(archived_at) AS archive_day, COUNT(*) AS cnt
                FROM lifecycle_archive_records
                WHERE archived_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE(archived_at)
                ORDER BY archive_day ASC
                """,
                (rs, rowNum) -> {
                    PlatformDTOs.LifecycleDailyArchivePoint point = new PlatformDTOs.LifecycleDailyArchivePoint();
                    point.setDay(String.valueOf(rs.getDate("archive_day")));
                    point.setArchivedCount(rs.getLong("cnt"));
                    return point;
                });
    }

    private long computeMissingReportStorageFileCount() {
        long missing = 0;
        for (String path : reportGenerationJobRepository.findActiveStoragePaths()) {
            if (path == null || path.isBlank()) {
                continue;
            }
            if (!Files.exists(Path.of(path).toAbsolutePath().normalize())) {
                missing++;
            }
        }
        return missing;
    }

    private PlatformDTOs.SloSignal buildSloSignal(
            String key,
            String label,
            String unit,
            double value,
            double warnThreshold,
            double criticalThreshold) {
        return buildSloSignal(key, label, unit, value, warnThreshold, criticalThreshold, false);
    }

    private PlatformDTOs.SloSignal buildSloSignal(
            String key,
            String label,
            String unit,
            double value,
            double warnThreshold,
            double criticalThreshold,
            boolean lowerIsWorse) {
        PlatformDTOs.SloSignal signal = new PlatformDTOs.SloSignal();
        signal.setKey(key);
        signal.setLabel(label);
        signal.setUnit(unit);
        signal.setValue(Math.round(value * 100.0) / 100.0);
        signal.setWarnThreshold(warnThreshold);
        signal.setCriticalThreshold(criticalThreshold);
        if (lowerIsWorse) {
            signal.setStatus(value <= criticalThreshold ? "CRITICAL" : value <= warnThreshold ? "WARN" : "OK");
        } else {
            signal.setStatus(value >= criticalThreshold ? "CRITICAL" : value >= warnThreshold ? "WARN" : "OK");
        }
        return signal;
    }

    private double resolveDbPoolPendingConnections() {
        if (dataSource instanceof HikariDataSource hikariDataSource && hikariDataSource.getHikariPoolMXBean() != null) {
            return hikariDataSource.getHikariPoolMXBean().getThreadsAwaitingConnection();
        }
        return 0;
    }

    private double resolveMaxP95FromOperations(Object operationsObj) {
        if (!(operationsObj instanceof Map<?, ?> opMap)) {
            return 0;
        }
        double maxP95 = 0;
        for (Object value : opMap.values()) {
            if (value instanceof Map<?, ?> payload) {
                Object p95 = payload.get("p95Ms");
                if (p95 instanceof Number number) {
                    maxP95 = Math.max(maxP95, number.doubleValue());
                }
            }
        }
        return maxP95;
    }

    private double resolveSnapshotHitRate(Object snapshotsObj) {
        if (!(snapshotsObj instanceof Map<?, ?> snapshotMap) || snapshotMap.isEmpty()) {
            return 100.0;
        }
        long hit = 0;
        long miss = 0;
        for (Object value : snapshotMap.values()) {
            if (!(value instanceof Map<?, ?> payload)) {
                continue;
            }
            Object h = payload.get("hit");
            Object m = payload.get("miss");
            if (h instanceof Number hitN) {
                hit += hitN.longValue();
            }
            if (m instanceof Number missN) {
                miss += missN.longValue();
            }
        }
        long total = hit + miss;
        if (total == 0) {
            return 100.0;
        }
        return (100.0 * hit) / total;
    }

    @Transactional(readOnly = true)
    public List<PlatformDTOs.SchoolSummary> getSchools() {
        log.debug("Listing all school workspaces");
        List<PlatformDTOs.SchoolSummary> list = tenantConfigRepository.findAll().stream()
                .filter(config -> !Boolean.TRUE.equals(config.getIsDeleted()))
                .map(this::toSchoolSummary)
                .sorted(Comparator.comparing(PlatformDTOs.SchoolSummary::getSchoolName, String.CASE_INSENSITIVE_ORDER))
                .toList();
        log.info("Listed {} school workspace(s)", list.size());
        return list;
    }

    @Transactional(readOnly = true)
    public PageResponse<PlatformDTOs.SchoolSummary> getSchoolsPaged(int page, int size, String q) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("schoolName"));
        String qq = (q != null && !q.isBlank()) ? q.trim() : "";
        Page<TenantConfig> pg = tenantConfigRepository.pageActiveSchools(qq, pageable);
        return PageResponse.fromSpringPage(pg.map(this::toSchoolSummary));
    }

    @Transactional(readOnly = true)
    public PlatformDTOs.SchoolDetailResponse getSchoolDetail(String tenantId) {
        log.debug("Loading school detail tenantId={}", tenantId);
        TenantConfig tc = tenantConfigRepository.findByTenantId(tenantId)
                .filter(config -> !Boolean.TRUE.equals(config.getIsDeleted()))
                .orElse(null);
        if (tc == null) {
            List<PlatformTenantPurgeJob> jobs = purgeJobRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
            if (!jobs.isEmpty()) {
                log.info("School detail fallback for purged tenantId={} latestJobStatus={}", tenantId, jobs.get(0).getStatus());
                return buildPurgedSchoolDetail(tenantId, jobs.get(0));
            }
            throw new ResourceNotFoundException("School workspace not found for tenant: " + tenantId);
        }
        PlatformDTOs.SchoolDetailResponse out = new PlatformDTOs.SchoolDetailResponse();
        out.setSchool(toSchoolSummary(tc));
        out.setAdmins(getSchoolAdmins(tenantId));
        out.setParentUserCount(userRepository.countByTenantIdAndRoleAndIsDeletedFalse(tenantId, Enums.Role.PARENT));
        log.info("School detail tenantId={} admins={} parentUsers={}", tenantId, out.getAdmins().size(), out.getParentUserCount());
        return out;
    }

    private PlatformDTOs.SchoolDetailResponse buildPurgedSchoolDetail(String tenantId, PlatformTenantPurgeJob latestJob) {
        PlatformDTOs.SchoolSummary school = new PlatformDTOs.SchoolSummary();
        school.setTenantId(tenantId);
        school.setSchoolName("Deleted workspace");
        school.setSchoolCode(
                latestJob.getSchoolCode() != null && !latestJob.getSchoolCode().isBlank()
                        ? latestJob.getSchoolCode()
                        : tenantId
        );
        school.setActive(false);
        school.setStudentCount(0);
        school.setTeacherCount(0);
        school.setAdminCount(0);
        school.setEmail(null);
        school.setPhone(null);
        school.setAddress(null);
        school.setPrimaryColor("#6B7280");
        school.setSecondaryColor("#9CA3AF");

        PlatformDTOs.SchoolDetailResponse out = new PlatformDTOs.SchoolDetailResponse();
        out.setSchool(school);
        out.setAdmins(List.of());
        out.setParentUserCount(0);
        out.setSubscriptionPlanCode("N/A");
        out.setSubscriptionStatus("PURGED");
        return out;
    }

    @Transactional
    public void suspendSchoolWorkspace(String tenantId) {
        log.warn("Suspending school workspace tenantId={}", tenantId);
        TenantConfig tc = requireTenant(tenantId);
        tc.setIsActive(false);
        tenantConfigRepository.save(tc);
        userRepository.deactivateAllByTenantId(tenantId);
        log.info("School workspace suspended tenantId={}", tenantId);
    }

    @Transactional
    public void activateSchoolWorkspace(String tenantId) {
        log.info("Activating school workspace tenantId={}", tenantId);
        TenantConfig tc = requireTenant(tenantId);
        tc.setIsActive(true);
        tenantConfigRepository.save(tc);
        log.info("School workspace activated tenantId={}", tenantId);
    }

    @Transactional
    public PlatformDTOs.PurgeJobSummary requestTenantDataPurge(String tenantId, PlatformDTOs.PurgeSchoolDataRequest request) {
        log.warn("Tenant data purge requested tenantId={}", tenantId);
        TenantConfig tc = requireTenant(tenantId);
        if (Boolean.TRUE.equals(tc.getIsActive())) {
            log.warn("Purge rejected: workspace still active tenantId={}", tenantId);
            throw new BusinessException("Suspend the school workspace before requesting a data purge.");
        }
        String confirm = request.getConfirmSchoolCode() != null
                ? request.getConfirmSchoolCode().trim().toUpperCase(Locale.ROOT)
                : "";
        if (!tc.getSchoolCode().equalsIgnoreCase(confirm)) {
            log.warn("Purge rejected: school code mismatch tenantId={}", tenantId);
            throw new BusinessException("School code confirmation does not match this workspace.");
        }
        PlatformTenantPurgeJob job = new PlatformTenantPurgeJob();
        job.setTenantId(tenantId);
        job.setSchoolCode(tc.getSchoolCode());
        job.setSchoolName(tc.getSchoolName());
        User schoolRequester = resolveSchoolPurgeRequester(tenantId);
        job.setRequestedByUserId(schoolRequester != null ? schoolRequester.getId() : null);
        job.setRequestedByRole(schoolRequester != null && schoolRequester.getRole() != null ? schoolRequester.getRole().name() : null);
        job.setRequestedByPrincipal(schoolRequester != null ? firstNonBlank(schoolRequester.getEmail(), schoolRequester.getPhone()) : null);
        job.setRequestedByDisplayName(schoolRequester != null ? schoolRequester.getName() : null);
        job.setExecutedByUserId(TenantContext.getUserId());
        job.setExecutedByRole(TenantContext.getUserRole());
        job.setExecutedByPrincipal(TenantContext.getUserPrincipal());
        job.setExecutedByDisplayName(TenantContext.getUserDisplayName());
        job.setAffectedStudents(studentRepository.countByTenantIdAndIsDeletedFalse(tenantId));
        job.setAffectedTeachers(teacherRepository.countByTenantIdAndIsDeletedFalse(tenantId));
        job.setAffectedAdmins(userRepository.countByTenantIdAndRoleAndIsDeletedFalse(tenantId, Enums.Role.ADMIN));
        job.setAffectedParentAccounts(userRepository.countByTenantIdAndRoleAndIsDeletedFalse(tenantId, Enums.Role.PARENT));
        job.setStatus("QUEUED");
        job = purgeJobRepository.save(job);
        Long jobId = job.getId();
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    tenantPurgeJobProcessor.processJobAsync(jobId);
                }
            });
        } else {
            tenantPurgeJobProcessor.processJobAsync(jobId);
        }
        log.info("Purge job queued jobId={} tenantId={}", job.getId(), tenantId);
        return toPurgeJobSummary(job);
    }

    @Transactional(readOnly = true)
    public List<PlatformDTOs.PurgeJobSummary> listPurgeJobsForTenant(String tenantId) {
        // Do not require tenant_configs row — after a completed purge the workspace row is gone but job history remains.
        List<PlatformDTOs.PurgeJobSummary> jobs = purgeJobRepository.findByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                .map(this::toPurgeJobSummary)
                .toList();
        log.info("Listed {} purge job(s) tenantId={}", jobs.size(), tenantId);
        return jobs;
    }

    @Transactional(readOnly = true)
    public PageResponse<PlatformDTOs.PurgeJobSummary> listPurgeJobsGlobal(int page, int size, String q, String status) {
        int safePage = Math.max(0, page);
        int safeSize = Math.min(100, Math.max(1, size));
        String normalizedQuery = q != null && !q.isBlank() ? q.trim() : null;
        String normalizedStatus = status != null && !status.isBlank() ? status.trim().toUpperCase(Locale.ROOT) : null;
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<PlatformTenantPurgeJob> rows = purgeJobRepository.findAllForGlobalPurgeHistory(normalizedStatus, normalizedQuery, pageable);
        return PageResponse.fromSpringPage(rows.map(this::toPurgeJobSummary));
    }

    @Transactional(readOnly = true)
    public byte[] exportTenantPurgeJobCsv(String tenantId, Long jobId) {
        PlatformTenantPurgeJob job = purgeJobRepository.findById(jobId)
                .filter(j -> tenantId.equals(j.getTenantId()))
                .orElseThrow(() -> new ResourceNotFoundException("Purge job not found for tenant: " + tenantId));
        StringBuilder csv = new StringBuilder();
        SchoolExportBranding branding = new SchoolExportBranding(
                job.getSchoolName() != null ? job.getSchoolName() : "",
                job.getSchoolCode() != null ? job.getSchoolCode() : "");
        CsvExportSupport.appendDocumentPreamble(csv, branding, "Tenant data purge audit", Instant.now());
        csv.append("job_id,tenant_id,school_code,status,error_message,rows_deleted_estimate,execution_duration_ms,")
                .append("school_name,")
                .append("requested_by_user_id,requested_by_role,requested_by_principal,requested_by_display_name,")
                .append("executed_by_user_id,executed_by_role,executed_by_principal,executed_by_display_name,")
                .append("affected_students,affected_teachers,affected_admins,affected_parent_accounts,")
                .append("created_at,started_at,completed_at\n");
        csv.append(csvCell(job.getId())).append(',')
                .append(csvCell(job.getTenantId())).append(',')
                .append(csvCell(job.getSchoolCode())).append(',')
                .append(csvCell(job.getStatus())).append(',')
                .append(csvCell(job.getErrorMessage())).append(',')
                .append(csvCell(job.getRowsDeletedEstimate())).append(',')
                .append(csvCell(job.getExecutionDurationMs())).append(',')
                .append(csvCell(job.getSchoolName())).append(',')
                .append(csvCell(job.getRequestedByUserId())).append(',')
                .append(csvCell(job.getRequestedByRole())).append(',')
                .append(csvCell(job.getRequestedByPrincipal())).append(',')
                .append(csvCell(job.getRequestedByDisplayName())).append(',')
                .append(csvCell(job.getExecutedByUserId())).append(',')
                .append(csvCell(job.getExecutedByRole())).append(',')
                .append(csvCell(job.getExecutedByPrincipal())).append(',')
                .append(csvCell(job.getExecutedByDisplayName())).append(',')
                .append(csvCell(job.getAffectedStudents())).append(',')
                .append(csvCell(job.getAffectedTeachers())).append(',')
                .append(csvCell(job.getAffectedAdmins())).append(',')
                .append(csvCell(job.getAffectedParentAccounts())).append(',')
                .append(csvCell(job.getCreatedAt())).append(',')
                .append(csvCell(job.getStartedAt())).append(',')
                .append(csvCell(job.getCompletedAt()))
                .append('\n');
        return CsvExportSupport.utf8BomBytes(csv.toString());
    }

    private static String csvCell(Object value) {
        if (value == null) {
            return "";
        }
        String text = String.valueOf(value);
        String escaped = text.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }

    @Transactional(readOnly = true)
    public List<PlatformDTOs.SubscriptionPlanRow> listSubscriptionPlans() {
        initSubscriptionPlanCatalog();
        List<PlatformDTOs.SubscriptionPlanRow> rows = subscriptionPlanCatalog.stream()
                .map(PlatformService::cloneSubscriptionPlan)
                .collect(Collectors.toList());
        log.debug("Returning {} subscription plan row(s)", rows.size());
        return rows;
    }

    /**
     * Super-admin catalog edit (in-memory until external billing owns plans).
     */
    public synchronized PlatformDTOs.SubscriptionPlanRow replaceSubscriptionPlan(String code, PlatformDTOs.SubscriptionPlanRow body) {
        initSubscriptionPlanCatalog();
        if (body == null) {
            throw new BusinessException("Plan body is required");
        }
        String want = code != null ? code.trim().toUpperCase(Locale.ROOT) : "";
        for (int i = 0; i < subscriptionPlanCatalog.size(); i++) {
            PlatformDTOs.SubscriptionPlanRow row = subscriptionPlanCatalog.get(i);
            if (row.getCode() != null && row.getCode().equalsIgnoreCase(want)) {
                body.setCode(row.getCode());
                normalizePlanLists(body);
                subscriptionPlanCatalog.set(i, cloneSubscriptionPlan(body));
                log.info("Subscription plan updated code={}", row.getCode());
                return cloneSubscriptionPlan(body);
            }
        }
        throw new ResourceNotFoundException("Subscription plan not found: " + want);
    }

    private List<PlatformDTOs.SubscriptionPlanRow> buildDefaultSubscriptionPlans() {
        List<PlatformDTOs.SubscriptionPlanRow> rows = new ArrayList<>();
        rows.add(plan("STARTER", "Starter", "Ideal for a single campus validating digital attendance, fees, and parent engagement.", 4900, "USD",
                List.of("Guided onboarding checklist", "Standard uptime targets", "Community knowledge base"),
                "Up to 300 active students", "Email & chat (business hours)",
                List.of("Students & classes", "Attendance", "Timetable (read)", "Fees (core)", "Parent portal (read)", "Announcements", "Basic reports"),
                false,
                "Best for pilot schools and single-branch validation. Upgrade path to Standard without data migration.",
                "price_starter_monthly"));
        rows.add(plan("STANDARD", "Standard", "The default production tier for schools running academics, finance, and operations in one place.", 12900, "USD",
                List.of("Quarterly success review", "Data export APIs", "Optional SSO add-on"),
                "Up to 2,000 active students", "Priority support (12×5)",
                List.of("Everything in Starter", "Exams & gradebook", "Library", "Transport & routes", "Hostel", "Payroll (standard)", "Documents", "Audit trail (90 days)", "Chat"),
                true,
                "Default SKU for new workspace provisioning. Maps to monthly recurring per active tenant in billing integrations.",
                "price_standard_monthly"));
        rows.add(plan("ENTERPRISE", "Enterprise", "Regional groups, compliance-heavy boards, and multi-branch governance with custom limits.", 0, "USD",
                List.of("Custom MSA & DPA", "Dedicated technical account lead", "Optional on-prem / VPC"),
                "Custom (unlimited branches)", "Named CSM + 24×7 hotline",
                List.of("Everything in Standard", "Multi-branch roll-up", "Advanced audit (retention policies)", "Custom integrations", "Sandbox tenant", "DR runbooks"),
                false,
                "Contract-led pricing; workspace caps and module flags negotiated per MSA. Integration keys assigned manually.",
                null));
        return rows;
    }

    private static PlatformDTOs.SubscriptionPlanRow cloneSubscriptionPlan(PlatformDTOs.SubscriptionPlanRow s) {
        PlatformDTOs.SubscriptionPlanRow r = new PlatformDTOs.SubscriptionPlanRow();
        r.setCode(s.getCode());
        r.setName(s.getName());
        r.setDescription(s.getDescription());
        r.setMonthlyPriceMinorUnits(s.getMonthlyPriceMinorUnits());
        r.setCurrency(s.getCurrency());
        r.setHighlights(s.getHighlights() != null ? new ArrayList<>(s.getHighlights()) : new ArrayList<>());
        r.setMaxStudentsLabel(s.getMaxStudentsLabel());
        r.setSupportTier(s.getSupportTier());
        r.setBillingCadence(s.getBillingCadence());
        r.setModules(s.getModules() != null ? new ArrayList<>(s.getModules()) : new ArrayList<>());
        r.setRecommended(s.isRecommended());
        r.setCommercialNotes(s.getCommercialNotes());
        r.setIntegrationPriceKey(s.getIntegrationPriceKey());
        return r;
    }

    private static void normalizePlanLists(PlatformDTOs.SubscriptionPlanRow body) {
        if (body.getHighlights() == null) {
            body.setHighlights(new ArrayList<>());
        }
        if (body.getModules() == null) {
            body.setModules(new ArrayList<>());
        }
        if (body.getBillingCadence() == null || body.getBillingCadence().isBlank()) {
            body.setBillingCadence("Billed monthly per active workspace");
        }
    }

    private static PlatformDTOs.SubscriptionPlanRow plan(
            String code,
            String name,
            String desc,
            int minor,
            String cur,
            List<String> highlights,
            String maxStudentsLabel,
            String supportTier,
            List<String> modules,
            boolean recommended,
            String commercialNotes,
            String integrationPriceKey
    ) {
        PlatformDTOs.SubscriptionPlanRow r = new PlatformDTOs.SubscriptionPlanRow();
        r.setCode(code);
        r.setName(name);
        r.setDescription(desc);
        r.setMonthlyPriceMinorUnits(minor);
        r.setCurrency(cur);
        r.setHighlights(new ArrayList<>(highlights));
        r.setMaxStudentsLabel(maxStudentsLabel);
        r.setSupportTier(supportTier);
        r.setBillingCadence("Billed monthly per active workspace");
        r.setModules(new ArrayList<>(modules));
        r.setRecommended(recommended);
        r.setCommercialNotes(commercialNotes);
        r.setIntegrationPriceKey(integrationPriceKey);
        return r;
    }

    @Transactional
    public PlatformDTOs.PlatformBroadcastResult broadcastToSchoolAdmins(PlatformDTOs.PlatformBroadcastRequest request) {
        log.info("Platform broadcast starting title={} targetTenantId={}", request.getTitle(), request.getTargetTenantId());
        Enums.NotificationType type = parseNotificationType(request.getNotificationType());
        List<TenantConfig> targets;
        if (request.getTargetTenantId() != null && !request.getTargetTenantId().isBlank()) {
            targets = List.of(requireTenant(request.getTargetTenantId().trim()));
        } else {
            targets = tenantConfigRepository.findAll().stream()
                    .filter(c -> !Boolean.TRUE.equals(c.getIsDeleted()))
                    .toList();
        }
        int rows = 0;
        for (TenantConfig tc : targets) {
            List<User> admins = userRepository.findByTenantIdAndRoleAndIsDeletedFalse(tc.getTenantId(), Enums.Role.ADMIN);
            List<Notification> batch = new ArrayList<>();
            for (User admin : admins) {
                Notification n = new Notification();
                n.setTenantId(tc.getTenantId());
                n.setTitle(request.getTitle().trim());
                n.setMessage(request.getMessage().trim());
                n.setType(type);
                n.setIsRead(false);
                n.setUserId(admin.getId());
                n.setLink("/app/dashboard");
                n.setIsActive(true);
                n.setIsDeleted(false);
                batch.add(n);
            }
            if (!batch.isEmpty()) {
                notificationRepository.saveAll(batch);
                rows += batch.size();
            }
        }
        log.info("Platform broadcast done notificationsCreated={} workspacesTouched={}", rows, targets.size());
        outboundNotificationFanout.publishAfterBroadcast(
                "PLATFORM_BROADCAST",
                targets.stream().map(TenantConfig::getTenantId).toList(),
                request.getTitle(),
                request.getMessage(),
                rows
        );
        return new PlatformDTOs.PlatformBroadcastResult(rows, targets.size());
    }

    @Transactional
    public PlatformDTOs.OnboardSchoolResponse onboardSchoolWorkspace(PlatformDTOs.OnboardSchoolRequest request) {
        AuthManagementDTOs.OnboardTenantRequest req = new AuthManagementDTOs.OnboardTenantRequest();
        req.setSchoolName(request.getSchoolName());
        req.setSchoolCode(request.getSchoolCode());
        req.setAdminName(request.getAdminName());
        req.setAdminEmail(request.getAdminEmail());
        req.setAdminPassword(request.getAdminPassword());
        req.setPhone(request.getPhone());
        req.setAddress(request.getAddress());
        req.setInterfaceLocale(request.getInterfaceLocale());
        req.setAcademicYearName(request.getAcademicYearName());
        req.setAcademicYearStartDate(request.getAcademicYearStartDate());
        req.setAcademicYearEndDate(request.getAcademicYearEndDate());

        var onboarding = authService.onboardTenantWithoutLogin(req);
        var admin = onboarding.user();
        PlatformDTOs.OnboardSchoolResponse out = new PlatformDTOs.OnboardSchoolResponse();
        out.setTenantId(admin.getTenantId());
        out.setSchoolCode(request.getSchoolCode() != null ? request.getSchoolCode().trim().toUpperCase(Locale.ROOT) : null);
        out.setAdminUserId(admin.getId());
        out.setAdminEmail(admin.getEmail());
        out.setAdminPhone(admin.getPhone());
        out.setAcademicYearId(onboarding.academicYearId());
        return out;
    }

    private static Enums.NotificationType parseNotificationType(String raw) {
        if (raw == null || raw.isBlank()) {
            return Enums.NotificationType.INFO;
        }
        try {
            return Enums.NotificationType.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return Enums.NotificationType.INFO;
        }
    }

    private PlatformDTOs.PurgeJobSummary toPurgeJobSummary(PlatformTenantPurgeJob job) {
        PlatformDTOs.PurgeJobSummary s = new PlatformDTOs.PurgeJobSummary();
        s.setId(job.getId());
        s.setTenantId(job.getTenantId());
        s.setSchoolCode(job.getSchoolCode());
        s.setSchoolName(job.getSchoolName());
        s.setStatus(job.getStatus());
        s.setErrorMessage(job.getErrorMessage());
        s.setRowsDeletedEstimate(job.getRowsDeletedEstimate());
        s.setExecutionDurationMs(job.getExecutionDurationMs());
        s.setRequestedByUserId(job.getRequestedByUserId());
        s.setRequestedByRole(job.getRequestedByRole());
        s.setRequestedByPrincipal(job.getRequestedByPrincipal());
        s.setRequestedByDisplayName(job.getRequestedByDisplayName());
        s.setExecutedByUserId(job.getExecutedByUserId());
        s.setExecutedByRole(job.getExecutedByRole());
        s.setExecutedByPrincipal(job.getExecutedByPrincipal());
        s.setExecutedByDisplayName(job.getExecutedByDisplayName());
        s.setAffectedStudents(job.getAffectedStudents());
        s.setAffectedTeachers(job.getAffectedTeachers());
        s.setAffectedAdmins(job.getAffectedAdmins());
        s.setAffectedParentAccounts(job.getAffectedParentAccounts());
        s.setCreatedAt(job.getCreatedAt() != null ? job.getCreatedAt().toString() : null);
        s.setStartedAt(job.getStartedAt() != null ? job.getStartedAt().toString() : null);
        s.setCompletedAt(job.getCompletedAt() != null ? job.getCompletedAt().toString() : null);
        return s;
    }

    /**
     * Resolves school-side requester snapshot for legal/audit export.
     * We use the earliest active campus admin as the principal requester proxy.
     */
    private User resolveSchoolPurgeRequester(String tenantId) {
        List<User> campusAdmins = userRepository.findByTenantIdAndRoleAndIsDeletedFalse(tenantId, Enums.Role.ADMIN);
        if (campusAdmins == null || campusAdmins.isEmpty()) {
            return null;
        }
        return campusAdmins.stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .min(Comparator.comparing(User::getId))
                .orElse(campusAdmins.stream().min(Comparator.comparing(User::getId)).orElse(null));
    }

    private static String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        if (second != null && !second.isBlank()) {
            return second;
        }
        return null;
    }

    private TenantConfig requireTenant(String tenantId) {
        return tenantConfigRepository.findByTenantId(tenantId)
                .filter(config -> !Boolean.TRUE.equals(config.getIsDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException("School workspace not found for tenant: " + tenantId));
    }

    /**
     * Search active campus administrators across workspaces for super-admin → admin messaging.
     */
    @Transactional(readOnly = true)
    public List<PlatformDTOs.SchoolAdminChatHit> searchSchoolAdminsForChat(String qRaw) {
        String q = qRaw == null ? "" : qRaw.trim().toLowerCase(Locale.ROOT);
        if (q.length() < 2) {
            return List.of();
        }
        List<PlatformDTOs.SchoolAdminChatHit> out = new ArrayList<>();
        for (TenantConfig tc : tenantConfigRepository.findAll().stream()
                .filter(config -> !Boolean.TRUE.equals(config.getIsDeleted()))
                .toList()) {
            String schoolName = tc.getSchoolName() != null ? tc.getSchoolName() : "";
            String schoolCode = tc.getSchoolCode() != null ? tc.getSchoolCode() : "";
            String tid = tc.getTenantId();
            for (User u : userRepository.findByTenantIdAndRoleAndIsDeletedFalse(tid, Enums.Role.ADMIN)) {
                if (!Boolean.TRUE.equals(u.getIsActive())) {
                    continue;
                }
                String hay = (u.getName() + " " + u.getEmail() + " " + schoolName + " " + schoolCode + " " + tid)
                        .toLowerCase(Locale.ROOT);
                if (!hay.contains(q)) {
                    continue;
                }
                PlatformDTOs.SchoolAdminChatHit hit = new PlatformDTOs.SchoolAdminChatHit();
                hit.setUserId(u.getId());
                hit.setName(u.getName());
                hit.setEmail(u.getEmail());
                hit.setPhone(u.getPhone());
                hit.setSchoolName(schoolName);
                hit.setSchoolCode(schoolCode);
                hit.setTenantId(tid);
                out.add(hit);
            }
        }
        out.sort(Comparator.comparing(PlatformDTOs.SchoolAdminChatHit::getSchoolName, String.CASE_INSENSITIVE_ORDER)
                .thenComparing(PlatformDTOs.SchoolAdminChatHit::getName, String.CASE_INSENSITIVE_ORDER));
        log.info("Platform chat directory search qLen={} hits={}", q.length(), out.size());
        return out;
    }

    @Transactional(readOnly = true)
    public List<PlatformDTOs.SchoolAdminSummary> getSchoolAdmins(String tenantId) {
        List<PlatformDTOs.SchoolAdminSummary> admins = userRepository.findByTenantIdAndRoleAndIsDeletedFalse(tenantId, Enums.Role.ADMIN).stream()
                .map(this::toAdminSummary)
                .toList();
        log.info("Listed {} admin(s) for tenantId={}", admins.size(), tenantId);
        return admins;
    }

    @Transactional
    public PlatformDTOs.SchoolAdminSummary updateSchoolAdminStatus(String tenantId, Long userId, PlatformDTOs.ToggleAdminStatusRequest request) {
        log.info("Updating admin status tenantId={} userId={} active={}", tenantId, userId, request.isActive());
        User admin = userRepository.findById(userId)
                .filter(user -> tenantId.equals(user.getTenantId()) && user.getRole() == Enums.Role.ADMIN && !Boolean.TRUE.equals(user.getIsDeleted()))
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        admin.setIsActive(request.isActive());
        userRepository.save(admin);
        log.info("Admin status updated userId={} active={}", userId, request.isActive());
        return toAdminSummary(admin);
    }

    private PlatformDTOs.SchoolSummary toSchoolSummary(TenantConfig config) {
        PlatformDTOs.SchoolSummary summary = new PlatformDTOs.SchoolSummary();
        summary.setTenantId(config.getTenantId());
        summary.setSchoolName(config.getSchoolName());
        summary.setSchoolCode(config.getSchoolCode());
        summary.setEmail(config.getEmail());
        summary.setPhone(config.getPhone());
        summary.setAddress(config.getAddress());
        summary.setActive(Boolean.TRUE.equals(config.getIsActive()));
        summary.setStudentCount(studentRepository.countByTenantIdAndIsDeletedFalse(config.getTenantId()));
        summary.setTeacherCount(teacherRepository.countByTenantIdAndIsDeletedFalse(config.getTenantId()));
        summary.setAdminCount(userRepository.countByTenantIdAndRoleAndIsDeletedFalse(config.getTenantId(), Enums.Role.ADMIN));
        summary.setPrimaryColor(config.getPrimaryColor());
        summary.setSecondaryColor(config.getSecondaryColor());
        return summary;
    }

    private PlatformDTOs.SchoolAdminSummary toAdminSummary(User user) {
        PlatformDTOs.SchoolAdminSummary summary = new PlatformDTOs.SchoolAdminSummary();
        summary.setId(user.getId());
        summary.setName(user.getName());
        summary.setEmail(user.getEmail());
        summary.setPhone(user.getPhone());
        summary.setSchoolCode(user.getSchoolCode());
        summary.setActive(Boolean.TRUE.equals(user.getIsActive()));
        summary.setCreatedAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : "");
        return summary;
    }

    public PlatformService(
            TenantConfigRepository tenantConfigRepository,
            UserRepository userRepository,
            StudentRepository studentRepository,
            TeacherRepository teacherRepository,
            PlatformTenantPurgeJobRepository purgeJobRepository,
            TenantPurgeJobProcessor tenantPurgeJobProcessor,
            NotificationRepository notificationRepository,
            OutboundNotificationFanout outboundNotificationFanout,
            AuthService authService,
            DashboardSnapshotRepository dashboardSnapshotRepository,
            ReportGenerationJobRepository reportGenerationJobRepository,
            ReportBinaryStorageService reportBinaryStorageService,
            ReportPerformanceMetricsService reportPerformanceMetricsService,
            DataSource dataSource
    ) {
        this.tenantConfigRepository = tenantConfigRepository;
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
        this.purgeJobRepository = purgeJobRepository;
        this.tenantPurgeJobProcessor = tenantPurgeJobProcessor;
        this.notificationRepository = notificationRepository;
        this.outboundNotificationFanout = outboundNotificationFanout;
        this.authService = authService;
        this.dashboardSnapshotRepository = dashboardSnapshotRepository;
        this.reportGenerationJobRepository = reportGenerationJobRepository;
        this.reportBinaryStorageService = reportBinaryStorageService;
        this.reportPerformanceMetricsService = reportPerformanceMetricsService;
        this.dataSource = dataSource;
        this.jdbcTemplate = new JdbcTemplate(dataSource);
    }
}
