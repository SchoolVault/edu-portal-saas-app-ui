package com.school.erp.bootstrap;

import com.school.erp.modules.settings.repository.TenantConfigRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

/**
 * Seeds warehouse/materialized read tables after primary demo data is loaded.
 * Idempotent by design using UPSERT semantics.
 */
@Component
@Order(120)
@Profile({"demo-seed"})
@ConditionalOnProperty(name = "app.demo-seed.warehouse.enabled", havingValue = "true")
public class DemoWarehouseSeedRunner implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(DemoWarehouseSeedRunner.class);

    private final TenantConfigRepository tenantConfigRepository;
    private final JdbcTemplate jdbcTemplate;

    @Value("${app.demo-seed.warehouse.include-snapshot-seed:true}")
    private boolean includeSnapshotSeed;

    public DemoWarehouseSeedRunner(
            TenantConfigRepository tenantConfigRepository,
            JdbcTemplate jdbcTemplate) {
        this.tenantConfigRepository = tenantConfigRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        LocalDate metricDate = LocalDate.now();
        String monthKey = YearMonth.now().toString();
        List<String> tenantIds = tenantConfigRepository.findAllTenantIds().stream()
                .filter(t -> t != null && !t.isBlank() && !"SUPER_ADMIN_PLATFORM".equals(t))
                .distinct()
                .toList();
        if (tenantIds.isEmpty()) {
            return;
        }
        int seeded = 0;
        for (String tenantId : tenantIds) {
            seedWarehouseRowsForTenant(tenantId, metricDate, monthKey);
            if (includeSnapshotSeed) {
                seedDashboardSnapshotShells(tenantId, metricDate);
            }
            seeded++;
        }
        log.info("Demo warehouse seed complete tenants={} month={} date={}", seeded, monthKey, metricDate);
    }

    private void seedWarehouseRowsForTenant(String tenantId, LocalDate metricDate, String monthKey) {
        jdbcTemplate.update("""
                INSERT INTO wh_dashboard_daily_metrics (
                  tenant_id, metric_date, total_students, total_teachers, fees_collected, fees_pending,
                  attendance_total, attendance_present, attendance_absent, attendance_late, attendance_excused
                )
                SELECT
                  ?, ?,
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

        jdbcTemplate.update("""
                INSERT INTO wh_class_daily_summary (
                  tenant_id, metric_date, class_id, class_name, grade, sections, total_students,
                  attendance_percentage, performance_percentage, fee_collection_percentage, overdue_accounts
                )
                SELECT
                  c.tenant_id, ?, c.id, c.name, c.grade,
                  COALESCE(sec.section_count, 0),
                  COALESCE(st.student_count, 0),
                  COALESCE(att.present_pct, 0),
                  COALESCE(markstats.performance_pct, 0),
                  COALESCE(feestats.collection_pct, 0),
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
                         ROUND((SUM(CASE WHEN a.status='PRESENT' THEN 1 ELSE 0 END) * 100.0) / NULLIF(COUNT(*),0), 2) present_pct
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
                         ROUND((SUM(COALESCE(fp.paid_amount,0)) * 100.0) / NULLIF(SUM(COALESCE(fp.amount,0)),0), 2) collection_pct,
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
                metricDate, tenantId, tenantId, tenantId, metricDate, tenantId, tenantId, tenantId);

        jdbcTemplate.update("""
                INSERT INTO wh_student_attendance_monthly_summary (
                  tenant_id, month_key, class_id, student_id, student_name, present_count, absent_count, late_count, excused_count, total_days, attendance_percentage
                )
                SELECT
                  st.tenant_id, ?, st.class_id, st.id,
                  TRIM(CONCAT(COALESCE(st.first_name,''), ' ', COALESCE(st.last_name,''))),
                  COALESCE(SUM(CASE WHEN a.status='PRESENT' THEN 1 ELSE 0 END), 0),
                  COALESCE(SUM(CASE WHEN a.status='ABSENT' THEN 1 ELSE 0 END), 0),
                  COALESCE(SUM(CASE WHEN a.status='LATE' THEN 1 ELSE 0 END), 0),
                  COALESCE(SUM(CASE WHEN a.status='EXCUSED' THEN 1 ELSE 0 END), 0),
                  COALESCE(COUNT(a.id), 0),
                  CASE WHEN COUNT(a.id)=0 THEN 0
                       ELSE ROUND(((SUM(CASE WHEN a.status='PRESENT' THEN 1 ELSE 0 END) + (SUM(CASE WHEN a.status='LATE' THEN 1 ELSE 0 END) * 0.5)) * 100.0) / COUNT(a.id), 2)
                  END
                FROM students st
                LEFT JOIN attendance_records a
                  ON a.tenant_id = st.tenant_id
                 AND a.student_id = st.id
                 AND a.is_deleted = 0
                 AND DATE_FORMAT(a.date, '%Y-%m') = ?
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
                monthKey, monthKey, tenantId);
    }

    private void seedDashboardSnapshotShells(String tenantId, LocalDate metricDate) {
        jdbcTemplate.update("""
                INSERT INTO dashboard_snapshots (
                  tenant_id, is_active, is_deleted, snapshot_type, role_code, scope_key,
                  window_start, window_end, payload_json, cache_version, generated_at, refresh_required
                ) VALUES
                  (?, 1, 0, 'DASHBOARD_KPI', 'ADMIN', 'default', NULL, NULL, JSON_OBJECT('seed', true), 1, NOW(), 1),
                  (?, 1, 0, 'DASHBOARD_ADMIN', 'ADMIN', 'default', NULL, NULL, JSON_OBJECT('seed', true), 1, NOW(), 1),
                  (?, 1, 0, 'DASHBOARD_TEACHER', 'TEACHER', ?, NULL, NULL, JSON_OBJECT('seed', true), 1, NOW(), 1),
                  (?, 1, 0, 'DASHBOARD_PARENT', 'PARENT', 'child:0', ?, ?, JSON_OBJECT('seed', true), 1, NOW(), 1)
                ON DUPLICATE KEY UPDATE
                  refresh_required = VALUES(refresh_required),
                  generated_at = VALUES(generated_at)
                """,
                tenantId,
                tenantId,
                tenantId, YearMonth.now().toString(),
                tenantId, metricDate.minusDays(30), metricDate);
    }
}
