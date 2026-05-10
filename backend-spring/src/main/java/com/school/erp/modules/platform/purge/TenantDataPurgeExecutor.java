package com.school.erp.modules.platform.purge;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Hard-delete <strong>all</strong> application data for <strong>one</strong> {@code tenant_id} (platform / GDPR offboarding).
 * Every {@code DELETE} includes {@code WHERE tenant_id = ?} — other schools are never touched.
 * <p>
 * Uses MySQL {@code SET FOREIGN_KEY_CHECKS=0} on the pooled connection for the duration of the purge so child/parent
 * order does not cause constraint errors; checks are re-enabled in {@code finally}. Join tables without {@code tenant_id}
 * are cleared via subqueries scoped to that tenant first.
 * <p>
 * When new tenant-scoped tables are added, append them here (and add a migration) — this list is the contract.
 */
@Component
public class TenantDataPurgeExecutor {
    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    /**
     * Tables with a {@code tenant_id} column (excluding {@code tenant_configs} — deleted after loop).
     */
    private static final List<String> TENANT_SCOPED_TABLES = List.of(
            "chat_messages",
            "chat_participants",
            "chat_conversations",
            "vehicle_live_locations",
            "fee_payment_attempts",
            "exam_schedule_slot",
            "exam_class_scope",
            "class_teacher_assignments",
            "subject_teacher_assignments",
            "leave_entitlement_policies",
            "leave_requests",
            "student_guardian_mappings",
            "guardians",
            "hostel_allocations",
            "hostel_rooms",
            "hostels",
            "transport_drivers",
            "transport_vehicles",
            "notifications",
            "announcements",
            "messages",
            "book_issues",
            "books",
            "route_stops",
            "student_transport_mapping",
            "transport_routes",
            "mark_records",
            "exams",
            "attendance_records",
            "timetable_entries",
            "payslips",
            "salary_components",
            "salary_structures",
            "fee_payments",
            "fee_components",
            "fee_structures",
            "documents",
            "audit_logs",
            "students",
            "teachers",
            "sections",
            "school_classes",
            "academic_years",
            "refresh_tokens",
            "users"
    );

    public TenantDataPurgeExecutor(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.dataSource = jdbcTemplate.getDataSource();
    }

    /**
     * @return approximate row deletes (sum of JDBC update counts).
     */
    public PurgeExecutionSummary purgeTenantData(String tenantId) {
        if (!StringUtils.hasText(tenantId)) {
            throw new IllegalArgumentException("tenantId is required");
        }
        if (dataSource == null) {
            throw new IllegalStateException("DataSource unavailable for purge execution");
        }
        final String normalizedTenantId = tenantId.trim();
        try (Connection connection = dataSource.getConnection()) {
            connection.setAutoCommit(false);
            try {
                long totalRowsDeleted = 0L;
                Map<String, Long> deletedRowsByTable = new LinkedHashMap<>();
                try (Statement stmt = connection.createStatement()) {
                    stmt.execute("SET FOREIGN_KEY_CHECKS = 0");
                }
                totalRowsDeleted += executeDelete(
                        connection,
                        "exam_classes",
                        "DELETE FROM exam_classes WHERE exam_id IN (SELECT id FROM exams WHERE tenant_id = ?)",
                        normalizedTenantId,
                        deletedRowsByTable);
                totalRowsDeleted += executeDelete(
                        connection,
                        "teacher_subjects",
                        "DELETE FROM teacher_subjects WHERE teacher_id IN (SELECT id FROM teachers WHERE tenant_id = ?)",
                        normalizedTenantId,
                        deletedRowsByTable);
                for (String table : TENANT_SCOPED_TABLES) {
                    totalRowsDeleted += executeDelete(
                            connection,
                            table,
                            "DELETE FROM " + table + " WHERE tenant_id = ?",
                            normalizedTenantId,
                            deletedRowsByTable);
                }
                totalRowsDeleted += executeDelete(
                        connection,
                        "tenant_configs",
                        "DELETE FROM tenant_configs WHERE tenant_id = ?",
                        normalizedTenantId,
                        deletedRowsByTable);
                try (Statement stmt = connection.createStatement()) {
                    stmt.execute("SET FOREIGN_KEY_CHECKS = 1");
                }
                connection.commit();
                return new PurgeExecutionSummary(totalRowsDeleted, deletedRowsByTable);
            } catch (Exception ex) {
                try (Statement stmt = connection.createStatement()) {
                    stmt.execute("SET FOREIGN_KEY_CHECKS = 1");
                } catch (Exception ignored) {
                    // Best effort; original error is more important for caller visibility.
                }
                connection.rollback();
                throw ex;
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Tenant purge execution failed", ex);
        }
    }

    private long executeDelete(
            Connection connection,
            String tableName,
            String sql,
            String tenantId,
            Map<String, Long> deletedRowsByTable
    ) throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, tenantId);
            long rows = ps.executeUpdate();
            deletedRowsByTable.put(tableName, rows);
            return rows;
        }
    }

    public record PurgeExecutionSummary(long totalRowsDeleted, Map<String, Long> deletedRowsByTable) {}
}
