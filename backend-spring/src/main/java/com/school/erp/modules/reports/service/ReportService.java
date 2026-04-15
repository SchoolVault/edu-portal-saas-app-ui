package com.school.erp.modules.reports.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.config.CacheConfig;
import com.school.erp.modules.reports.dto.ReportDashboardDTOs;
import com.school.erp.modules.reports.port.ReportQueryPort;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Facade for report/dashboard HTTP layer. Heavy lifting lives in {@link ReportQueryPort}
 * ({@code oltp} vs {@code warehouse} via {@code app.reports.backend}).
 * <p>
 * Redis-backed caching (when {@code spring.cache.type=redis}): dashboard payloads use
 * {@link CacheConfig#DASHBOARD_SNAPSHOTS} (default 1h); heavier drill-down reports use
 * {@link CacheConfig#REPORT_RESULTS}. Paged endpoints delegate through {@link #self} so list
 * methods stay cache hits.
 */
@Service
public class ReportService {

    private final ReportQueryPort reportQueryPort;
    private final ReportService self;

    public ReportService(ReportQueryPort reportQueryPort, @Lazy ReportService self) {
        this.reportQueryPort = reportQueryPort;
        this.self = self;
    }

    @Cacheable(cacheNames = CacheConfig.DASHBOARD_SNAPSHOTS, keyGenerator = "tenantUserRoleKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardKPIs() {
        return reportQueryPort.getDashboardKPIs();
    }

    @Cacheable(cacheNames = CacheConfig.DASHBOARD_SNAPSHOTS, keyGenerator = "tenantUserRoleKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public ReportDashboardDTOs.AdminDashboardResponse getAdminDashboard() {
        return reportQueryPort.getAdminDashboard();
    }

    @Cacheable(cacheNames = CacheConfig.DASHBOARD_SNAPSHOTS, keyGenerator = "tenantUserRoleKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public ReportDashboardDTOs.TeacherDashboardResponse getTeacherDashboard() {
        return reportQueryPort.getTeacherDashboard();
    }

    @Cacheable(cacheNames = CacheConfig.REPORT_RESULTS, keyGenerator = "tenantMethodParamsKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getStudentPerformanceReport(Long classId, Long examId) {
        return reportQueryPort.getStudentPerformanceReport(classId, examId);
    }

    @Cacheable(cacheNames = CacheConfig.REPORT_RESULTS, keyGenerator = "tenantMethodParamsKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAttendanceSummary(Long classId, String month) {
        return reportQueryPort.getAttendanceSummary(classId, month);
    }

    @Cacheable(cacheNames = CacheConfig.REPORT_RESULTS, keyGenerator = "tenantMethodParamsKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public Map<String, Object> getFeeCollectionReport(Long classId) {
        return reportQueryPort.getFeeCollectionReport(classId);
    }

    @Cacheable(cacheNames = CacheConfig.REPORT_RESULTS, keyGenerator = "tenantUserRoleKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getClassSummary() {
        return reportQueryPort.getClassSummary();
    }

    @Cacheable(cacheNames = CacheConfig.REPORT_RESULTS, keyGenerator = "tenantUserRoleKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSectionSummary() {
        return reportQueryPort.getSectionSummary();
    }

    @Cacheable(cacheNames = CacheConfig.REPORT_RESULTS, keyGenerator = "tenantUserRoleKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTeacherWorkload() {
        return reportQueryPort.getTeacherWorkload();
    }

    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> getClassSummaryPaged(int page, int size) {
        return sliceList(self.getClassSummary(), page, size);
    }

    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> getSectionSummaryPaged(int page, int size) {
        return sliceList(self.getSectionSummary(), page, size);
    }

    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> getTeacherWorkloadPaged(int page, int size) {
        return sliceList(self.getTeacherWorkload(), page, size);
    }

    private static <T> PageResponse<T> sliceList(List<T> all, int page, int size) {
        long total = all.size();
        int from = page * size;
        if (from >= all.size()) {
            return PageResponse.of(List.of(), page, size, total);
        }
        int to = Math.min(from + size, all.size());
        return PageResponse.of(all.subList(from, to), page, size, total);
    }
}
