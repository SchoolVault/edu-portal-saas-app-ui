package com.school.erp.modules.reports.adapter;

import com.school.erp.modules.reports.dto.AdminAttendanceOverviewScope;
import com.school.erp.modules.reports.dto.ParentDashboardDtos;
import com.school.erp.modules.reports.dto.ReportDashboardDTOs;
import com.school.erp.modules.reports.port.ReportQueryPort;
import com.school.erp.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;

/**
 * Analytics / warehouse read path. Uses warehouse aggregate tables when present and falls back
 * to OLTP adapter for fields not yet materialized.
 */
@Component
@Primary
@ConditionalOnProperty(name = "app.reports.backend", havingValue = "warehouse")
public class WarehouseReportQueryAdapter implements ReportQueryPort {

    private static final Logger log = LoggerFactory.getLogger(WarehouseReportQueryAdapter.class);
    private final OltpReportQueryAdapter oltp;
    private final JdbcTemplate warehouseJdbc;

    public WarehouseReportQueryAdapter(
            OltpReportQueryAdapter oltp,
            JdbcTemplate jdbcTemplate,
            @Qualifier("analyticsJdbcTemplate") ObjectProvider<JdbcTemplate> analyticsJdbcTemplateProvider) {
        this.oltp = oltp;
        this.warehouseJdbc = analyticsJdbcTemplateProvider.getIfAvailable(() -> jdbcTemplate);
    }

    @Override
    public Map<String, Object> getDashboardKPIs() {
        String tenantId = TenantContext.getTenantId();
        try {
            return warehouseJdbc.query("""
                            SELECT total_students, total_teachers, fees_collected, fees_pending
                            FROM wh_dashboard_daily_metrics
                            WHERE tenant_id = ?
                            ORDER BY metric_date DESC
                            LIMIT 1
                            """,
                    rs -> {
                        if (!rs.next()) {
                            return null;
                        }
                        Map<String, Object> out = new LinkedHashMap<>();
                        double collected = rs.getBigDecimal("fees_collected") != null ? rs.getBigDecimal("fees_collected").doubleValue() : 0d;
                        double pending = rs.getBigDecimal("fees_pending") != null ? rs.getBigDecimal("fees_pending").doubleValue() : 0d;
                        out.put("totalStudents", rs.getLong("total_students"));
                        out.put("totalTeachers", rs.getLong("total_teachers"));
                        out.put("feesCollected", collected);
                        out.put("feesPending", pending);
                        out.put("collectionRate", collected + pending > 0 ? Math.round((collected / (collected + pending)) * 100) : 0);
                        return out;
                    }, tenantId);
        } catch (Exception ex) {
            log.warn("Warehouse KPI read failed; fallback to OLTP tenantId={}", tenantId, ex);
            return oltp.getDashboardKPIs();
        }
    }

    @Override
    public ReportDashboardDTOs.AdminDashboardResponse getAdminDashboard(AdminAttendanceOverviewScope attendanceOverviewScope) {
        String tenantId = TenantContext.getTenantId();
        AdminAttendanceOverviewScope scope =
                attendanceOverviewScope != null ? attendanceOverviewScope : AdminAttendanceOverviewScope.MONTH_TO_DATE;
        try {
            ReportDashboardDTOs.AdminDashboardResponse out = oltp.getAdminDashboard(scope);
            warehouseJdbc.query("""
                            SELECT total_students, total_teachers, fees_collected, fees_pending
                            FROM wh_dashboard_daily_metrics
                            WHERE tenant_id = ?
                            ORDER BY metric_date DESC
                            LIMIT 1
                            """,
                    rs -> {
                        if (!rs.next()) {
                            return null;
                        }
                        double collected = asDouble(rs.getBigDecimal("fees_collected"));
                        double pending = asDouble(rs.getBigDecimal("fees_pending"));
                        out.setTotalStudents(rs.getLong("total_students"));
                        out.setTotalTeachers(rs.getLong("total_teachers"));
                        out.setFeesCollected(collected);
                        out.setFeesPending(pending);
                        out.setCollectionRate(collected + pending > 0 ? Math.round((collected / (collected + pending)) * 100) : 0);
                        return null;
                    }, tenantId);
            return out;
        } catch (Exception ex) {
            log.warn("Warehouse admin dashboard read failed; fallback to OLTP tenantId={}", tenantId, ex);
            return oltp.getAdminDashboard(scope);
        }
    }

    @Override
    public Page<ReportDashboardDTOs.ActivityItem> getAdminRecentActivities(
            String q,
            String eventType,
            String fromDate,
            String toDate,
            Pageable pageable) {
        return oltp.getAdminRecentActivities(q, eventType, fromDate, toDate, pageable);
    }

