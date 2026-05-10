package com.school.erp.modules.reports.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.modules.reports.dto.AdminAttendanceOverviewScope;
import com.school.erp.modules.reports.dto.ParentDashboardDtos;
import com.school.erp.modules.reports.dto.ReportDashboardDTOs;
import com.school.erp.modules.reports.entity.DashboardSnapshot;
import com.school.erp.modules.reports.repository.DashboardSnapshotRepository;
import com.school.erp.tenant.TenantContext;
import com.school.erp.tenant.TenantScopedExecution;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

@Service
public class DashboardSnapshotService {
    private static final Logger log = LoggerFactory.getLogger(DashboardSnapshotService.class);
    private static final String TYPE_KPI = "DASHBOARD_KPI";
    private static final String TYPE_ADMIN = "DASHBOARD_ADMIN";
    private static final String TYPE_TEACHER = "DASHBOARD_TEACHER";
    private static final String TYPE_PARENT = "DASHBOARD_PARENT";

    private final DashboardSnapshotRepository dashboardSnapshotRepository;
    private final ObjectMapper objectMapper;
    private final ReportPerformanceMetricsService reportPerformanceMetricsService;

    @Value("${app.reports.snapshots.max-age-minutes:20}")
    private int maxSnapshotAgeMinutes;

    @Value("${app.reports.snapshots.freshness-mode:strict_realtime}")
    private String freshnessModeConfig;

    @Value("${app.reports.snapshots.microcache-ttl-seconds:15}")
    private int microcacheTtlSeconds;

    /**
     * Comma-separated snapshot type patterns that must always be recomputed before response.
     * Supports exact names (e.g., DASHBOARD_TEACHER) and prefix wildcard (e.g., DASHBOARD_*).
     * Default keeps all dashboards strongly consistent.
     */
    @Value("${app.reports.snapshots.realtime-snapshot-types:DASHBOARD_*}")
    private String realtimeSnapshotTypesConfig;

    public DashboardSnapshotService(
            DashboardSnapshotRepository dashboardSnapshotRepository,
            ObjectMapper objectMapper,
            ReportPerformanceMetricsService reportPerformanceMetricsService) {
        this.dashboardSnapshotRepository = dashboardSnapshotRepository;
        this.objectMapper = objectMapper;
        this.reportPerformanceMetricsService = reportPerformanceMetricsService;
    }

    @Transactional
    public Map<String, Object> getKpiSnapshotOrRefresh(String roleCode, Supplier<Map<String, Object>> loader) {
        return loadOrRefresh(TYPE_KPI, roleCode, userScopedKey("default"), null, null, loader, new TypeReference<>() {});
    }

    @Transactional
    public ReportDashboardDTOs.AdminDashboardResponse getAdminSnapshotOrRefresh(
            String attendanceOverviewScopeKey,
            Supplier<ReportDashboardDTOs.AdminDashboardResponse> loader) {
        String normalized =
                attendanceOverviewScopeKey == null || attendanceOverviewScopeKey.isBlank()
                        ? AdminAttendanceOverviewScope.MONTH_TO_DATE.name()
                        : attendanceOverviewScopeKey.trim();
        String scoped = userScopedKey("att:" + normalized);
        return loadOrRefresh(TYPE_ADMIN, "ADMIN", scoped, null, null, loader, new TypeReference<>() {});
    }

    @Transactional
    public ReportDashboardDTOs.TeacherDashboardResponse getTeacherSnapshotOrRefresh(String month, Supplier<ReportDashboardDTOs.TeacherDashboardResponse> loader) {
        String normalizedMonth = month == null || month.isBlank() ? LocalDate.now().toString().substring(0, 7) : month.trim();
        String scope = userScopedKey("month:" + normalizedMonth);
        return loadOrRefresh(TYPE_TEACHER, "TEACHER", scope, null, null, loader, new TypeReference<>() {});
    }

    @Transactional
    public ParentDashboardDtos.Response getParentSnapshotOrRefresh(
            String from,
            String to,
            Long childId,
            Supplier<ParentDashboardDtos.Response> loader) {
        LocalDate fromDate = LocalDate.parse(from);
        LocalDate toDate = LocalDate.parse(to);
        String scope = userScopedKey("child:" + (childId != null ? childId : 0L));
        return loadOrRefresh(TYPE_PARENT, "PARENT", scope, fromDate, toDate, loader, new TypeReference<>() {});
    }

