package com.school.erp.common.enums;

public class Enums {

    public enum Role {
        SUPER_ADMIN, ADMIN, TEACHER, PARENT, STUDENT, LIBRARY_STAFF
    }

    /** Registered fleet types for transport (extensible). */
    public enum VehicleType {
        BUS, VAN, CAR, OTHER
    }

    public enum Gender {
        MALE, FEMALE, OTHER
    }

    public enum StudentStatus {
        ACTIVE, INACTIVE, GRADUATED, TRANSFERRED, ALUMNI
    }

    /** Role of a guardian/parent relative to the student (mapping metadata). */
    public enum GuardianRelationType {
        FATHER, MOTHER, GUARDIAN, OTHER
    }

    public enum TeacherStatus {
        ACTIVE, INACTIVE, ON_LEAVE, RESIGNED
    }

    /** Staff who may run library catalog & circulation (JWT adds LIBRARY_* authorities). */
    public enum LibraryStaffRole {
        ASSISTANT, LIBRARIAN, HEAD
    }

    public enum AttendanceStatus {
        PRESENT, ABSENT, LATE, EXCUSED
    }

    public enum ExamStatus {
        UPCOMING, ONGOING, COMPLETED, CANCELLED
    }

    public enum FeeStatus {
        PAID, PARTIAL, UNPAID, OVERDUE
    }

    public enum FeeComponentType {
        TUITION, TRANSPORT, HOSTEL, UNIFORM, LIBRARY, LAB, SPORTS, MISC
    }

    public enum BookIssueStatus {
        ISSUED, RETURNED, OVERDUE
    }

    public enum HostelRoomType {
        SINGLE, DOUBLE, TRIPLE, DORMITORY
    }

    public enum PayslipStatus {
        GENERATED, PAID
    }

    public enum SalaryComponentType {
        ALLOWANCE, DEDUCTION
    }

    public enum AuditAction {
        CREATE, UPDATE, DELETE, LOGIN, LOGOUT
    }

    public enum NotificationType {
        INFO, WARNING, SUCCESS, ERROR
    }

    public enum TargetAudience {
        ALL, TEACHERS, PARENTS, CLASS, SECTION
    }

    public enum DayOfWeek {
        MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY
    }

    public enum HostelAllocationStatus {
        ACTIVE, VACATED
    }

    public enum DocumentCategory {
        STUDENT, TEACHER, ADMIN, GENERAL
    }

    public enum DocumentOwnerType {
        STUDENT, CLASS, TEACHER, GLOBAL
    }

    public enum DocumentVisibilityScope {
        PRIVATE, CLASS, SECTION, SCHOOL
    }

    public enum LeaveStatus {
        PENDING, APPROVED, REJECTED, CANCELLED
    }

    /** Full day vs half-day sessions for leave requests. */
    public enum LeaveDayUnit {
        FULL_DAY, FIRST_HALF, SECOND_HALF
    }

    /**
     * Stable leave-type codes stored in {@code leave_requests.leave_type} and exchanged in JSON.
     * UI maps these to i18n keys ({@code leave.type.&lt;CODE&gt;}); do not persist localized labels.
     */
    public enum LeaveTypeCode {
        ANNUAL,
        SICK,
        CASUAL,
        EMERGENCY,
        /** Free-form category; {@code reason} must describe the leave (validated in service). */
        OTHER
    }

    /** Fee / checkout attempt lifecycle for gateways and retries. */
    public enum PaymentAttemptStatus {
        CREATED, PAID, FAILED, EXPIRED
    }

    public enum HostelOccupancyStatus {
        AVAILABLE, FULL, MAINTENANCE, RESERVED
    }
}
