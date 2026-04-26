package com.school.erp.security.rbac;

/**
 * Atomic Spring Security authorities (JWT {@code permissions} claim and {@code hasAuthority} checks).
 * <p>
 * <b>Phase 1</b> maps the legacy single {@code users.role} enum to default permission bundles here.
 * Later phases attach these via {@code user_roles} / DB without renaming codes — stable API contract.
 * </p>
 */
public enum AppPermission {
    // --- Platform (SaaS operator) -------------------------------------------
    /** Cross-tenant / platform console operations. */
    PLATFORM_ADMIN,

    // --- Tenant / school configuration --------------------------------------
    /**
     * Broad tenant configuration: user directory, feature toggles touchpoints, school settings that
     * are not product-specific to one module. Bundled with school admin in phase 1.
     */
    TENANT_ADMIN,

    // --- School back-office (replace monolithic ADMIN over time) ------------
    /**
     * Fee office: fee structures, assignments, collection, reports, refund workflow — current
     * school-side fee module scope. Future fee-only staff receive this without full {@link #TENANT_ADMIN}.
     */
    SCHOOL_FEE_OFFICE,
    /** Settings → finance profile, payment routing, settlement onboarding. */
    SCHOOL_SETTINGS_FINANCE,
    /** Salary structures, payslips, disbursement (school payroll desk). */
    SCHOOL_PAYROLL_OFFICE,
    /**
     * Core tenant settings API surface (branding, school code, feature-related config exposed under
     * {@code /api/v1/settings} for admins).
     */
    SCHOOL_SETTINGS_CORE,
    /** Full student master / promotions — administration desk (future narrow roles). */
    SCHOOL_STUDENT_MASTER,
    /** Examination cycles, results publication — exam office (future exam coordinator). */
    SCHOOL_EXAMS_OFFICE,
    /** Data import / export pipelines for administrators. */
    SCHOOL_IMPORT_EXPORT,
    /** Operations hub (admissions office style workflows). */
    SCHOOL_OPERATIONS_HUB,
    /** Transport desk: routes, vehicles, drivers (narrow duty; stack with hostel or use combined catalog role). */
    SCHOOL_TRANSPORT_DESK,
    /** Hostel desk: blocks, rooms, allocations (narrow duty; stack with transport or use combined catalog role). */
    SCHOOL_HOSTEL_DESK,
    /** School-scoped report endpoints not covered by a finer permission yet. */
    SCHOOL_REPORTS_SCHOOL,

    // --- Read scopes used by several personas --------------------------------
    /**
     * View published fee structure metadata (e.g. teachers seeing applicable fees for a class
     * context; parents use portal-specific APIs gated by parent role + linkage).
     */
    FEE_STRUCTURES_READ,

    // --- Academic staff (teacher baseline) ----------------------------------
    /** Roster, attendance, mark entry, timetable within assigned scope (policy layer applies). */
    ACADEMIC_TEACHER,

    // --- Library (authorities also issued historically; keep codes stable) ----
    LIBRARY_MANAGE,
    LIBRARY_CIRCULATION,

    // --- Portals (reserved for future JWT claims; may stay empty in phase 1) -
    /**
     * Baseline signed-in school employee (not parent/student): profile, school-wide comms shell, and
     * modules granted via stacked {@code rbac_user_school_role} assignments. Big-ERP analogue of
     * “employee” before duty roles are applied.
     */
    PORTAL_SCHOOL_STAFF,
    /**
     * Optional tenant chat for school employees: assign via school roles when a school enables chat
     * for non-teaching staff. Parents/teachers/admins/students use role-based chat gates instead.
     */
    PORTAL_CHAT,
    PORTAL_PARENT,
    PORTAL_STUDENT
}
