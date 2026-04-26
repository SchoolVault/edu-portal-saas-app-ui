package com.school.erp.security.rbac;

/**
 * Central {@code @PreAuthorize} SpEL strings so policy can evolve in one place.
 * Kept as {@code public static final} fields for annotation parameters.
 * <p>
 * Permission-driven baseline: API checks are authority-only and map to {@link AppPermission} codes.
 * Portal roles remain identity metadata, not authorization gates.
 * </p>
 */
public final class RbacSpel {
    private RbacSpel() {
    }

    /** School-wide communication admin: announcements, campaigns, templates, events. */
    public static final String COMMUNICATION_SCHOOL_ADMIN =
            "hasAnyAuthority('SCHOOL_COMMUNICATION_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Inbox and communication feed read surface for school personas and comm desks. */
    public static final String COMMUNICATION_INBOX_READ =
            "hasAnyAuthority('ACADEMIC_TEACHER','PORTAL_PARENT','PORTAL_STUDENT','PORTAL_SCHOOL_STAFF',"
                    + "'SCHOOL_COMMUNICATION_READ','SCHOOL_COMMUNICATION_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Guardian lookup used by teachers and admins when linking students. */
    public static final String GUARDIAN_DIRECTORY_READ =
            "hasAnyAuthority('SCHOOL_GUARDIAN_READ','SCHOOL_GUARDIAN_WRITE','SCHOOL_STUDENT_READ','SCHOOL_STUDENT_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Guardian master data writes (registrar / admissions desk). */
    public static final String GUARDIAN_DIRECTORY_WRITE =
            "hasAnyAuthority('SCHOOL_GUARDIAN_WRITE','SCHOOL_STUDENT_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_STUDENT_READ =
            "hasAnyAuthority('SCHOOL_STUDENT_READ','SCHOOL_STUDENT_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_STUDENT_WRITE =
            "hasAnyAuthority('SCHOOL_STUDENT_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_FEES_READ =
            "hasAnyAuthority('SCHOOL_FEES_READ','SCHOOL_FEES_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_FEES_WRITE =
            "hasAnyAuthority('SCHOOL_FEES_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String FEE_STRUCTURES_READ =
            "hasAnyAuthority('FEE_STRUCTURES_READ','SCHOOL_FEES_READ','SCHOOL_FEES_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_SETTINGS_FINANCE =
            "hasAnyAuthority('SCHOOL_SETTINGS_FINANCE_READ','SCHOOL_SETTINGS_FINANCE_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_SETTINGS_FINANCE_WRITE =
            "hasAnyAuthority('SCHOOL_SETTINGS_FINANCE_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_PAYROLL_READ =
            "hasAnyAuthority('SCHOOL_PAYROLL_READ','SCHOOL_PAYROLL_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_PAYROLL_WRITE =
            "hasAnyAuthority('SCHOOL_PAYROLL_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_EXAMS_READ =
            "hasAnyAuthority('SCHOOL_EXAMS_READ','SCHOOL_EXAMS_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_EXAMS_WRITE =
            "hasAnyAuthority('SCHOOL_EXAMS_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_IMPORT_EXPORT_READ =
            "hasAnyAuthority('SCHOOL_IMPORT_EXPORT_READ','SCHOOL_IMPORT_EXPORT_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_IMPORT_EXPORT_WRITE =
            "hasAnyAuthority('SCHOOL_IMPORT_EXPORT_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_COMMUNICATION_READ =
            "hasAnyAuthority('SCHOOL_COMMUNICATION_READ','SCHOOL_COMMUNICATION_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_COMMUNICATION_WRITE =
            "hasAnyAuthority('SCHOOL_COMMUNICATION_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_DIRECTORY_READ =
            "hasAnyAuthority('SCHOOL_DIRECTORY_READ','SCHOOL_DIRECTORY_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_DIRECTORY_WRITE =
            "hasAnyAuthority('SCHOOL_DIRECTORY_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_OPERATIONS_READ =
            "hasAnyAuthority('SCHOOL_OPERATIONS_READ','SCHOOL_OPERATIONS_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_OPERATIONS_WRITE =
            "hasAnyAuthority('SCHOOL_OPERATIONS_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_ACADEMIC_READ =
            "hasAnyAuthority('SCHOOL_ACADEMIC_READ','SCHOOL_ACADEMIC_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_ACADEMIC_WRITE =
            "hasAnyAuthority('SCHOOL_ACADEMIC_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_LEAVE_SELF_READ =
            "hasAnyAuthority('SCHOOL_LEAVE_SELF_READ','SCHOOL_LEAVE_SELF_APPLY','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_LEAVE_SELF_APPLY =
            "hasAnyAuthority('SCHOOL_LEAVE_SELF_APPLY','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_LEAVE_APPROVAL_READ =
            "hasAnyAuthority('SCHOOL_LEAVE_APPROVAL_READ','SCHOOL_LEAVE_APPROVAL_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_LEAVE_APPROVAL_WRITE =
            "hasAnyAuthority('SCHOOL_LEAVE_APPROVAL_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_REPORTS_READ =
            "hasAnyAuthority('SCHOOL_REPORTS_READ','SCHOOL_REPORTS_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_REPORTS_WRITE =
            "hasAnyAuthority('SCHOOL_REPORTS_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_TENANT_SETTINGS =
            "hasAnyAuthority('SCHOOL_SETTINGS_CORE_READ','SCHOOL_SETTINGS_CORE_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_TENANT_SETTINGS_WRITE =
            "hasAnyAuthority('SCHOOL_SETTINGS_CORE_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    /**
     * Read-only tenant settings context used by authenticated portal users (teachers/staff/parents/students)
     * for shell-level behavior and role-appropriate settings views.
     */
    public static final String SCHOOL_PORTAL_SETTINGS_READ = "isAuthenticated()";

