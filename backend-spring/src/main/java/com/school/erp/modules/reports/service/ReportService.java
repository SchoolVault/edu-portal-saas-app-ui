package com.school.erp.modules.reports.service;

import com.school.erp.modules.reports.dto.ReportDashboardDTOs;
import com.school.erp.modules.reports.port.ReportQueryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Facade for report/dashboard HTTP layer. Heavy lifting lives in {@link ReportQueryPort}
 * ({@code oltp} vs {@code warehouse} via {@code app.reports.backend}).
 */
@Service
public class ReportService {

    private final ReportQueryPort reportQueryPort;

    public ReportService(ReportQueryPort reportQueryPort) {
        this.reportQueryPort = reportQueryPort;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardKPIs() {
        return reportQueryPort.getDashboardKPIs();
    }

    @Transactional(readOnly = true)
    public ReportDashboardDTOs.AdminDashboardResponse getAdminDashboard() {
        return reportQueryPort.getAdminDashboard();
    }

    @Transactional(readOnly = true)
    public ReportDashboardDTOs.TeacherDashboardResponse getTeacherDashboard() {
        return reportQueryPort.getTeacherDashboard();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getStudentPerformanceReport(Long classId, Long examId) {
        return reportQueryPort.getStudentPerformanceReport(classId, examId);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAttendanceSummary(Long classId, String month) {
        return reportQueryPort.getAttendanceSummary(classId, month);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getFeeCollectionReport(Long classId) {
        return reportQueryPort.getFeeCollectionReport(classId);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getClassSummary() {
        return reportQueryPort.getClassSummary();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSectionSummary() {
        return reportQueryPort.getSectionSummary();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTeacherWorkload() {
        return reportQueryPort.getTeacherWorkload();
    }
}
