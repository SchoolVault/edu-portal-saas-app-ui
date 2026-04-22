package com.school.erp.modules.reports.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.common.exception.BusinessException;
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
    public ReportDashboardDTOs.AdminDashboardResponse getAdminSnapshotOrRefresh(Supplier<ReportDashboardDTOs.AdminDashboardResponse> loader) {
        return loadOrRefresh(TYPE_ADMIN, "ADMIN", userScopedKey("default"), null, null, loader, new TypeReference<>() {});
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
        int updated = dashboardSnapshotRepository.markRefreshRequiredForTenant(tenantId);
        log.info("Marked dashboard snapshots refresh-required tenantId={} rows={} reason={}", tenantId, updated, reason);
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
        if (existing != null) {
            DashboardSnapshot row = existing;
            if (!Boolean.TRUE.equals(row.getRefreshRequired())
                    && row.getGeneratedAt() != null
                    && row.getGeneratedAt().isAfter(now.minusMinutes(Math.max(5, maxSnapshotAgeMinutes)))) {
                try {
                    T cachedPayload = readPayload(row.getPayloadJson(), typeReference);
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
        return freshPayload;
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
}