    @Override
    public Page<ReportDashboardDTOs.UpcomingEvent> getAdminUpcomingEvents(
            String q,
            String eventType,
            String fromDate,
            String toDate,
            Pageable pageable) {
        return oltp.getAdminUpcomingEvents(q, eventType, fromDate, toDate, pageable);
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
        String tenantId = TenantContext.getTenantId();
        String monthKey = normalizeMonth(month);
        try {
            List<Map<String, Object>> rows = warehouseJdbc.query("""
                            SELECT student_id, student_name, present_count, absent_count, late_count, excused_count, total_days, attendance_percentage
                            FROM wh_student_attendance_monthly_summary
                            WHERE tenant_id = ? AND month_key = ? AND class_id = ?
                            ORDER BY student_id ASC
                            """,
                    (rs, rowNum) -> Map.<String, Object>of(
                            "studentId", rs.getLong("student_id"),
                            "studentName", rs.getString("student_name") != null ? rs.getString("student_name") : "",
                            "present", rs.getLong("present_count"),
                            "absent", rs.getLong("absent_count"),
                            "late", rs.getLong("late_count"),
                            "excused", rs.getLong("excused_count"),
                            "totalDays", rs.getLong("total_days"),
                            "attendancePercentage", asDouble(rs.getBigDecimal("attendance_percentage"))
                    ), tenantId, monthKey, classId);
            if (!rows.isEmpty()) {
                return rows;
            }
        } catch (Exception ex) {
            log.warn("Warehouse attendance summary read failed; fallback to OLTP tenantId={} classId={}", tenantId, classId, ex);
        }
        return oltp.getAttendanceSummary(classId, month);
    }

    @Override
    public Map<String, Object> getFeeCollectionReport(Long classId) {
        String tenantId = TenantContext.getTenantId();
        try {
            return warehouseJdbc.query("""
                            SELECT fees_collected, fees_pending
                            FROM wh_dashboard_daily_metrics
                            WHERE tenant_id = ?
                            ORDER BY metric_date DESC
                            LIMIT 1
                            """,
                    rs -> {
                        if (!rs.next()) {
                            return null;
                        }
                        double collected = asDouble(rs.getBigDecimal("fees_collected"));
                        double pending = asDouble(rs.getBigDecimal("fees_pending"));
                        Map<String, Object> out = new LinkedHashMap<>();
                        out.put("totalCollected", collected);
                        out.put("totalPending", pending);
                        out.put("overdueCount", 0L);
                        out.put("totalStudents", 0L);
                        out.put("collectionRate", collected + pending > 0 ? Math.round((collected / (collected + pending)) * 100) : 0);
                        return out;
                    }, tenantId);
        } catch (Exception ex) {
            log.warn("Warehouse fee collection read failed; fallback to OLTP tenantId={}", tenantId, ex);
            return oltp.getFeeCollectionReport(classId);
        }
    }

    @Override
    public List<Map<String, Object>> getClassSummary() {
        return getClassSummaryPaged(0, 1000).getContent();
    }

    @Override
    public Page<Map<String, Object>> getClassSummaryPaged(int page, int size) {
        String tenantId = TenantContext.getTenantId();
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        int offset = safePage * safeSize;
        try {
            Long total = warehouseJdbc.queryForObject(
                    "SELECT COUNT(*) FROM wh_class_daily_summary WHERE tenant_id = ? AND metric_date = (SELECT MAX(metric_date) FROM wh_class_daily_summary WHERE tenant_id = ?)",
                    Long.class, tenantId, tenantId);
            if (total == null || total == 0) {
                return oltp.getClassSummaryPaged(page, size);
            }
            List<Map<String, Object>> rows = warehouseJdbc.query("""
                            SELECT class_id, class_name, grade, sections, total_students, attendance_percentage, performance_percentage, fee_collection_percentage, overdue_accounts
                            FROM wh_class_daily_summary
                            WHERE tenant_id = ? AND metric_date = (SELECT MAX(metric_date) FROM wh_class_daily_summary WHERE tenant_id = ?)
                            ORDER BY grade ASC, class_name ASC
                            LIMIT ? OFFSET ?
                            """,
                    (rs, rowNum) -> Map.<String, Object>of(
                            "classId", rs.getLong("class_id"),
                            "className", rs.getString("class_name") != null ? rs.getString("class_name") : "Class",
                            "grade", rs.getObject("grade") != null ? rs.getInt("grade") : null,
                            "sections", rs.getLong("sections"),
                            "totalStudents", rs.getLong("total_students"),
                            "attendancePercentage", asDouble(rs.getBigDecimal("attendance_percentage")),
                            "performancePercentage", asDouble(rs.getBigDecimal("performance_percentage")),
                            "feeCollectionPercentage", asDouble(rs.getBigDecimal("fee_collection_percentage")),
                            "overdueAccounts", rs.getLong("overdue_accounts")
                    ), tenantId, tenantId, safeSize, offset);
            return new PageImpl<>(rows, PageRequest.of(safePage, safeSize), total);
        } catch (Exception ex) {
            log.warn("Warehouse class summary paged read failed; fallback to OLTP tenantId={}", tenantId, ex);
            return oltp.getClassSummaryPaged(page, size);
        }
    }