    @Transactional
    public int markCurrentTenantRefreshRequired(String reason) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            return 0;
        }
        return markRefreshRequiredForTenantId(tenantId, reason);
    }

    /**
     * Marks persisted snapshot rows so the next dashboard read recomputes (used by platform cache clear
     * where {@link TenantContext} is not the target school).
     */
    @Transactional
    public int markRefreshRequiredForTenantId(String tenantId, String reason) {
        if (tenantId == null || tenantId.isBlank()) {
            return 0;
        }
        String tid = tenantId.trim();
        int updated = dashboardSnapshotRepository.markRefreshRequiredForTenant(tid);
        log.info("Marked dashboard snapshots refresh-required tenantId={} rows={} reason={}", tid, updated, reason);
        return updated;
    }

    /** Super-admin global cache clear: every school's dashboard snapshot rows require refresh. */
    @Transactional
    public int markRefreshRequiredAllTenants(String reason) {
        int updated = dashboardSnapshotRepository.markRefreshRequiredAll();
        log.info("Marked dashboard snapshots refresh-required for all tenants rows={} reason={}", updated, reason);
        return updated;
    }

    @Transactional
    public int refreshDueSnapshots(int batchSize) {
        int safeBatch = Math.max(1, Math.min(batchSize, 100));
        int refreshed = 0;
        var dueRefresh = dashboardSnapshotRepository.findByRefreshRequiredTrueAndIsDeletedFalseOrderByUpdatedAtAsc(PageRequest.of(0, safeBatch));
        for (DashboardSnapshot row : dueRefresh.getContent()) {
            refreshed += TenantScopedExecution.execute(row.getTenantId(), null, null, () -> refreshOneSnapshot(row) ? 1 : 0);
        }
        if (refreshed < safeBatch) {
            LocalDateTime cutoff = LocalDateTime.now().minusMinutes(Math.max(5, maxSnapshotAgeMinutes));
            var staleRows = dashboardSnapshotRepository.findStaleSnapshots(cutoff, PageRequest.of(0, safeBatch - refreshed));
            for (DashboardSnapshot row : staleRows.getContent()) {
                refreshed += TenantScopedExecution.execute(row.getTenantId(), null, null, () -> refreshOneSnapshot(row) ? 1 : 0);
            }
        }
        return refreshed;
    }

    private boolean refreshOneSnapshot(DashboardSnapshot snapshot) {
        try {
            snapshot.setRefreshRequired(false);
            snapshot.setGeneratedAt(LocalDateTime.now());
            dashboardSnapshotRepository.save(snapshot);
            return true;
        } catch (Exception ex) {
            log.warn("Failed marking snapshot refreshed id={} tenantId={}", snapshot.getId(), snapshot.getTenantId(), ex);
            return false;
        }
    }

    private <T> T loadOrRefresh(
            String snapshotType,
            String roleCode,
            String scopeKey,
            LocalDate windowStart,
            LocalDate windowEnd,
            Supplier<T> loader,
            TypeReference<T> typeReference) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new BusinessException("Missing tenant context for dashboard snapshot");
        }
        List<DashboardSnapshot> existingRows = dashboardSnapshotRepository
                .findAllByTenantIdAndSnapshotTypeAndRoleCodeAndScopeKeyAndWindowStartAndWindowEndAndIsDeletedFalseOrderByUpdatedAtDescIdDesc(
                        tenantId, snapshotType, roleCode, scopeKey, windowStart, windowEnd);
        DashboardSnapshot existing = existingRows.isEmpty() ? null : existingRows.get(0);
        if (existingRows.size() > 1) {
            log.warn("Duplicate dashboard snapshots found; using latest row tenantId={} snapshotType={} roleCode={} scopeKey={} duplicates={}",
                    tenantId, snapshotType, roleCode, scopeKey, existingRows.size());
        }
        LocalDateTime now = LocalDateTime.now();
        boolean realtimeSnapshotType = isRealtimeSnapshotType(snapshotType);
        FreshnessMode freshnessMode = resolveFreshnessMode();
        long ttlSeconds = Math.max(1, Math.min(microcacheTtlSeconds, 60));
        if (existing != null) {
            DashboardSnapshot row = existing;
            boolean allowedByMicrocache = freshnessMode == FreshnessMode.REALTIME_WITH_MICROCACHE
                    && realtimeSnapshotType
                    && row.getGeneratedAt() != null
                    && row.getGeneratedAt().isAfter(now.minusSeconds(ttlSeconds));
            boolean allowedBySnapshotAge = !realtimeSnapshotType
                    && row.getGeneratedAt() != null
                    && row.getGeneratedAt().isAfter(now.minusMinutes(Math.max(5, maxSnapshotAgeMinutes)));
            if (!Boolean.TRUE.equals(row.getRefreshRequired()) && (allowedByMicrocache || allowedBySnapshotAge)) {
                try {
                    T cachedPayload = readPayload(row.getPayloadJson(), typeReference);
                    applyComputedAt(cachedPayload, row.getGeneratedAt() != null ? row.getGeneratedAt() : now);
                    reportPerformanceMetricsService.recordSnapshotHit(snapshotType);
                    return cachedPayload;
                } catch (Exception ex) {
                    log.warn("Snapshot payload incompatible; rebuilding tenantId={} snapshotType={} scopeKey={}",
                            tenantId, snapshotType, scopeKey, ex);
                    row.setRefreshRequired(true);
                    saveSnapshotBestEffort(row, "mark-refresh-required");
                }
            }
        }
        reportPerformanceMetricsService.recordSnapshotMiss(snapshotType);
        T freshPayload = loader.get();
        DashboardSnapshot row = existing != null ? existing : new DashboardSnapshot();
        row.setTenantId(tenantId);
        row.setSnapshotType(snapshotType);
        row.setRoleCode(roleCode);
        row.setScopeKey(scopeKey);
        row.setWindowStart(windowStart);
        row.setWindowEnd(windowEnd);
        row.setPayloadJson(writePayload(freshPayload));
        row.setGeneratedAt(now);
        row.setRefreshRequired(false);
        if (row.getCacheVersion() == null || row.getCacheVersion() < 1) {
            row.setCacheVersion(1);
        }
        saveSnapshotBestEffort(row, "upsert-snapshot");
        applyComputedAt(freshPayload, now);
        return freshPayload;
    }

    @SuppressWarnings("unchecked")
    private void applyComputedAt(Object payload, LocalDateTime computedAt) {
        if (payload == null || computedAt == null) {
            return;
        }
        String iso = computedAt.toString();
        if (payload instanceof ReportDashboardDTOs.AdminDashboardResponse admin) {
            admin.setDataComputedAt(iso);
            return;
        }
        if (payload instanceof ReportDashboardDTOs.TeacherDashboardResponse teacher) {
            teacher.setDataComputedAt(iso);
            return;
        }
        if (payload instanceof ParentDashboardDtos.Response parent) {
            parent.setDataComputedAt(iso);
            return;
        }
        if (payload instanceof Map<?, ?> mapPayload) {
            Map<String, Object> writablePayload = (Map<String, Object>) mapPayload;
            writablePayload.put("dataComputedAt", iso);
        }
    }

    private boolean isRealtimeSnapshotType(String snapshotType) {
        String normalizedType = snapshotType == null ? "" : snapshotType.trim().toUpperCase();
        if (normalizedType.isBlank()) {
            return false;
        }
        String configValue = realtimeSnapshotTypesConfig == null ? "" : realtimeSnapshotTypesConfig;
        return Arrays.stream(configValue.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .map(s -> s.toUpperCase())
                .anyMatch(pattern -> {
                    if (pattern.endsWith("*")) {
                        String prefix = pattern.substring(0, pattern.length() - 1);
                        return normalizedType.startsWith(prefix);
                    }
                    return normalizedType.equals(pattern);
                });
    }

    private FreshnessMode resolveFreshnessMode() {
        String modeRaw = freshnessModeConfig == null ? "" : freshnessModeConfig.trim().toLowerCase();
        if ("realtime_with_microcache".equals(modeRaw)) {
            return FreshnessMode.REALTIME_WITH_MICROCACHE;
        }
        return FreshnessMode.STRICT_REALTIME;
    }

    /** Keep dashboard snapshots isolated per authenticated user inside a tenant. */
    private String userScopedKey(String baseScope) {
        Long uid = TenantContext.getUserId();
        String safeBase = (baseScope == null || baseScope.isBlank()) ? "default" : baseScope;
        return "uid:" + (uid != null ? uid : 0L) + ":" + safeBase;
    }

    /**
     * Snapshot persistence must never break dashboard reads for end users.
     * If storage is temporarily read-only/misconfigured, serve fresh payload and keep app functional.
     */
    private void saveSnapshotBestEffort(DashboardSnapshot row, String operation) {
        try {
            dashboardSnapshotRepository.save(row);
        } catch (RuntimeException ex) {
            if (isReadOnlyWriteFailure(ex)) {
                log.warn(
                        "Skipped dashboard snapshot {} due to read-only connection tenantId={} snapshotType={} role={} scope={}",
                        operation, row.getTenantId(), row.getSnapshotType(), row.getRoleCode(), row.getScopeKey(), ex
                );
                return;
            }
            throw ex;
        }
    }

    private static boolean isReadOnlyWriteFailure(Throwable ex) {
        Throwable current = ex;
        while (current != null) {
            String msg = current.getMessage();
            if (msg != null && msg.toLowerCase().contains("read-only")) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }

    private String writePayload(Object payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (Exception ex) {
            throw new BusinessException("Unable to serialize dashboard snapshot payload");
        }
    }

    private <T> T readPayload(String payloadJson, TypeReference<T> typeReference) {
        try {
            return objectMapper.readValue(payloadJson, typeReference);
        } catch (Exception ex) {
            throw new BusinessException("Unable to deserialize dashboard snapshot payload");
        }
    }

    private enum FreshnessMode {
        STRICT_REALTIME,
        REALTIME_WITH_MICROCACHE
    }
}
