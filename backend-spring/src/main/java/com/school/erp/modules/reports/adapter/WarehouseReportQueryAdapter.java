package com.school.erp.modules.reports.adapter;

import com.school.erp.modules.reports.dto.ParentDashboardDtos;
import com.school.erp.modules.reports.dto.ReportDashboardDTOs;
import com.school.erp.modules.reports.port.ReportQueryPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Analytics / warehouse read path. Today delegates to {@link OltpReportQueryAdapter} so enabling
 * {@code app.reports.backend=warehouse} is a no-op until JDBC queries against replicated or star-schema tables are added.
 * Inject an optional {@code @Qualifier("analyticsJdbcTemplate") JdbcTemplate} later without changing controllers.
 */
@Component
@Primary
@ConditionalOnProperty(name = "app.reports.backend", havingValue = "warehouse")
public class WarehouseReportQueryAdapter implements ReportQueryPort {

    private static final Logger log = LoggerFactory.getLogger(WarehouseReportQueryAdapter.class);
    private final OltpReportQueryAdapter oltp;

    public WarehouseReportQueryAdapter(OltpReportQueryAdapter oltp) {
        this.oltp = oltp;
    }

    @Override
    public Map<String, Object> getDashboardKPIs() {
        log.trace("warehouse report path: delegating getDashboardKPIs to OLTP until warehouse SQL exists");
        return oltp.getDashboardKPIs();
    }

    @Override
    public ReportDashboardDTOs.AdminDashboardResponse getAdminDashboard() {
        log.trace("warehouse report path: delegating getAdminDashboard to OLTP");
        return oltp.getAdminDashboard();
    }

    @Override
    public ReportDashboardDTOs.TeacherDashboardResponse getTeacherDashboard(String month) {
        log.trace("warehouse report path: delegating getTeacherDashboard to OLTP");
        return oltp.getTeacherDashboard(month);
    }

    @Override
    public ParentDashboardDtos.Response getParentDashboard(String from, String to, Long childId) {
        return oltp.getParentDashboard(from, to, childId);
    }

    @Override
    public List<Map<String, Object>> getStudentPerformanceReport(Long classId, Long examId) {
        return oltp.getStudentPerformanceReport(classId, examId);
    }

    @Override
    public List<Map<String, Object>> getAttendanceSummary(Long classId, String month) {
        return oltp.getAttendanceSummary(classId, month);
    }

    @Override
    public Map<String, Object> getFeeCollectionReport(Long classId) {
        return oltp.getFeeCollectionReport(classId);
    }

    @Override
    public List<Map<String, Object>> getClassSummary() {
        return oltp.getClassSummary();
    }

    @Override
    public List<Map<String, Object>> getSectionSummary() {
        return oltp.getSectionSummary();
    }

    @Override
    public List<Map<String, Object>> getTeacherWorkload() {
        return oltp.getTeacherWorkload();
    }
}