    @Override
    public List<Map<String, Object>> getSectionSummary() {
        return getSectionSummaryPaged(0, 2000).getContent();
    }

    @Override
    public Page<Map<String, Object>> getSectionSummaryPaged(int page, int size) {
        String tenantId = TenantContext.getTenantId();
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        int offset = safePage * safeSize;
        try {
            Long total = warehouseJdbc.queryForObject(
                    "SELECT COUNT(*) FROM wh_section_daily_summary WHERE tenant_id = ? AND metric_date = (SELECT MAX(metric_date) FROM wh_section_daily_summary WHERE tenant_id = ?)",
                    Long.class, tenantId, tenantId);
            if (total == null || total == 0) {
                return oltp.getSectionSummaryPaged(page, size);
            }
            List<Map<String, Object>> rows = warehouseJdbc.query("""
                            SELECT section_id, section_name, class_id, class_name, class_teacher_name, student_count
                            FROM wh_section_daily_summary
                            WHERE tenant_id = ? AND metric_date = (SELECT MAX(metric_date) FROM wh_section_daily_summary WHERE tenant_id = ?)
                            ORDER BY class_id ASC, section_name ASC
                            LIMIT ? OFFSET ?
                            """,
                    (rs, rowNum) -> Map.<String, Object>of(
                            "sectionId", rs.getLong("section_id"),
                            "sectionName", rs.getString("section_name") != null ? rs.getString("section_name") : "",
                            "classId", rs.getLong("class_id"),
                            "className", rs.getString("class_name") != null ? rs.getString("class_name") : "Class",
                            "studentCount", rs.getLong("student_count"),
                            "classTeacherName", rs.getString("class_teacher_name") != null ? rs.getString("class_teacher_name") : "-"
                    ), tenantId, tenantId, safeSize, offset);
            return new PageImpl<>(rows, PageRequest.of(safePage, safeSize), total);
        } catch (Exception ex) {
            log.warn("Warehouse section summary paged read failed; fallback to OLTP tenantId={}", tenantId, ex);
            return oltp.getSectionSummaryPaged(page, size);
        }
    }

    @Override
    public List<Map<String, Object>> getTeacherWorkload() {
        return getTeacherWorkloadPaged(0, 2000).getContent();
    }

    @Override
    public Page<Map<String, Object>> getTeacherWorkloadPaged(int page, int size) {
        String tenantId = TenantContext.getTenantId();
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        int offset = safePage * safeSize;
        try {
            Long total = warehouseJdbc.queryForObject(
                    "SELECT COUNT(*) FROM wh_teacher_workload_daily_summary WHERE tenant_id = ? AND metric_date = (SELECT MAX(metric_date) FROM wh_teacher_workload_daily_summary WHERE tenant_id = ?)",
                    Long.class, tenantId, tenantId);
            if (total == null || total == 0) {
                return oltp.getTeacherWorkloadPaged(page, size);
            }
            List<Map<String, Object>> rows = warehouseJdbc.query("""
                            SELECT teacher_id, teacher_name, specialization, teacher_status, homeroom_classes, assigned_classes, weekly_periods
                            FROM wh_teacher_workload_daily_summary
                            WHERE tenant_id = ? AND metric_date = (SELECT MAX(metric_date) FROM wh_teacher_workload_daily_summary WHERE tenant_id = ?)
                            ORDER BY teacher_name ASC
                            LIMIT ? OFFSET ?
                            """,
                    (rs, rowNum) -> Map.<String, Object>of(
                            "teacherId", rs.getLong("teacher_id"),
                            "teacherName", rs.getString("teacher_name") != null ? rs.getString("teacher_name") : "",
                            "specialization", rs.getString("specialization") != null ? rs.getString("specialization") : "",
                            "subjects", List.of(),
                            "status", rs.getString("teacher_status") != null ? rs.getString("teacher_status") : "ACTIVE",
                            "homeroomClasses", rs.getString("homeroom_classes") != null ? rs.getString("homeroom_classes") : "-",
                            "assignedClasses", rs.getLong("assigned_classes"),
                            "weeklyPeriods", rs.getLong("weekly_periods")
                    ), tenantId, tenantId, safeSize, offset);
            return new PageImpl<>(rows, PageRequest.of(safePage, safeSize), total);
        } catch (Exception ex) {
            log.warn("Warehouse teacher workload paged read failed; fallback to OLTP tenantId={}", tenantId, ex);
            return oltp.getTeacherWorkloadPaged(page, size);
        }
    }

    private static String normalizeMonth(String month) {
        try {
            return (month == null || month.isBlank()) ? YearMonth.now().toString() : YearMonth.parse(month.trim()).toString();
        } catch (Exception ex) {
            return YearMonth.now().toString();
        }
    }

    private static double asDouble(BigDecimal value) {
        return value != null ? Math.round(value.doubleValue() * 100.0) / 100.0 : 0d;
    }
}
