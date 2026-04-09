package com.school.erp.common.enums;

public class Enums {

    public enum Role {
        SUPER_ADMIN, ADMIN, TEACHER, PARENT, STUDENT
    }

    public enum Gender {
        MALE, FEMALE, OTHER
    }

    public enum StudentStatus {
        ACTIVE, INACTIVE, GRADUATED, TRANSFERRED
    }

    public enum TeacherStatus {
        ACTIVE, INACTIVE, ON_LEAVE, RESIGNED
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
        TUITION, TRANSPORT, LIBRARY, LAB, SPORTS, MISC
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
}
