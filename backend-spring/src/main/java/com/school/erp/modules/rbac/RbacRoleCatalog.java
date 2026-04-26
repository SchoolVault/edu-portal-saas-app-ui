package com.school.erp.modules.rbac;

import java.util.List;

/**
 * Default per-tenant school role templates (code + human label + {@link com.school.erp.security.rbac.AppPermission} CSV).
 * Seeded idempotently for every school workspace; extended in later phases with custom rows.
 */
public final class RbacRoleCatalog {
    private RbacRoleCatalog() {
    }

    public record DefaultSchoolRole(
            String code,
            String name,
            String description,
            int sortOrder,
            String permissionsCsv,
            boolean systemRole) {
    }

    public static final List<DefaultSchoolRole> TEMPLATES = List.of(
            new DefaultSchoolRole(
                    "BASE_SCHOOL_STAFF",
                    "Base school staff",
                    "Minimal employee portal (profile, school-wide comms shell). Stack LIBRARY_OPERATIONS, FEE_OFFICE, "
                            + "ACADEMIC_STAFF, etc. for each duty.",
                    5,
                    "PORTAL_SCHOOL_STAFF",
                    true),
            new DefaultSchoolRole(
                    "STAFF_MESSAGING",
                    "Staff messaging (chat)",
                    "Optional tenant chat for non-teaching employees when the school enables chat for staff.",
                    6,
                    "PORTAL_CHAT",
                    true),
            new DefaultSchoolRole(
                    "SCHOOL_FULL_ADMIN",
                    "Full school administration",
                    "Configuration, users, fees, payroll, exams, import/export, and school reports (typical principal office / head admin).",
                    10,
                    "TENANT_ADMIN,SCHOOL_FEE_OFFICE,SCHOOL_SETTINGS_FINANCE,SCHOOL_PAYROLL_OFFICE,SCHOOL_SETTINGS_CORE,"
                            + "SCHOOL_STUDENT_MASTER,SCHOOL_EXAMS_OFFICE,SCHOOL_IMPORT_EXPORT,SCHOOL_OPERATIONS_HUB,"
                            + "SCHOOL_TRANSPORT_DESK,SCHOOL_HOSTEL_DESK,SCHOOL_REPORTS_SCHOOL,FEE_STRUCTURES_READ",
                    true),
            new DefaultSchoolRole(
                    "ACADEMIC_STAFF",
                    "Academic staff",
                    "Teaching: roster, attendance, marks, timetabled scope; read fee structures for class context.",
                    20,
                    "ACADEMIC_TEACHER,FEE_STRUCTURES_READ",
                    true),
            new DefaultSchoolRole(
                    "FEE_OFFICE",
                    "Fee & accounts desk",
                    "Record collections, fee structures, reminders, and fee-side reports without full tenant admin.",
                    30,
                    "SCHOOL_FEE_OFFICE,FEE_STRUCTURES_READ",
                    true),
            new DefaultSchoolRole(
                    "PAYROLL_OFFICE",
                    "Payroll & salary desk",
                    "Salary structures, payslips, and disbursement operations.",
                    40,
                    "SCHOOL_PAYROLL_OFFICE,FEE_STRUCTURES_READ",
                    true),
            new DefaultSchoolRole(
                    "EXAM_OFFICE",
                    "Examination cell",
                    "Exam cycles, timetables where applicable, and school exam reports.",
                    50,
                    "SCHOOL_EXAMS_OFFICE,SCHOOL_REPORTS_SCHOOL,FEE_STRUCTURES_READ",
                    true),
            new DefaultSchoolRole(
                    "LIBRARY_OPERATIONS",
                    "Library operations",
                    "Catalog, circulation, and accruals tied to the library module.",
                    60,
                    "LIBRARY_MANAGE,LIBRARY_CIRCULATION,FEE_STRUCTURES_READ",
                    true),
            new DefaultSchoolRole(
                    "TENANT_SETTINGS",
                    "School settings & finance profile",
                    "Branding, feature flags, and payment routing / finance profile. Does not grant full tenant admin; "
                            + "assign school admin or TENANT_ADMIN for RBAC and other desks.",
                    70,
                    "SCHOOL_SETTINGS_CORE,SCHOOL_SETTINGS_FINANCE,FEE_STRUCTURES_READ",
                    true),
            new DefaultSchoolRole(
                    "TRANSPORT_LOGISTICS",
                    "Transport logistics desk",
                    "Routes, vehicles, and drivers only. Stack HOSTEL_RESIDENCE_DESK or assign combined "
                            + "TRANSPORT_HOSTEL_LOGISTICS for one-person schools.",
                    75,
                    "SCHOOL_TRANSPORT_DESK,FEE_STRUCTURES_READ",
                    true),
            new DefaultSchoolRole(
                    "HOSTEL_RESIDENCE_DESK",
                    "Hostel & residence desk",
                    "Hostel blocks, rooms, and allocations. Stack TRANSPORT_LOGISTICS or use combined "
                            + "TRANSPORT_HOSTEL_LOGISTICS.",
                    76,
                    "SCHOOL_HOSTEL_DESK,FEE_STRUCTURES_READ",
                    true),
            new DefaultSchoolRole(
                    "TRANSPORT_HOSTEL_LOGISTICS",
                    "Transport & hostel desk (combined pack)",
                    "Both transport and hostel atoms for schools that assign a single desk officer; "
                            + "custom roles can bundle the two permissions the same way.",
                    77,
                    "SCHOOL_TRANSPORT_DESK,SCHOOL_HOSTEL_DESK,FEE_STRUCTURES_READ",
                    true));

    public static final String CODE_BASE_SCHOOL_STAFF = "BASE_SCHOOL_STAFF";
    public static final String CODE_STAFF_MESSAGING = "STAFF_MESSAGING";
    public static final String CODE_SCHOOL_FULL_ADMIN = "SCHOOL_FULL_ADMIN";
    public static final String CODE_ACADEMIC_STAFF = "ACADEMIC_STAFF";
    public static final String CODE_FEE_OFFICE = "FEE_OFFICE";
    public static final String CODE_PAYROLL_OFFICE = "PAYROLL_OFFICE";
    public static final String CODE_EXAM_OFFICE = "EXAM_OFFICE";
    public static final String CODE_LIBRARY_OPERATIONS = "LIBRARY_OPERATIONS";
    public static final String CODE_TENANT_SETTINGS = "TENANT_SETTINGS";
    public static final String CODE_TRANSPORT_LOGISTICS = "TRANSPORT_LOGISTICS";
    public static final String CODE_HOSTEL_RESIDENCE_DESK = "HOSTEL_RESIDENCE_DESK";
    /** Combined catalog template; stable code for migrations and BNDL_R* bundle linkage. */
    public static final String CODE_TRANSPORT_HOSTEL_LOGISTICS = "TRANSPORT_HOSTEL_LOGISTICS";
}