    /**
     * Manage per-staff school responsibility role assignments and read catalog.
     * Same access envelope as other school configuration surfaces in phase 1–2.
     */
    public static final String SCHOOL_RBAC_API =
            "hasAnyAuthority('SCHOOL_RBAC_READ','SCHOOL_RBAC_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_RBAC_API_WRITE =
            "hasAnyAuthority('SCHOOL_RBAC_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    // --- Import / export ----------------------------------------------------

    /** Async jobs, dry-run, header preview, metrics, rollback (not student template download). */
    public static final String IMPORT_EXPORT_JOBS =
            "hasAnyAuthority('SCHOOL_IMPORT_EXPORT_READ','SCHOOL_IMPORT_EXPORT_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Student roster CSV export (teachers may pull class context templates). */
    public static final String IMPORT_EXPORT_STUDENT_TEMPLATE_READ =
            "hasAnyAuthority('ACADEMIC_TEACHER','SCHOOL_IMPORT_EXPORT_READ','SCHOOL_IMPORT_EXPORT_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Teachers/staff directory export (PII-sensitive). */
    public static final String IMPORT_EXPORT_TEACHER_DIRECTORY_EXPORT =
            "hasAnyAuthority('SCHOOL_IMPORT_EXPORT_READ','SCHOOL_IMPORT_EXPORT_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    // --- Operations / notifications -----------------------------------------

    /** Tenant-scoped operator surfaces (campaigns, operations hub, notification admin). */
    public static final String OPERATIONS_HUB_ADMIN =
            "hasAnyAuthority('SCHOOL_OPERATIONS_READ','SCHOOL_OPERATIONS_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String NOTIFICATION_SCHOOL_ADMIN = SCHOOL_COMMUNICATION_WRITE;

    // --- Academic roster (read) / desk admin (write) -------------------------

