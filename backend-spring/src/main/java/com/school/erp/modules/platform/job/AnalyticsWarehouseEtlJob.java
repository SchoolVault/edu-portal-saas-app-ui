package com.school.erp.modules.platform.job;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

/**
 * Materializes warehouse summary tables used by {@code WarehouseReportQueryAdapter}.
 * If {@code app.analytics.datasource.url} is provided, writes go to that datasource;
 * otherwise it writes to primary OLTP datasource so the warehouse code path can be tested with mock data.
 */
@Component
public class AnalyticsWarehouseEtlJob {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsWarehouseEtlJob.class);

    private final JdbcTemplate warehouseJdbc;

    @Value("${app.analytics.etl.enabled:false}")
    private boolean enabled;

    public AnalyticsWarehouseEtlJob(
            JdbcTemplate jdbcTemplate,
            @Qualifier("analyticsJdbcTemplate") ObjectProvider<JdbcTemplate> analyticsJdbcTemplateProvider) {
        this.warehouseJdbc = analyticsJdbcTemplateProvider.getIfAvailable(() -> jdbcTemplate);
    }

    @Scheduled(cron = "${app.analytics.etl.cron:0 15 1 * * *}")
    @Transactional
    public void runStubEtl() {
        if (!enabled) {
            return;
        }
        try {
            LocalDate metricDate = LocalDate.now();
            String monthKey = YearMonth.now().toString();
            List<String> tenantIds = warehouseJdbc.queryForList(
                    "SELECT DISTINCT tenant_id FROM users WHERE is_deleted = 0 AND tenant_id IS NOT NULL",
                    String.class);
            for (String tenantId : tenantIds) {
                upsertDashboardMetrics(tenantId, metricDate);
                upsertClassSummary(tenantId, metricDate);
                upsertSectionSummary(tenantId, metricDate);
                upsertTeacherWorkloadSummary(tenantId, metricDate);
                upsertMonthlyAttendanceSummary(tenantId, monthKey);
            }
            log.debug("analytics_etl materialized tenantCount={} metricDate={} month={}", tenantIds.size(), metricDate, monthKey);
        } catch (Exception e) {
            log.warn("analytics_etl skipped: {}", e.getMessage(), e);
        }
    }

    private void upsertDashboardMetrics(String tenantId, LocalDate metricDate) {
        warehouseJdbc.update("""
                INSERT INTO wh_dashboard_daily_metrics (
                  tenant_id, metric_date, total_students, total_teachers, fees_collected, fees_pending,
                  attendance_total, attendance_present, attendance_absent, attendance_late, attendance_excused
                )
                SELECT
                  ?,
                  ?,
                  (SELECT COUNT(*) FROM students s WHERE s.tenant_id = ? AND s.is_deleted = 0),
                  (SELECT COUNT(*) FROM teachers t WHERE t.tenant_id = ? AND t.is_deleted = 0),
                  COALESCE((SELECT SUM(COALESCE(f.paid_amount,0)) FROM fee_payments f WHERE f.tenant_id = ? AND f.is_deleted = 0), 0),
                  COALESCE((SELECT SUM(COALESCE(f.due_amount,0)) FROM fee_payments f WHERE f.tenant_id = ? AND f.is_deleted = 0), 0),
                  (SELECT COUNT(*) FROM attendance_records a WHERE a.tenant_id = ? AND a.is_deleted = 0 AND a.date = ?),
                  (SELECT COUNT(*) FROM attendance_records a WHERE a.tenant_id = ? AND a.is_deleted = 0 AND a.date = ? AND a.status = 'PRESENT'),
                  (SELECT COUNT(*) FROM attendance_records a WHERE a.tenant_id = ? AND a.is_deleted = 0 AND a.date = ? AND a.status = 'ABSENT'),
                  (SELECT COUNT(*) FROM attendance_records a WHERE a.tenant_id = ? AND a.is_deleted = 0 AND a.date = ? AND a.status = 'LATE'),
                  (SELECT COUNT(*) FROM attendance_records a WHERE a.tenant_id = ? AND a.is_deleted = 0 AND a.date = ? AND a.status = 'EXCUSED')
                ON DUPLICATE KEY UPDATE
                  total_students = VALUES(total_students),
                  total_teachers = VALUES(total_teachers),
                  fees_collected = VALUES(fees_collected),
                  fees_pending = VALUES(fees_pending),
                  attendance_total = VALUES(attendance_total),
                  attendance_present = VALUES(attendance_present),
                  attendance_absent = VALUES(attendance_absent),
                  attendance_late = VALUES(attendance_late),
                  attendance_excused = VALUES(attendance_excused)
                """,
                tenantId, metricDate,
                tenantId, tenantId, tenantId, tenantId,
                tenantId, metricDate,
                tenantId, metricDate,
                tenantId, metricDate,
                tenantId, metricDate,
                tenantId, metricDate);
    }

    private void upsertClassSummary(String tenantId, LocalDate metricDate) {
        warehouseJdbc.update("""
                INSERT INTO wh_class_daily_summary (
                  tenant_id, metric_date, class_id, class_name, grade, sections, total_students,
                  attendance_percentage, performance_percentage, fee_collection_percentage, overdue_accounts
                )
                SELECT
                  c.tenant_id,
                  ?,
                  c.id,
                  c.name,
                  c.grade,
                  COALESCE(sec.section_count, 0),
                  COALESCE(st.student_count, 0),
                  CASE WHEN COALESCE(att.total_count,0) = 0 THEN 0 ELSE ROUND((COALESCE(att.present_count,0) * 100.0) / att.total_count, 2) END,
                  COALESCE(markstats.performance_pct, 0),
                  CASE WHEN COALESCE(feestats.total_amount,0) = 0 THEN 0 ELSE ROUND((feestats.total_collected * 100.0) / feestats.total_amount, 2) END,
                  COALESCE(feestats.overdue_accounts, 0)
                FROM school_classes c
                LEFT JOIN (
                  SELECT s.class_id, COUNT(*) section_count
                  FROM sections s
                  WHERE s.tenant_id = ? AND s.is_deleted = 0
                  GROUP BY s.class_id
                ) sec ON sec.class_id = c.id
                LEFT JOIN (
                  SELECT s.class_id, COUNT(*) student_count
                  FROM students s
                  WHERE s.tenant_id = ? AND s.is_deleted = 0
                  GROUP BY s.class_id
                ) st ON st.class_id = c.id
                LEFT JOIN (
                  SELECT a.class_id,
                         COUNT(*) total_count,
                         SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) present_count
                  FROM attendance_records a
                  WHERE a.tenant_id = ? AND a.is_deleted = 0 AND a.date = ?
                  GROUP BY a.class_id
                ) att ON att.class_id = c.id
                LEFT JOIN (
                  SELECT m.class_id,
                         ROUND(AVG(CASE WHEN m.max_marks > 0 THEN (m.marks_obtained / m.max_marks) * 100 ELSE 0 END), 2) performance_pct
                  FROM mark_records m
                  WHERE m.tenant_id = ?
                  GROUP BY m.class_id
                ) markstats ON markstats.class_id = c.id
                LEFT JOIN (
                  SELECT s.class_id,
                         SUM(COALESCE(fp.amount,0)) total_amount,
                         SUM(COALESCE(fp.paid_amount,0)) total_collected,
                         SUM(CASE WHEN fp.status = 'OVERDUE' THEN 1 ELSE 0 END) overdue_accounts
                  FROM fee_payments fp
                  JOIN students s ON s.id = fp.student_id AND s.tenant_id = fp.tenant_id AND s.is_deleted = 0
                  WHERE fp.tenant_id = ? AND fp.is_deleted = 0
                  GROUP BY s.class_id
                ) feestats ON feestats.class_id = c.id
                WHERE c.tenant_id = ? AND c.is_deleted = 0
                ON DUPLICATE KEY UPDATE
                  class_name = VALUES(class_name),
                  grade = VALUES(grade),
                  sections = VALUES(sections),
                  total_students = VALUES(total_students),
                  attendance_percentage = VALUES(attendance_percentage),
                  performance_percentage = VALUES(performance_percentage),
                  fee_collection_percentage = VALUES(fee_collection_percentage),
                  overdue_accounts = VALUES(overdue_accounts)
                """,
                metricDate,
                tenantId, tenantId, tenantId, metricDate, tenantId, tenantId, tenantId);
    }

    private void upsertSectionSummary(String tenantId, LocalDate metricDate) {
        warehouseJdbc.update("""
                INSERT INTO wh_section_daily_summary (
                  tenant_id, metric_date, class_id, section_id, class_name, section_name, class_teacher_name, student_count
                )
                SELECT
                  s.tenant_id,
                  ?,
                  s.class_id,
                  s.id,
                  c.name,
                  s.name,
                  COALESCE(NULLIF(TRIM(s.class_teacher_name),''), NULLIF(TRIM(c.class_teacher_name),''), '-') AS class_teacher_name,
                  COALESCE(st.student_count, 0)
                FROM sections s
                JOIN school_classes c ON c.id = s.class_id AND c.tenant_id = s.tenant_id AND c.is_deleted = 0
                LEFT JOIN (
                  SELECT st.section_id, COUNT(*) student_count
                  FROM students st
                  WHERE st.tenant_id = ? AND st.is_deleted = 0
                  GROUP BY st.section_id
                ) st ON st.section_id = s.id
                WHERE s.tenant_id = ? AND s.is_deleted = 0
                ON DUPLICATE KEY UPDATE
                  class_id = VALUES(class_id),
                  class_name = VALUES(class_name),
                  section_name = VALUES(section_name),
                  class_teacher_name = VALUES(class_teacher_name),
                  student_count = VALUES(student_count)
                """,
                metricDate, tenantId, tenantId);
    }

    private void upsertTeacherWorkloadSummary(String tenantId, LocalDate metricDate) {
        warehouseJdbc.update("""
                INSERT INTO wh_teacher_workload_daily_summary (
                  tenant_id, metric_date, teacher_id, teacher_name, specialization, teacher_status,
                  subjects_json, homeroom_classes, assigned_classes, weekly_periods
                )
                SELECT
                  t.tenant_id,
                  ?,
                  t.id,
                  TRIM(CONCAT(COALESCE(t.first_name,''), ' ', COALESCE(t.last_name,''))),
                  COALESCE(t.specialization, ''),
                  COALESCE(CAST(t.status AS CHAR), 'ACTIVE'),
                  t.subjects,
                  '-',
                  COALESCE(tt.assigned_classes, 0),
                  COALESCE(tt.weekly_periods, 0)
                FROM teachers t
                LEFT JOIN (
                  SELECT
                    te.teacher_id,
                    COUNT(DISTINCT te.class_id) assigned_classes,
                    COUNT(DISTINCT CONCAT(COALESCE(te.day,''), '-', COALESCE(te.period,0), '-', COALESCE(te.section_id,0))) weekly_periods
                  FROM timetable_entries te
                  WHERE te.tenant_id = ? AND te.is_deleted = 0
                  GROUP BY te.teacher_id
                ) tt ON tt.teacher_id = t.id
                WHERE t.tenant_id = ? AND t.is_deleted = 0
                ON DUPLICATE KEY UPDATE
                  teacher_name = VALUES(teacher_name),
                  specialization = VALUES(specialization),
                  teacher_status = VALUES(teacher_status),
                  subjects_json = VALUES(subjects_json),
                  assigned_classes = VALUES(assigned_classes),
                  weekly_periods = VALUES(weekly_periods)
                """,
                metricDate, tenantId, tenantId);
    }

    private void upsertMonthlyAttendanceSummary(String tenantId, String monthKey) {
        LocalDate monthStart = YearMonth.parse(monthKey).atDay(1);
        LocalDate monthEnd = YearMonth.parse(monthKey).atEndOfMonth();
        warehouseJdbc.update("""
                INSERT INTO wh_student_attendance_monthly_summary (
                  tenant_id, month_key, class_id, student_id, student_name,
                  present_count, absent_count, late_count, excused_count, total_days, attendance_percentage
                )
                SELECT
                  st.tenant_id,
                  ?,
                  st.class_id,
                  st.id,
                  TRIM(CONCAT(COALESCE(st.first_name,''), ' ', COALESCE(st.last_name,''))),
                  COALESCE(SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END),0),
                  COALESCE(SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END),0),
                  COALESCE(SUM(CASE WHEN a.status = 'LATE' THEN 1 ELSE 0 END),0),
                  COALESCE(SUM(CASE WHEN a.status = 'EXCUSED' THEN 1 ELSE 0 END),0),
                  COALESCE(COUNT(a.id),0),
                  CASE WHEN COUNT(a.id)=0 THEN 0
                       ELSE ROUND(((SUM(CASE WHEN a.status='PRESENT' THEN 1 ELSE 0 END) + (SUM(CASE WHEN a.status='LATE' THEN 1 ELSE 0 END) * 0.5)) * 100.0) / COUNT(a.id), 2)
                  END
                FROM students st
                LEFT JOIN attendance_records a
                  ON a.tenant_id = st.tenant_id
                 AND a.student_id = st.id
                 AND a.is_deleted = 0
                 AND a.date BETWEEN ? AND ?
                WHERE st.tenant_id = ? AND st.is_deleted = 0
                GROUP BY st.tenant_id, st.class_id, st.id, st.first_name, st.last_name
                ON DUPLICATE KEY UPDATE
                  student_name = VALUES(student_name),
                  present_count = VALUES(present_count),
                  absent_count = VALUES(absent_count),
                  late_count = VALUES(late_count),
                  excused_count = VALUES(excused_count),
                  total_days = VALUES(total_days),
                  attendance_percentage = VALUES(attendance_percentage)
                """,
                monthKey, monthStart, monthEnd, tenantId);
    }
}
