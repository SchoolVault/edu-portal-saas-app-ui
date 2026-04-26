package com.school.erp.security.rbac;

/**
 * Central {@code @PreAuthorize} SpEL strings so policy can evolve in one place.
 * Kept as {@code public static final} fields for annotation parameters.
 * <p>Phase 1: prefer {@code hasAuthority} for operational access; keep {@code hasAnyRole} only where
 * portal identity is still the practical gate (legacy compatibility). New endpoints should use
 * authorities that match {@link AppPermission} (JWT and slim authority cache paths).</p>
 */
public final class RbacSpel {
    private RbacSpel() {
    }

    /**
     * School-wide communication admin: announcements, campaigns, templates, events.
     * Narrow future roles can gain access via {@code SCHOOL_OPERATIONS_HUB} or {@code TENANT_ADMIN} without portal ADMIN enum.
     */
    public static final String COMMUNICATION_SCHOOL_ADMIN =
            "hasAnyRole('ADMIN','SUPER_ADMIN') or hasAnyAuthority('TENANT_ADMIN','PLATFORM_ADMIN','SCHOOL_OPERATIONS_HUB')";

    /** Guardian lookup used by teachers and admins when linking students. */
    public static final String GUARDIAN_DIRECTORY_READ =
            "hasAnyRole('ADMIN','TEACHER','SUPER_ADMIN') or hasAuthority('ACADEMIC_TEACHER') or hasAnyAuthority('TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Guardian master data writes (registrar / admissions desk). */
    public static final String GUARDIAN_DIRECTORY_WRITE =
            "hasAnyRole('ADMIN','SUPER_ADMIN') or hasAnyAuthority('TENANT_ADMIN','PLATFORM_ADMIN','SCHOOL_STUDENT_MASTER')";

