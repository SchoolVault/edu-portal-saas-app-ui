package com.school.erp.modules.platform.purge;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Hard-delete all rows for one tenant. Uses {@code FOREIGN_KEY_CHECKS=0} for a single connection
 * so order is forgiving; still deletes join tables without {@code tenant_id} explicitly first.
 * <p>
 * When new tenant-scoped tables are added, append them here (and add a migration) — this list is the contract.
 */
@Component
public class TenantDataPurgeExecutor {
    private final JdbcTemplate jdbcTemplate;

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
    }

    /**
     * @return approximate row deletes (sum of JDBC update counts).
     */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public int purgeTenantData(String tenantId) {
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0");
        try {
            int total = 0;
            total += jdbcTemplate.update(
                    "DELETE FROM exam_classes WHERE exam_id IN (SELECT id FROM exams WHERE tenant_id = ?)",
                    tenantId);
            total += jdbcTemplate.update(
                    "DELETE FROM teacher_subjects WHERE teacher_id IN (SELECT id FROM teachers WHERE tenant_id = ?)",
                    tenantId);
            for (String table : TENANT_SCOPED_TABLES) {
                total += jdbcTemplate.update("DELETE FROM " + table + " WHERE tenant_id = ?", tenantId);
            }
            total += jdbcTemplate.update("DELETE FROM tenant_configs WHERE tenant_id = ?", tenantId);
            return total;
        } finally {
            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");
        }
    }
}
