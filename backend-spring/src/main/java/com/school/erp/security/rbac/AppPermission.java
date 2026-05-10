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
    /** Fees module read surface: structures, payment lists, ledgers, and collection summary. */
    SCHOOL_FEES_READ,
    /** Fees module write surface: structures CRUD, collections, reminders, and refund workflow actions. */
    SCHOOL_FEES_WRITE,
    /** Settings finance read surface: settlement mode visibility, routing profile, and onboarding status visibility. */
    SCHOOL_SETTINGS_FINANCE_READ,
    /** Settings finance write surface: routing profile updates and onboarding submit/withdraw actions. */
    SCHOOL_SETTINGS_FINANCE_WRITE,
    /** Payroll module read surface: salary structures, payslip lists, and disbursement queue visibility. */
    SCHOOL_PAYROLL_READ,
    /** Payroll module write surface: salary structures, payslip generation, settlements, and disbursement actions. */
    SCHOOL_PAYROLL_WRITE,
    /** Core settings read surface: tenant branding, identity profile, and feature-flag visibility. */
    SCHOOL_SETTINGS_CORE_READ,
    /** Core settings write surface: branding and tenant feature-flag updates. */
    SCHOOL_SETTINGS_CORE_WRITE,
    /** RBAC admin read surface: school role catalog, permission catalog, and current assignments visibility. */
    SCHOOL_RBAC_READ,
    /** RBAC admin write surface: assignment replacement and custom role/permission-pack mutations. */
    SCHOOL_RBAC_WRITE,
    /** Guardian directory read surface: guardian search and profile lookup for student linkage workflows. */
    SCHOOL_GUARDIAN_READ,
    /** Guardian directory write surface: guardian create/update and linkage metadata administration. */
    SCHOOL_GUARDIAN_WRITE,
    /** Student master read surface: student list, profile, and guardian link visibility. */
    SCHOOL_STUDENT_READ,
    /** Student master write surface: admissions CRUD, imports, and promotions. */
    SCHOOL_STUDENT_WRITE,
    /** Exams module read surface: exam cycles, marks views, schedules, and publication snapshots. */
    SCHOOL_EXAMS_READ,
    /** Exams module write surface: templates, workflow approvals, marks entry, schedules, and publication controls. */
    SCHOOL_EXAMS_WRITE,
    /** Import/export module read surface: previews, dry-runs, job history, line outcomes, and template exports. */
    SCHOOL_IMPORT_EXPORT_READ,
    /** Import/export module write surface: queue import jobs and retry failed imports. */
    SCHOOL_IMPORT_EXPORT_WRITE,
    /** Communication module read surface: inbox timeline, announcements feed, events, campaigns analytics/history. */
    SCHOOL_COMMUNICATION_READ,
    /** Communication module write surface: publish announcements/events, queue campaigns, and replay notification dead-letters. */
    SCHOOL_COMMUNICATION_WRITE,
    /** Communication publish lane: announcements/events/campaign/template/dead-letter replay operations. */
    SCHOOL_COMMUNICATION_PUBLISH,
    /** Communication messaging lane: direct teacher-parent/staff message send operations. */
    SCHOOL_COMMUNICATION_MESSAGE_SEND,
    /** Directory module read surface: staff/student/teacher search and tenant-scoped contact discovery. */
    SCHOOL_DIRECTORY_READ,
    /** Directory module write surface: reserved for future directory administration mutations. */
    SCHOOL_DIRECTORY_WRITE,
    /** Documents module read surface: metadata listing and secure downloads. */
    SCHOOL_DOCUMENTS_READ,
    /** Documents module write surface: upload, metadata updates, and lifecycle operations. */
    SCHOOL_DOCUMENTS_WRITE,
    /** Operations hub read surface: visitor/gate/inventory/reminder dashboards and queues. */
    SCHOOL_OPERATIONS_READ,
    /** Operations hub write surface: staff/visitor/gate/inventory/reminder workflow actions. */
    SCHOOL_OPERATIONS_WRITE,
    /** Academic core read surface: classes, sections, assignments, attendance/timetable reads, and leave self-service reads. */
    SCHOOL_ACADEMIC_READ,
    /** Academic core write surface: class/section/assignment mutations, attendance/timetable writes, and leave approvals/policy updates. */
    SCHOOL_ACADEMIC_WRITE,
    /** Transport module read surface: route list, fleet roster, stop views, and live map visibility. */
    SCHOOL_TRANSPORT_READ,
    /** Transport module write surface: create/update/delete routes, stops, assignments, and GPS simulation/reporting. */
    SCHOOL_TRANSPORT_WRITE,
    /** Hostel module read surface: building/room/stats visibility. */
    SCHOOL_HOSTEL_READ,
    /** Hostel module write surface: create/update rooms and allocate/vacate residents. */
    SCHOOL_HOSTEL_WRITE,
    /** Hostel billing read surface: boarding fee profile mapping and invoice run history visibility. */
    SCHOOL_HOSTEL_BILLING_READ,
    /** Hostel billing write surface: boarding fee mapping and invoice trigger actions. */
    SCHOOL_HOSTEL_BILLING_WRITE,
    /** Hostel approval write surface: leave-out/gate-pass and visitor approval decisions. */
    SCHOOL_HOSTEL_APPROVAL_WRITE,
    /** Hostel visitor write surface: visitor log check-in/check-out operations. */
    SCHOOL_HOSTEL_VISITOR_WRITE,
    /** Hostel incident write surface: safety/discipline incident records. */
    SCHOOL_HOSTEL_INCIDENT_WRITE,
    /** Reports module read surface: dashboards, summaries, generated jobs listing, and analytics read APIs. */
    SCHOOL_REPORTS_READ,
    /** Reports module write surface: template/config administration and workflow actions (approve/publish/rollback/process). */
    SCHOOL_REPORTS_WRITE,
    /** Leave self-service read surface: own leave requests, balance, and policy visibility for staff. */
    SCHOOL_LEAVE_SELF_READ,
    /** Leave self-service write surface: create/update own leave requests. */
    SCHOOL_LEAVE_SELF_APPLY,
    /** Leave approval read surface: approver queue and team leave visibility. */
    SCHOOL_LEAVE_APPROVAL_READ,
    /** Leave approval write surface: approve/reject leave and update leave policy. */
    SCHOOL_LEAVE_APPROVAL_WRITE,
    /** Chat module read surface: inbox, conversation history, and role-aware chat directory. */
    SCHOOL_CHAT_READ,
    /** Chat module write surface: create conversations, send messages, and update read receipts. */
    SCHOOL_CHAT_WRITE,

    // --- Read scopes used by several personas --------------------------------
    /**
     * View published fee structure metadata (e.g. teachers seeing applicable fees for a class
     * context; parents use portal-specific APIs gated by parent role + linkage).
     */
    FEE_STRUCTURES_READ,

    /**
     * Fees v2 read lane: ledgers, demands, maps, reports, audit, assignment preview, reconciliation.
     * Narrower than {@link #SCHOOL_FEES_READ} for auditor-style roles.
     */
    FEE_FINANCE_READ,
    /** Fees v2 configuration lane: components, structures, rules, late-fee policies, manual map snapshot. */
    FEE_CONFIG_WRITE,
    /** Fees v2 billing lane: discounts, demand runs, payment recording, rule assignment execute, late-fee runs. */
    FEE_BILLING_WRITE,
    /** Submit refund requests (may enter approval workflow). */
    FEE_REFUND_REQUEST,
    /** Approve pending refunds before ledger posting. */
    FEE_REFUND_APPROVE,
    /** Create Razorpay (or future) checkout sessions against v2 demands. */
    FEE_ONLINE_CHECKOUT,

    // --- Academic staff (teacher baseline) ----------------------------------
    /** Roster, attendance, mark entry, timetable within assigned scope (policy layer applies). */
    ACADEMIC_TEACHER,

    // --- Library ---------------------------------------------------------------
    /** Library module read surface: catalog and issue ledger visibility. */
    SCHOOL_LIBRARY_READ,
    /** Library module write surface: catalog and circulation operations. */
    SCHOOL_LIBRARY_WRITE,
    /** Library member self-service read surface: catalog and own borrow status/history only. */
    SCHOOL_LIBRARY_MEMBER_READ,
    /** Library analytics read surface: KPIs, due reminder previews, and exports. */
    SCHOOL_LIBRARY_ANALYTICS_READ,
    /** Library policy write surface: fine policy and borrower policy governance. */
    SCHOOL_LIBRARY_POLICY_WRITE,
    /** Library reservation write surface: hold queue create/cancel/fulfill actions. */
    SCHOOL_LIBRARY_RESERVATION_WRITE,
    /** Library inventory write surface: accession, loss, write-off, and stock adjustments. */
    SCHOOL_LIBRARY_INVENTORY_WRITE,
    /** Library reminder read surface: due reminder preview and monitoring views. */
    SCHOOL_LIBRARY_REMINDER_READ,

    // --- Portals (reserved for future JWT claims; may stay empty in phase 1) -
    /**
     * Baseline signed-in school employee (not parent/student): profile, school-wide comms shell, and
     * modules granted via stacked {@code rbac_user_school_role} assignments. Big-ERP analogue of
     * “employee” before duty roles are applied.
     */
    PORTAL_SCHOOL_STAFF,
    PORTAL_PARENT,
    PORTAL_STUDENT
}