    public static final String SCHOOL_FEE_OFFICE = "hasAnyRole('ADMIN','SUPER_ADMIN') or hasAuthority('SCHOOL_FEE_OFFICE') or hasAnyAuthority('TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String FEE_STRUCTURES_READ = "hasAnyRole('ADMIN','TEACHER','SUPER_ADMIN') or hasAnyAuthority('FEE_STRUCTURES_READ','SCHOOL_FEE_OFFICE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_SETTINGS_FINANCE = "hasAnyRole('ADMIN','SUPER_ADMIN') or hasAuthority('SCHOOL_SETTINGS_FINANCE') or hasAnyAuthority('TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_PAYROLL_OFFICE = "hasAnyRole('ADMIN','SUPER_ADMIN') or hasAuthority('SCHOOL_PAYROLL_OFFICE') or hasAnyAuthority('TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String SCHOOL_TENANT_SETTINGS = "hasAnyRole('ADMIN','SUPER_ADMIN') or hasAnyAuthority('SCHOOL_SETTINGS_CORE','TENANT_ADMIN','PLATFORM_ADMIN')";

    /**
     * Manage per-staff school responsibility role assignments and read catalog.
     * Same access envelope as other school configuration surfaces in phase 1–2.
     */
    public static final String SCHOOL_RBAC_API = "hasAnyRole('ADMIN','SUPER_ADMIN') or hasAnyAuthority('TENANT_ADMIN','PLATFORM_ADMIN')";

    // --- Import / export ----------------------------------------------------

    /** Async jobs, dry-run, header preview, metrics, rollback (not student template download). */
    public static final String IMPORT_EXPORT_JOBS =
            "hasAnyRole('ADMIN','SUPER_ADMIN') or hasAuthority('SCHOOL_IMPORT_EXPORT') or hasAnyAuthority('TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Student roster CSV export (teachers may pull class context templates). */
    public static final String IMPORT_EXPORT_STUDENT_TEMPLATE_READ =
            "hasAnyRole('ADMIN','TEACHER','SUPER_ADMIN') or hasAuthority('ACADEMIC_TEACHER') or hasAuthority('SCHOOL_IMPORT_EXPORT') or hasAnyAuthority('TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Teachers/staff directory export (PII-sensitive). */
    public static final String IMPORT_EXPORT_TEACHER_DIRECTORY_EXPORT =
            "hasAnyRole('ADMIN','SUPER_ADMIN') or hasAuthority('SCHOOL_IMPORT_EXPORT') or hasAnyAuthority('TENANT_ADMIN','PLATFORM_ADMIN')";

    // --- Operations / notifications -----------------------------------------

    /** Tenant-scoped operator surfaces (campaigns, operations hub, notification admin). */
    public static final String OPERATIONS_HUB_ADMIN =
            "hasAnyRole('ADMIN','SUPER_ADMIN') or hasAnyAuthority('TENANT_ADMIN','PLATFORM_ADMIN','SCHOOL_OPERATIONS_HUB')";

    public static final String NOTIFICATION_SCHOOL_ADMIN = OPERATIONS_HUB_ADMIN;

    // --- Academic roster (read) / desk admin (write) -------------------------

    /**
     * Read-only academic context: classes, years, sections, subject catalog, student roster GET.
     * Includes fee / exam / library desk authorities so {@code school_staff} with stacked school roles can load
     * supporting APIs (fees screen, exam scheduling context, librarian directory) without {@code ACADEMIC_TEACHER}.
     */
    public static final String ACADEMIC_ROSTER_READ =
            "hasAnyRole('ADMIN','TEACHER','SUPER_ADMIN') or hasAuthority('ACADEMIC_TEACHER') "
                    + "or hasAnyAuthority('SCHOOL_FEE_OFFICE','FEE_STRUCTURES_READ','SCHOOL_EXAMS_OFFICE',"
                    + "'LIBRARY_MANAGE','LIBRARY_CIRCULATION','SCHOOL_TRANSPORT_DESK','SCHOOL_HOSTEL_DESK',"
                    + "'TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Structure changes: timetable admin, attendance policies, teacher master, operations hub (not transport/hostel). */
    public static final String ACADEMIC_DESK_ADMIN =
            "hasAnyRole('ADMIN','SUPER_ADMIN') or hasAnyAuthority('TENANT_ADMIN','PLATFORM_ADMIN','SCHOOL_OPERATIONS_HUB')";

    /** Transport routes, vehicles, drivers (narrow desk; tenant/platform/admin retain full access). */
    public static final String TRANSPORT_DESK_WRITE =
            "hasAnyRole('ADMIN','SUPER_ADMIN') or hasAuthority('SCHOOL_TRANSPORT_DESK') "
                    + "or hasAnyAuthority('TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Hostel blocks, rooms, allocations (narrow desk; tenant/platform/admin retain full access). */
    public static final String HOSTEL_DESK_WRITE =
            "hasAnyRole('ADMIN','SUPER_ADMIN') or hasAuthority('SCHOOL_HOSTEL_DESK') "
                    + "or hasAnyAuthority('TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Student master CRUD, promotions, ZIP import (not roster read). */
    public static final String STUDENT_MASTER_WRITE =
            "hasAnyRole('ADMIN','SUPER_ADMIN') or hasAuthority('SCHOOL_STUDENT_MASTER') or hasAnyAuthority('TENANT_ADMIN','PLATFORM_ADMIN')";

    // --- Library --------------------------------------------------------------

    public static final String LIBRARY_CATALOG_WRITE =
            "hasAnyRole('ADMIN','SUPER_ADMIN') or hasAuthority('LIBRARY_MANAGE') or hasAnyAuthority('TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String LIBRARY_CIRCULATION_ACCESS =
            "hasAnyRole('ADMIN','SUPER_ADMIN') or hasAnyAuthority('LIBRARY_MANAGE','LIBRARY_CIRCULATION','TENANT_ADMIN','PLATFORM_ADMIN')";

    // --- Audit / directory ----------------------------------------------------

    public static final String AUDIT_LOG_READ =
            "hasAnyRole('ADMIN','SUPER_ADMIN') or hasAnyAuthority('TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String DIRECTORY_ADMIN = ACADEMIC_DESK_ADMIN;

    // --- Payroll (portal self-service) ---------------------------------------

    public static final String PORTAL_TEACHER_SELF = "hasRole('TEACHER')";

    public static final String PAYROLL_PAYSLIP_READ =
            "hasAnyRole('ADMIN','TEACHER','SUPER_ADMIN') or hasAuthority('ACADEMIC_TEACHER') or hasAnyAuthority('TENANT_ADMIN','PLATFORM_ADMIN','SCHOOL_PAYROLL_OFFICE')";

    // --- Exams ---------------------------------------------------------------

    /** Exam configuration, approval, publish, admin-only notifications. */
    public static final String EXAM_OFFICE_WRITE =
            "hasAnyRole('ADMIN','SUPER_ADMIN') or hasAuthority('SCHOOL_EXAMS_OFFICE') or hasAnyAuthority('TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Staff exam list, schedule read, marks read (not parent portal). */
    public static final String EXAM_STAFF_READ =
            "hasAnyRole('ADMIN','TEACHER','SUPER_ADMIN') or hasAuthority('ACADEMIC_TEACHER') "
                    + "or hasAuthority('SCHOOL_EXAMS_OFFICE') or hasAnyAuthority('TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Marks entry and schedule edits (teachers + exam office + tenant admin). */
    public static final String EXAM_MARKS_AND_SCHEDULE_WRITE =
            "hasAnyRole('ADMIN','TEACHER') or hasAuthority('ACADEMIC_TEACHER') or hasAuthority('SCHOOL_EXAMS_OFFICE') "
                    + "or hasAnyAuthority('TENANT_ADMIN','PLATFORM_ADMIN')";

    /** Report card endpoint also used when a parent session calls staff URL (legacy). */
    public static final String EXAM_REPORT_CARD_VIEW =
            "hasAnyRole('ADMIN','TEACHER','SUPER_ADMIN','PARENT') or hasAuthority('ACADEMIC_TEACHER') or hasAuthority('PORTAL_PARENT') or hasAnyAuthority('TENANT_ADMIN','PLATFORM_ADMIN')";

    // --- Reports --------------------------------------------------------------

    public static final String REPORT_LIBRARY_DESK =
            "hasAnyRole('ADMIN','LIBRARY_STAFF','SUPER_ADMIN') or hasAnyAuthority('LIBRARY_MANAGE','TENANT_ADMIN','PLATFORM_ADMIN')";

    public static final String PORTAL_PARENT_SELF = "hasRole('PARENT') or hasAuthority('PORTAL_PARENT')";

    /**
     * Tenant chat (REST): default campus personas; school employees ({@code LIBRARY_STAFF}/{@code SCHOOL_STAFF})
     * only when {@link com.school.erp.security.rbac.AppPermission#PORTAL_CHAT} is assigned (tenant feature + RBAC).
     */
    public static final String CHAT_TENANT_PARTICIPANT =
            "hasAnyRole('ADMIN','TEACHER','PARENT','STUDENT','SUPER_ADMIN') or hasAuthority('PORTAL_CHAT')";
}
