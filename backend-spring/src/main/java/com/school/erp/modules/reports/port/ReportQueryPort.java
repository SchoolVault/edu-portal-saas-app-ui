package com.school.erp.modules.reports.port;

import com.school.erp.modules.reports.dto.ParentDashboardDtos;
import com.school.erp.modules.reports.dto.ReportDashboardDTOs;

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

    ReportDashboardDTOs.TeacherDashboardResponse getTeacherDashboard(String month);

    ParentDashboardDtos.Response getParentDashboard(String from, String to, Long childId);

    List<Map<String, Object>> getStudentPerformanceReport(Long classId, Long examId);

    List<Map<String, Object>> getAttendanceSummary(Long classId, String month);

    Map<String, Object> getFeeCollectionReport(Long classId);

    List<Map<String, Object>> getClassSummary();

    List<Map<String, Object>> getSectionSummary();

    List<Map<String, Object>> getTeacherWorkload();
}