    /**
     * Read-only academic context: classes, years, sections, subject catalog, student roster GET.
     * Includes student / fee / comms / exam / library / import desk authorities so {@code school_staff} with
     * stacked permissions can load supporting APIs (fees, inbox targeting, exam context, import onboarding)
     * without {@code ACADEMIC_TEACHER} or full {@code SCHOOL_ACADEMIC_READ}.
     */
    public static final String ACADEMIC_ROSTER_READ =
            "hasAnyAuthority("
                    + "'ACADEMIC_TEACHER','SCHOOL_ACADEMIC_READ','SCHOOL_ACADEMIC_WRITE',"
                    + "'SCHOOL_STUDENT_READ','SCHOOL_STUDENT_WRITE',"
                    + "'SCHOOL_FEES_READ','SCHOOL_FEES_WRITE','FEE_STRUCTURES_READ',"
                    + "'SCHOOL_COMMUNICATION_READ','SCHOOL_COMMUNICATION_WRITE',"
                    + "'SCHOOL_EXAMS_READ','SCHOOL_EXAMS_WRITE',"
                    + "'SCHOOL_LIBRARY_READ','SCHOOL_LIBRARY_WRITE','SCHOOL_LIBRARY_MEMBER_READ',"
                    + "'SCHOOL_IMPORT_EXPORT_READ','SCHOOL_IMPORT_EXPORT_WRITE',"
                    + "'TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Structure changes: timetable admin, attendance policies, teacher master, operations hub (not transport/hostel). */
    public static final String ACADEMIC_DESK_ADMIN =
            "hasAnyAuthority('SCHOOL_ACADEMIC_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Transport routes, vehicles, drivers (narrow desk; tenant/platform/admin retain full access). */
    public static final String TRANSPORT_DESK_READ =
            "hasAnyAuthority('SCHOOL_TRANSPORT_READ','SCHOOL_TRANSPORT_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Transport routes, vehicles, drivers (narrow desk; tenant/platform/admin retain full access). */
    public static final String TRANSPORT_DESK_WRITE =
            "hasAnyAuthority('SCHOOL_TRANSPORT_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Hostel blocks, rooms, allocations (narrow desk; tenant/platform/admin retain full access). */
    public static final String HOSTEL_DESK_READ =
            "hasAnyAuthority('SCHOOL_HOSTEL_READ','SCHOOL_HOSTEL_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Hostel blocks, rooms, allocations (narrow desk; tenant/platform/admin retain full access). */
    public static final String HOSTEL_DESK_WRITE =
            "hasAnyAuthority('SCHOOL_HOSTEL_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Hostel billing read lane (plans, mapped students, due run preview/history). */
    public static final String HOSTEL_BILLING_READ =
            "hasAnyAuthority('SCHOOL_HOSTEL_BILLING_READ','SCHOOL_HOSTEL_BILLING_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Hostel billing write lane (plan mapping edits + invoice trigger). */
    public static final String HOSTEL_BILLING_WRITE =
            "hasAnyAuthority('SCHOOL_HOSTEL_BILLING_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Approval lane for hostel leave-out and visitor requests. */
    public static final String HOSTEL_APPROVAL_WRITE =
            "hasAnyAuthority('SCHOOL_HOSTEL_APPROVAL_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Visitor desk lane for check-in/check-out flows. */
    public static final String HOSTEL_VISITOR_WRITE =
            "hasAnyAuthority('SCHOOL_HOSTEL_VISITOR_WRITE','SCHOOL_HOSTEL_APPROVAL_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Incident logging and safety note mutations. */
    public static final String HOSTEL_INCIDENT_WRITE =
            "hasAnyAuthority('SCHOOL_HOSTEL_INCIDENT_WRITE','SCHOOL_HOSTEL_APPROVAL_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Parent/student read-only hostel profile lane. */
    public static final String HOSTEL_PORTAL_READ =
            "hasAnyAuthority('PORTAL_PARENT','PORTAL_STUDENT','SCHOOL_HOSTEL_READ','SCHOOL_HOSTEL_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Student roster and profile read for teachers + student desk admins. */
    public static final String STUDENT_MASTER_READ =
            "hasAnyAuthority('ACADEMIC_TEACHER','SCHOOL_STUDENT_READ','SCHOOL_STUDENT_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Student master CRUD, promotions, ZIP import (not roster read). */
    public static final String STUDENT_MASTER_WRITE =
            "hasAnyAuthority('SCHOOL_STUDENT_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    // --- Library --------------------------------------------------------------

