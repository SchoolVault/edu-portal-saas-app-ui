package com.school.erp.modules.reports.port;

import com.school.erp.modules.reports.dto.ParentDashboardDtos;
import com.school.erp.modules.reports.dto.ReportDashboardDTOs;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

/**
 * Read-side boundary for dashboards and operational reports.
 * <p>
 * Default implementation uses OLTP (JPA). Switch {@code app.reports.backend=warehouse} to route through
 * {@link com.school.erp.modules.reports.adapter.WarehouseReportQueryAdapter} once analytics tables / JDBC are wired;
 * until then the warehouse adapter delegates to OLTP so behavior stays stable.
 */
public interface ReportQueryPort {

    Map<String, Object> getDashboardKPIs();

    ReportDashboardDTOs.AdminDashboardResponse getAdminDashboard();

    Page<ReportDashboardDTOs.ActivityItem> getAdminRecentActivities(
            String q,
            String eventType,
            String fromDate,
            String toDate,
            Pageable pageable);

    Page<ReportDashboardDTOs.UpcomingEvent> getAdminUpcomingEvents(
            String q,
            String eventType,
            String fromDate,
            String toDate,
            Pageable pageable);

    ReportDashboardDTOs.TeacherDashboardResponse getTeacherDashboard(String month);

    ParentDashboardDtos.Response getParentDashboard(String from, String to, Long childId);

    List<Map<String, Object>> getStudentPerformanceReport(Long classId, Long examId);

    List<Map<String, Object>> getAttendanceSummary(Long classId, String month);

    Map<String, Object> getFeeCollectionReport(Long classId);

    List<Map<String, Object>> getClassSummary();
    Page<Map<String, Object>> getClassSummaryPaged(int page, int size);

    List<Map<String, Object>> getSectionSummary();
    Page<Map<String, Object>> getSectionSummaryPaged(int page, int size);

    List<Map<String, Object>> getTeacherWorkload();
    Page<Map<String, Object>> getTeacherWorkloadPaged(int page, int size);
}
