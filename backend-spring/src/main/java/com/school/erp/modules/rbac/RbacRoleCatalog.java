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
                    "PORTAL_SCHOOL_STAFF,SCHOOL_LIBRARY_MEMBER_READ",
                    true),
            new DefaultSchoolRole(
                    "STAFF_MESSAGING",
                    "Staff messaging (chat)",
                    "Optional tenant chat for non-teaching employees when the school enables chat for staff.",
                    6,
                    "SCHOOL_CHAT_READ,SCHOOL_CHAT_WRITE",
                    true),
            new DefaultSchoolRole(
                    "SCHOOL_FULL_ADMIN",
                    "Full school administration",
                    "Configuration, users, fees, payroll, exams, import/export, and school reports (typical principal office / head admin).",
                    10,
                    "TENANT_ADMIN,SCHOOL_FEES_READ,SCHOOL_FEES_WRITE,SCHOOL_SETTINGS_FINANCE_READ,SCHOOL_SETTINGS_FINANCE_WRITE,"
                            + "SCHOOL_PAYROLL_READ,SCHOOL_PAYROLL_WRITE,SCHOOL_SETTINGS_CORE_READ,SCHOOL_SETTINGS_CORE_WRITE,"
                            + "SCHOOL_GUARDIAN_READ,SCHOOL_GUARDIAN_WRITE,SCHOOL_STUDENT_READ,SCHOOL_STUDENT_WRITE,"
                            + "SCHOOL_EXAMS_READ,SCHOOL_EXAMS_WRITE,SCHOOL_IMPORT_EXPORT_READ,SCHOOL_IMPORT_EXPORT_WRITE,"
                            + "SCHOOL_COMMUNICATION_READ,SCHOOL_COMMUNICATION_WRITE,SCHOOL_COMMUNICATION_PUBLISH,SCHOOL_COMMUNICATION_MESSAGE_SEND,"
                            + "SCHOOL_DOCUMENTS_READ,SCHOOL_DOCUMENTS_WRITE,"
                            + "SCHOOL_OPERATIONS_READ,SCHOOL_OPERATIONS_WRITE,SCHOOL_ACADEMIC_READ,SCHOOL_ACADEMIC_WRITE,"
                            + "SCHOOL_RBAC_READ,SCHOOL_RBAC_WRITE,SCHOOL_CHAT_READ,SCHOOL_CHAT_WRITE,"
                            + "SCHOOL_DIRECTORY_READ,SCHOOL_DIRECTORY_WRITE,"
                            + "SCHOOL_TRANSPORT_READ,SCHOOL_TRANSPORT_WRITE,"
                            + "SCHOOL_HOSTEL_READ,SCHOOL_HOSTEL_WRITE,SCHOOL_HOSTEL_BILLING_READ,SCHOOL_HOSTEL_BILLING_WRITE,"
                            + "SCHOOL_HOSTEL_APPROVAL_WRITE,SCHOOL_HOSTEL_VISITOR_WRITE,SCHOOL_HOSTEL_INCIDENT_WRITE,"
                            + "SCHOOL_LIBRARY_READ,SCHOOL_LIBRARY_WRITE,"
                            + "SCHOOL_LIBRARY_ANALYTICS_READ,SCHOOL_LIBRARY_POLICY_WRITE,SCHOOL_LIBRARY_RESERVATION_WRITE,SCHOOL_LIBRARY_INVENTORY_WRITE,SCHOOL_LIBRARY_REMINDER_READ,"
                            + "SCHOOL_LEAVE_SELF_READ,SCHOOL_LEAVE_SELF_APPLY,SCHOOL_LEAVE_APPROVAL_READ,SCHOOL_LEAVE_APPROVAL_WRITE,"
                            + "SCHOOL_REPORTS_READ,SCHOOL_REPORTS_WRITE,FEE_STRUCTURES_READ,"
                            + "FEE_FINANCE_READ,FEE_CONFIG_WRITE,FEE_BILLING_WRITE,FEE_REFUND_REQUEST,FEE_REFUND_APPROVE,FEE_ONLINE_CHECKOUT",
                    true),
            new DefaultSchoolRole(
                    "ACADEMIC_STAFF",
                    "Academic staff",
                    "Teaching: roster, attendance, marks, timetabled scope; read fee structures for class context.",
                    20,
                    "ACADEMIC_TEACHER,FEE_STRUCTURES_READ,SCHOOL_LIBRARY_MEMBER_READ,SCHOOL_LEAVE_SELF_READ,SCHOOL_LEAVE_SELF_APPLY",
                    true),
            new DefaultSchoolRole(
                    "ACADEMIC_ADMIN_DESK",
                    "Academic administration desk",
                    "Class/section setup, class-teacher assignments, timetable and promotion workflows.",
                    25,
                    "SCHOOL_ACADEMIC_READ,SCHOOL_ACADEMIC_WRITE,SCHOOL_LEAVE_APPROVAL_READ,SCHOOL_LEAVE_APPROVAL_WRITE,FEE_STRUCTURES_READ",
                    true),
            new DefaultSchoolRole(
                    "COMMUNICATION_DESK",
                    "Communication & notification desk",
                    "Announcements, campaigns, inbox operations analytics, and notification delivery retries.",
                    28,
                    "SCHOOL_COMMUNICATION_READ,SCHOOL_COMMUNICATION_WRITE,SCHOOL_COMMUNICATION_PUBLISH,SCHOOL_COMMUNICATION_MESSAGE_SEND",
                    true),
            new DefaultSchoolRole(
                    "OPERATIONS_DESK",
                    "Operations hub desk",
                    "Visitors, gate passes, inventory, and reminder workflow operations.",
                    27,
                    "SCHOOL_OPERATIONS_READ,SCHOOL_OPERATIONS_WRITE",
                    true),
            new DefaultSchoolRole(
                    "DIRECTORY_DESK",
                    "Directory desk",
                    "Search and manage school directory scope for people lookup workflows.",
                    29,
                    "SCHOOL_DIRECTORY_READ,SCHOOL_DIRECTORY_WRITE",
                    true),
            new DefaultSchoolRole(
                    "FEE_OFFICE",
                    "Fee & accounts desk",
                    "Record collections, fee structures, reminders, and fee-side reports without full tenant admin.",
                    30,
                    "SCHOOL_FEES_READ,SCHOOL_FEES_WRITE,FEE_STRUCTURES_READ,"
                            + "FEE_FINANCE_READ,FEE_CONFIG_WRITE,FEE_BILLING_WRITE,FEE_REFUND_REQUEST,FEE_REFUND_APPROVE,FEE_ONLINE_CHECKOUT",
                    true),
            new DefaultSchoolRole(
                    "PAYROLL_OFFICE",
                    "Payroll & salary desk",
                    "Salary structures, payslips, and disbursement operations.",
                    40,
                    "SCHOOL_PAYROLL_READ,SCHOOL_PAYROLL_WRITE,FEE_STRUCTURES_READ",
                    true),
            new DefaultSchoolRole(
                    "EXAM_OFFICE",
                    "Examination cell",
                    "Exam cycles, timetables where applicable, and school exam reports.",
                    50,
                    "SCHOOL_EXAMS_READ,SCHOOL_EXAMS_WRITE,SCHOOL_REPORTS_READ,FEE_STRUCTURES_READ",
                    true),
            new DefaultSchoolRole(
                    "LIBRARY_OPERATIONS",
                    "Library operations",
                    "Catalog, circulation, and accruals tied to the library module.",
                    60,
                    "SCHOOL_LIBRARY_READ,SCHOOL_LIBRARY_WRITE,SCHOOL_LIBRARY_ANALYTICS_READ,SCHOOL_LIBRARY_POLICY_WRITE,SCHOOL_LIBRARY_RESERVATION_WRITE,SCHOOL_LIBRARY_INVENTORY_WRITE,SCHOOL_LIBRARY_REMINDER_READ,FEE_STRUCTURES_READ",
                    true),
            new DefaultSchoolRole(
                    "TENANT_SETTINGS",
                    "School settings & finance profile",
                    "Branding, feature flags, and payment routing / finance profile. Does not grant full tenant admin; "
                            + "assign school admin or TENANT_ADMIN for RBAC and other desks.",
                    70,
                    "SCHOOL_SETTINGS_CORE_READ,SCHOOL_SETTINGS_CORE_WRITE,SCHOOL_SETTINGS_FINANCE_READ,SCHOOL_SETTINGS_FINANCE_WRITE,FEE_STRUCTURES_READ",
                    true),
            new DefaultSchoolRole(
                    "TRANSPORT_LOGISTICS",
                    "Transport logistics desk",
                    "Routes, vehicles, and drivers only. Stack HOSTEL_RESIDENCE_DESK or assign combined "
                            + "TRANSPORT_HOSTEL_LOGISTICS for one-person schools.",
                    75,
                    "SCHOOL_TRANSPORT_READ,SCHOOL_TRANSPORT_WRITE,FEE_STRUCTURES_READ",
                    true),
            new DefaultSchoolRole(
                    "HOSTEL_RESIDENCE_DESK",
                    "Hostel & residence desk",
                    "Hostel blocks, rooms, and allocations. Stack TRANSPORT_LOGISTICS or use combined "
                            + "TRANSPORT_HOSTEL_LOGISTICS.",
                    76,
                    "SCHOOL_HOSTEL_READ,SCHOOL_HOSTEL_WRITE,SCHOOL_HOSTEL_BILLING_READ,SCHOOL_HOSTEL_BILLING_WRITE,"
                            + "SCHOOL_HOSTEL_APPROVAL_WRITE,SCHOOL_HOSTEL_VISITOR_WRITE,SCHOOL_HOSTEL_INCIDENT_WRITE,FEE_STRUCTURES_READ",
                    true),
            new DefaultSchoolRole(
                    "HOSTEL_WARDEN_DESK",
                    "Hostel warden desk",
                    "Daily hostel operations: leave-out approvals, visitor approvals, and incident logging.",
                    76,
                    "SCHOOL_HOSTEL_READ,SCHOOL_HOSTEL_APPROVAL_WRITE,SCHOOL_HOSTEL_VISITOR_WRITE,SCHOOL_HOSTEL_INCIDENT_WRITE",
                    true),
            new DefaultSchoolRole(
                    "HOSTEL_ACCOUNTS_DESK",
                    "Hostel accounts desk",
                    "Hostel billing mapping, boarding dues runs, and payer-facing hostel fee desk operations.",
                    77,
                    "SCHOOL_HOSTEL_BILLING_READ,SCHOOL_HOSTEL_BILLING_WRITE,SCHOOL_FEES_READ,SCHOOL_FEES_WRITE,FEE_STRUCTURES_READ",
                    true),
            new DefaultSchoolRole(
                    "TRANSPORT_HOSTEL_LOGISTICS",
                    "Transport & hostel desk (combined pack)",
                    "Both transport and hostel atoms for schools that assign a single desk officer; "
                            + "custom roles can bundle the two permissions the same way.",
                    78,
                    "SCHOOL_TRANSPORT_READ,SCHOOL_TRANSPORT_WRITE,"
                            + "SCHOOL_HOSTEL_READ,SCHOOL_HOSTEL_WRITE,SCHOOL_HOSTEL_BILLING_READ,SCHOOL_HOSTEL_BILLING_WRITE,"
                            + "SCHOOL_HOSTEL_APPROVAL_WRITE,SCHOOL_HOSTEL_VISITOR_WRITE,SCHOOL_HOSTEL_INCIDENT_WRITE,FEE_STRUCTURES_READ",
                    true));

    public static final String CODE_BASE_SCHOOL_STAFF = "BASE_SCHOOL_STAFF";
    public static final String CODE_STAFF_MESSAGING = "STAFF_MESSAGING";
    public static final String CODE_SCHOOL_FULL_ADMIN = "SCHOOL_FULL_ADMIN";
    public static final String CODE_ACADEMIC_STAFF = "ACADEMIC_STAFF";
    public static final String CODE_ACADEMIC_ADMIN_DESK = "ACADEMIC_ADMIN_DESK";
    public static final String CODE_OPERATIONS_DESK = "OPERATIONS_DESK";
    public static final String CODE_COMMUNICATION_DESK = "COMMUNICATION_DESK";
    public static final String CODE_DIRECTORY_DESK = "DIRECTORY_DESK";
    public static final String CODE_FEE_OFFICE = "FEE_OFFICE";
    public static final String CODE_PAYROLL_OFFICE = "PAYROLL_OFFICE";
    public static final String CODE_EXAM_OFFICE = "EXAM_OFFICE";
    public static final String CODE_LIBRARY_OPERATIONS = "LIBRARY_OPERATIONS";
    public static final String CODE_TENANT_SETTINGS = "TENANT_SETTINGS";
    public static final String CODE_TRANSPORT_LOGISTICS = "TRANSPORT_LOGISTICS";
    public static final String CODE_HOSTEL_RESIDENCE_DESK = "HOSTEL_RESIDENCE_DESK";
    public static final String CODE_HOSTEL_WARDEN_DESK = "HOSTEL_WARDEN_DESK";
    public static final String CODE_HOSTEL_ACCOUNTS_DESK = "HOSTEL_ACCOUNTS_DESK";
    /** Combined catalog template; stable code for migrations and BNDL_R* bundle linkage. */
    public static final String CODE_TRANSPORT_HOSTEL_LOGISTICS = "TRANSPORT_HOSTEL_LOGISTICS";
}