    public static final String LIBRARY_DESK_READ =
            "hasAnyAuthority('SCHOOL_LIBRARY_READ','SCHOOL_LIBRARY_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String LIBRARY_MEMBER_READ =
            "hasAnyAuthority('SCHOOL_LIBRARY_MEMBER_READ','SCHOOL_LIBRARY_READ','SCHOOL_LIBRARY_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String LIBRARY_CATALOG_WRITE =
            "hasAnyAuthority('SCHOOL_LIBRARY_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String LIBRARY_CIRCULATION_ACCESS =
            "hasAnyAuthority('SCHOOL_LIBRARY_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    // --- Audit / directory ----------------------------------------------------

    public static final String AUDIT_LOG_READ =
            "hasAnyAuthority('TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String DIRECTORY_ADMIN = SCHOOL_DIRECTORY_READ;

    // --- Payroll (portal self-service) ---------------------------------------

    public static final String PORTAL_TEACHER_SELF = "hasAuthority('ACADEMIC_TEACHER')";

    public static final String PAYROLL_PAYSLIP_READ =
            "hasAnyAuthority('ACADEMIC_TEACHER','TENANT_ADMIN','PLATFORM_ADMIN','SCHOOL_PAYROLL_READ','SCHOOL_PAYROLL_WRITE')";

    // --- Exams ---------------------------------------------------------------

    /** Exam configuration, approval, publish, admin-only notifications. */
    public static final String EXAM_OFFICE_WRITE =
            "hasAnyAuthority('SCHOOL_EXAMS_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Staff exam list, schedule read, marks read (not parent portal). */
    public static final String EXAM_STAFF_READ =
            "hasAnyAuthority('ACADEMIC_TEACHER','SCHOOL_EXAMS_READ','SCHOOL_EXAMS_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Marks entry and schedule edits (teachers + exam office + tenant admin). */
    public static final String EXAM_MARKS_AND_SCHEDULE_WRITE =
            "hasAnyAuthority('ACADEMIC_TEACHER','SCHOOL_EXAMS_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Report card endpoint also used when a parent session calls staff URL (legacy). */
    public static final String EXAM_REPORT_CARD_VIEW =
            "hasAnyAuthority('ACADEMIC_TEACHER','PORTAL_PARENT','TENANT_ADMIN','PLATFORM_ADMIN')";

    // --- Reports --------------------------------------------------------------

    public static final String REPORT_LIBRARY_DESK =
            "hasAnyAuthority('SCHOOL_REPORTS_READ','SCHOOL_REPORTS_WRITE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String PORTAL_PARENT_SELF = "hasAuthority('PORTAL_PARENT')";

    /**
     * Tenant chat (REST): default campus personas; school employees ({@code LIBRARY_STAFF}/{@code SCHOOL_STAFF})
     * through dedicated chat atoms ({@code SCHOOL_CHAT_READ}/{@code SCHOOL_CHAT_WRITE}).
     */
    public static final String CHAT_TENANT_PARTICIPANT =
            "hasAnyAuthority('SCHOOL_CHAT_READ','SCHOOL_CHAT_WRITE','ACADEMIC_TEACHER','PORTAL_PARENT','PORTAL_STUDENT','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String CHAT_TENANT_PARTICIPANT_WRITE =
            "hasAnyAuthority('SCHOOL_CHAT_WRITE','ACADEMIC_TEACHER','PORTAL_PARENT','PORTAL_STUDENT','TENANT_ADMIN','PLATFORM_ADMIN')";
}
