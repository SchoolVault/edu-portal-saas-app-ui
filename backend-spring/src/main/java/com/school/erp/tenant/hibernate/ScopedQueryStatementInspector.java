package com.school.erp.tenant.hibernate;

import com.school.erp.tenant.TenantQueryPolicy;
import org.hibernate.resource.jdbc.spi.StatementInspector;
import org.springframework.util.StringUtils;

import java.util.Locale;
import java.util.Set;

/**
 * Fails fast when SQL against academic-year-scoped tables is missing tenant/year predicates.
 * This is a defensive guardrail for custom queries and future regressions.
 */
public class ScopedQueryStatementInspector implements StatementInspector {

    private static final Set<String> ACADEMIC_YEAR_SCOPED_TABLES = Set.of(
            "attendance_records",
            "timetable_entries",
            "exams",
            "mark_records",
            "school_classes",
            "class_teacher_assignments",
            "subject_teacher_assignments",
            "fee_structures",
            "fee_payments",
            "fee_payment_attempts",
            "fee_transactions",
            "announcements",
            "notifications",
            "communication_events",
            "book_issues",
            "leave_requests"
    );

    @Override
    public String inspect(String sql) {
        if (!StringUtils.hasText(sql) || TenantQueryPolicy.isPlatformSuperAdmin()) {
            return sql;
        }
        String normalized = sql.toLowerCase(Locale.ROOT);
        if (!isReadOrMutation(normalized)) {
            return sql;
        }
        for (String table : ACADEMIC_YEAR_SCOPED_TABLES) {
            if (!normalized.contains(table)) {
                continue;
            }
            boolean hasTenantScope = normalized.contains("tenant_id");
            boolean hasAcademicYearScope = normalized.contains("academic_year_id");
            if (!hasTenantScope || !hasAcademicYearScope) {
                throw new IllegalStateException(
                        "Scoped query missing tenant/year constraints for table " + table);
            }
        }
        return sql;
    }

    private static boolean isReadOrMutation(String normalizedSql) {
        return normalizedSql.startsWith("select ")
                || normalizedSql.startsWith("update ")
                || normalizedSql.startsWith("delete ");
    }
}
