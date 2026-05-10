package com.school.erp.modules.ai.service;

import com.school.erp.modules.ai.service.AiTooling.AiTool;
import com.school.erp.modules.ai.service.AiTooling.ToolContext;
import com.school.erp.modules.ai.service.AiTooling.ToolDefinition;
import com.school.erp.modules.ai.service.AiTooling.ToolResult;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

public final class DefaultAiTools {
    private DefaultAiTools() {}

    @Component
    public static class CountStudentsTool implements AiTool {
        private final AiDomainQueryService domainQueryService;

        public CountStudentsTool(AiDomainQueryService domainQueryService) {
            this.domainQueryService = domainQueryService;
        }

        @Override public ToolDefinition definition() {
            return new ToolDefinition(
                    "CountStudentsTool",
                    "Count enrolled students for tenant, class, or class-section.",
                    List.of("SCHOOL_STUDENT_READ", "SCHOOL_STUDENT_WRITE", "TENANT_ADMIN"),
                    List.of("query"),
                    List.of("How many students are in class 9 section A?", "Total students in class 6"),
                    List.of("Use StudentSearchTool when user asks for individual student profiles"));
        }
        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            String query = normalizeQuery(input);
            Map<String, Object> safeInput = new java.util.HashMap<>(input == null ? Map.of() : input);
            safeInput.putIfAbsent("query", query);
            return new ToolResult("SUCCESS", domainQueryService.countStudents(safeInput), List.of("Show class-wise student distribution"));
        }
    }

    @Component
    public static class GetStudentFeeTool implements AiTool {
        private final AiDomainQueryService domainQueryService;

        public GetStudentFeeTool(AiDomainQueryService domainQueryService) {
            this.domainQueryService = domainQueryService;
        }

        @Override public ToolDefinition definition() {
            return new ToolDefinition(
                    "GetStudentFeeTool",
                    "Fetch pending fee details for specific student/person query.",
                    List.of("SCHOOL_FEES_READ", "SCHOOL_FEES_WRITE", "TENANT_ADMIN"),
                    List.of("query"),
                    List.of("Pending fee for Aarav", "Show dues for student R-102"),
                    List.of("Use GenerateFeeReportTool for month/collection summary"));
        }
        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            String query = normalizeQuery(input);
            return new ToolResult("SUCCESS", domainQueryService.studentFeeDetails(query), List.of("Send reminder to unpaid students"));
        }
    }

    @Component
    public static class GetAttendanceTool implements AiTool {
        private final AiDomainQueryService domainQueryService;

        public GetAttendanceTool(AiDomainQueryService domainQueryService) {
            this.domainQueryService = domainQueryService;
        }

        @Override public ToolDefinition definition() {
            return new ToolDefinition(
                    "GetAttendanceTool",
                    "Get attendance summary and compliance indicators.",
                    List.of("ACADEMIC_TEACHER", "SCHOOL_ACADEMIC_READ", "TENANT_ADMIN"),
                    List.of(),
                    List.of("How many students absent today?"),
                    List.of("Use TeacherAttendanceTool when prompt is about teacher attendance"));
        }
        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            String query = normalizeQuery(input);
            Map<String, Object> safeInput = new java.util.HashMap<>(input == null ? Map.of() : input);
            safeInput.putIfAbsent("query", query);
            return new ToolResult("SUCCESS", domainQueryService.attendanceTodaySummary(safeInput), List.of("Show students below 75% attendance"));
        }
    }

    @Component
    public static class GetTransportDueTool implements AiTool {
        private final AiDomainQueryService domainQueryService;

        public GetTransportDueTool(AiDomainQueryService domainQueryService) {
            this.domainQueryService = domainQueryService;
        }

        @Override public ToolDefinition definition() {
            return new ToolDefinition(
                    "GetTransportDueTool",
                    "Get transport dues by class or route-oriented context.",
                    List.of("SCHOOL_TRANSPORT_READ", "SCHOOL_TRANSPORT_WRITE", "TENANT_ADMIN"),
                    List.of("className"),
                    List.of("Transport dues for class 8"),
                    List.of("Use GenerateFeeReportTool for overall monthly collection figures"));
        }
        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            String className = String.valueOf(input.getOrDefault("className", "All classes"));
            return new ToolResult("SUCCESS", domainQueryService.transportDueSummary(className), List.of("Send transport due reminders"));
        }
    }

    @Component
    public static class GenerateFeeReportTool implements AiTool {
        private final AiDomainQueryService domainQueryService;

        public GenerateFeeReportTool(AiDomainQueryService domainQueryService) {
            this.domainQueryService = domainQueryService;
        }

        @Override public ToolDefinition definition() {
            return new ToolDefinition(
                    "GenerateFeeReportTool",
                    "Generate month-level fee collection and pending summary.",
                    List.of("SCHOOL_REPORTS_READ", "SCHOOL_REPORTS_WRITE", "TENANT_ADMIN"),
                    List.of("month"),
                    List.of("Fee collection summary for April"),
                    List.of("Use GetStudentFeeTool for student-level fee details"));
        }
        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            String month = String.valueOf(input.getOrDefault("month", ""));
            return new ToolResult("SUCCESS", domainQueryService.feeCollectionSummary(month), List.of("Download fee report"));
        }
    }

    @Component
    public static class StudentSearchTool implements AiTool {
        private final AiDomainQueryService domainQueryService;

        public StudentSearchTool(AiDomainQueryService domainQueryService) {
            this.domainQueryService = domainQueryService;
        }

        @Override public ToolDefinition definition() {
            return new ToolDefinition("StudentSearchTool", "Search students by natural language", List.of("SCHOOL_STUDENT_READ", "SCHOOL_STUDENT_WRITE", "TENANT_ADMIN"), List.of("query"), List.of("Show student profile of Rahul"), List.of("Use CountStudentsTool for totals"));
        }
        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            String query = normalizeQuery(input);
            return new ToolResult("SUCCESS", domainQueryService.searchStudents(query), List.of("Open student profile"));
        }
    }

    @Component
    public static class StudentRosterTool implements AiTool {
        private final AiDomainQueryService domainQueryService;

        public StudentRosterTool(AiDomainQueryService domainQueryService) {
            this.domainQueryService = domainQueryService;
        }

        @Override public ToolDefinition definition() {
            return new ToolDefinition(
                    "StudentRosterTool",
                    "List all students for a specific class-section roster.",
                    List.of("SCHOOL_STUDENT_READ", "SCHOOL_STUDENT_WRITE", "TENANT_ADMIN"),
                    List.of("className", "sectionName"),
                    List.of("Show all students from class 8 section A"),
                    List.of("Use StudentSearchTool for individual student lookup"));
        }
        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            return new ToolResult("SUCCESS", domainQueryService.listStudentsByClassSection(input), List.of("Show guardian details for this section"));
        }
    }

    @Component
    public static class StudentGuardianDetailsTool implements AiTool {
        private final AiDomainQueryService domainQueryService;

        public StudentGuardianDetailsTool(AiDomainQueryService domainQueryService) {
            this.domainQueryService = domainQueryService;
        }

        @Override public ToolDefinition definition() {
            return new ToolDefinition(
                    "StudentGuardianDetailsTool",
                    "List guardian/contact details for students in a class-section.",
                    List.of("SCHOOL_STUDENT_READ", "SCHOOL_STUDENT_WRITE", "TENANT_ADMIN"),
                    List.of("className", "sectionName"),
                    List.of("Show guardian details of students from class 9 section A"),
                    List.of("Use StudentRosterTool for only student list without guardian data"));
        }
        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            return new ToolResult("SUCCESS", domainQueryService.listGuardianDetailsByClassSection(input), List.of("Open guardian profile", "Show emergency contacts"));
        }
    }

    @Component
    public static class TeacherSearchTool implements AiTool {
        private final AiDomainQueryService domainQueryService;

        public TeacherSearchTool(AiDomainQueryService domainQueryService) {
            this.domainQueryService = domainQueryService;
        }

        @Override public ToolDefinition definition() {
            return new ToolDefinition("TeacherSearchTool", "Search teacher profile details by natural language", List.of("SCHOOL_ACADEMIC_READ", "SCHOOL_ACADEMIC_WRITE", "TENANT_ADMIN"), List.of("query"), List.of("Show profile of maths teacher"), List.of("Use TeacherWorkloadTool for workload analytics"));
        }
        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            String query = normalizeQuery(input);
            return new ToolResult("SUCCESS", domainQueryService.searchTeachers(query), List.of("Open teacher profile", "Show timetable load"));
        }
    }

    @Component
    public static class TeacherDirectoryTool implements AiTool {
        private final AiDomainQueryService domainQueryService;

        public TeacherDirectoryTool(AiDomainQueryService domainQueryService) {
            this.domainQueryService = domainQueryService;
        }

        @Override public ToolDefinition definition() {
            return new ToolDefinition(
                    "TeacherDirectoryTool",
                    "Teacher directory listing with contacts, status and subject filters.",
                    List.of("SCHOOL_ACADEMIC_READ", "SCHOOL_ACADEMIC_WRITE", "TENANT_ADMIN"),
                    List.of("query"),
                    List.of("Show all teachers", "List math teachers with contact number"),
                    List.of("Use TeacherModuleTool for aggregate teacher KPIs"),
                    true);
        }

        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            return new ToolResult("SUCCESS", domainQueryService.teacherDirectory(input), List.of("Show workload for these teachers"));
        }
    }

    @Component
    public static class TeacherModuleTool implements AiTool {
        private final AiDomainQueryService domainQueryService;

        public TeacherModuleTool(AiDomainQueryService domainQueryService) {
            this.domainQueryService = domainQueryService;
        }

        @Override public ToolDefinition definition() {
            return new ToolDefinition(
                    "TeacherModuleTool",
                    "Teacher module summary including workload, assignment and homeroom coverage.",
                    List.of("SCHOOL_ACADEMIC_READ", "SCHOOL_ACADEMIC_WRITE", "TENANT_ADMIN"),
                    List.of("query"),
                    List.of("Teacher module summary", "Class 8 teacher assignment coverage"),
                    List.of("Use TeacherDirectoryTool for contact listing"),
                    true);
        }

        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            return new ToolResult("SUCCESS", domainQueryService.teacherModuleSummary(input), List.of("Show teacher directory with phone numbers"));
        }
    }

    @Component
    public static class StaffDirectorySearchTool implements AiTool {
        private final AiDomainQueryService domainQueryService;

        public StaffDirectorySearchTool(AiDomainQueryService domainQueryService) {
            this.domainQueryService = domainQueryService;
        }

        @Override public ToolDefinition definition() {
            return new ToolDefinition("StaffDirectorySearchTool", "Search non-teaching staff details by natural language", List.of("SCHOOL_DIRECTORY_READ", "SCHOOL_DIRECTORY_WRITE", "TENANT_ADMIN"), List.of("query"), List.of("Show admin office staff details"), List.of("Use SchoolOverviewTool for aggregate counts"));
        }
        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            String query = normalizeQuery(input);
            return new ToolResult("SUCCESS", domainQueryService.searchOperationalStaff(query), List.of("Open staff profile", "Show attendance records"));
        }
    }

    @Component
    public static class TeacherAttendanceTool implements AiTool {
        private final AiDomainQueryService domainQueryService;

        public TeacherAttendanceTool(AiDomainQueryService domainQueryService) {
            this.domainQueryService = domainQueryService;
        }

        @Override public ToolDefinition definition() {
            return new ToolDefinition("TeacherAttendanceTool", "Find teachers pending attendance mark", List.of("SCHOOL_ACADEMIC_READ", "SCHOOL_ACADEMIC_WRITE", "TENANT_ADMIN"), List.of(), List.of("Which teachers are absent today?"), List.of("Use GetAttendanceTool for student attendance"));
        }
        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            return new ToolResult("SUCCESS", domainQueryService.teacherAttendancePending(),
                    List.of("Send attendance reminder"));
        }
    }

    @Component
    public static class AttendanceManagementTool implements AiTool {
        private final AiDomainQueryService domainQueryService;

        public AttendanceManagementTool(AiDomainQueryService domainQueryService) {
            this.domainQueryService = domainQueryService;
        }

        @Override public ToolDefinition definition() {
            return new ToolDefinition(
                    "AttendanceManagementTool",
                    "Attendance module summary with present/absent trends and class-wise attendance.",
                    List.of("ACADEMIC_TEACHER", "SCHOOL_ACADEMIC_READ", "TENANT_ADMIN"),
                    List.of("query"),
                    List.of("Attendance module summary", "Class-wise attendance this month"),
                    List.of("Use TeacherAttendanceTool for teacher attendance exceptions"),
                    true);
        }

        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            return new ToolResult(
                    "SUCCESS",
                    domainQueryService.attendanceModuleSummary(input == null ? Map.of() : input),
                    List.of("Show below 75% classes", "Show teacher attendance pending"));
        }
    }

    @Component
    public static class TimetableManagementTool implements AiTool {
        private final AiDomainQueryService domainQueryService;

        public TimetableManagementTool(AiDomainQueryService domainQueryService) {
            this.domainQueryService = domainQueryService;
        }

        @Override public ToolDefinition definition() {
            return new ToolDefinition(
                    "TimetableManagementTool",
                    "Timetable module summary for class-section including day-period schedule.",
                    List.of("ACADEMIC_TEACHER", "SCHOOL_ACADEMIC_READ", "TENANT_ADMIN"),
                    List.of("query", "className", "sectionName"),
                    List.of("Show timetable for class 8 section A", "What periods are scheduled for class 10 section B"),
                    List.of("Use TeacherModuleTool for workload/assignment coverage"),
                    true);
        }

        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            return new ToolResult(
                    "SUCCESS",
                    domainQueryService.timetableModuleSummary(input == null ? Map.of() : input),
                    List.of("Show same timetable with teacher contacts"));
        }
    }

    @Component
    public static class HomeworkSummaryTool implements AiTool {
        private final AiDomainQueryService domainQueryService;

        public HomeworkSummaryTool(AiDomainQueryService domainQueryService) {
            this.domainQueryService = domainQueryService;
        }

        @Override public ToolDefinition definition() {
            return new ToolDefinition("HomeworkSummaryTool", "Generate homework completion summary", List.of("ACADEMIC_TEACHER", "SCHOOL_ACADEMIC_READ", "TENANT_ADMIN"), List.of(), List.of("Homework completion summary this week"), List.of("Use SchoolOverviewTool for broader KPIs"));
        }
        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            return new ToolResult("SUCCESS", domainQueryService.homeworkSummary(), List.of("Notify pending students"));
        }
    }

    @Component
    public static class SchoolOverviewTool implements AiTool {
        private final AiDomainQueryService domainQueryService;

        public SchoolOverviewTool(AiDomainQueryService domainQueryService) {
            this.domainQueryService = domainQueryService;
        }

        @Override public ToolDefinition definition() {
            return new ToolDefinition("SchoolOverviewTool", "Get cross-module school KPI snapshot for AI answers", List.of("SCHOOL_REPORTS_READ", "SCHOOL_REPORTS_WRITE", "TENANT_ADMIN"), List.of("scope"), List.of("What is my school name?", "Give school overview"), List.of("Use specialized tools when user asks focused module details"));
        }
        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            Map<String, Object> payload = new java.util.HashMap<>(domainQueryService.schoolOverview());
            payload.put("tenantId", context.tenantId());
            return new ToolResult("SUCCESS", payload,
                    List.of("Show admissions trend", "Show class-wise student count", "Show fee defaulters by class"));
        }
    }

    @Component
    public static class AcademicManagementTool implements AiTool {
        private final AiDomainQueryService domainQueryService;

        public AcademicManagementTool(AiDomainQueryService domainQueryService) {
            this.domainQueryService = domainQueryService;
        }

        @Override public ToolDefinition definition() {
            return new ToolDefinition(
                    "AcademicManagementTool",
                    "Academic management analytics: classes, sections, student strength, homeroom coverage.",
                    List.of("SCHOOL_ACADEMIC_READ", "SCHOOL_ACADEMIC_WRITE", "TENANT_ADMIN"),
                    List.of("query"),
                    List.of("How many classes and sections are there?", "Show student strength class-wise"),
                    List.of("Use StudentRosterTool for full student list of a section"),
                    true);
        }

        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            return new ToolResult(
                    "SUCCESS",
                    domainQueryService.academicManagementSummary(input == null ? Map.of() : input),
                    List.of("Show class-wise student strength", "Show classes without homeroom teacher"));
        }
    }

    @Component
    public static class FeesDefaultersByClassTool implements AiTool {
        private final AiDomainQueryService domainQueryService;

        public FeesDefaultersByClassTool(AiDomainQueryService domainQueryService) {
            this.domainQueryService = domainQueryService;
        }

        @Override public ToolDefinition definition() {
            return new ToolDefinition("FeesDefaultersByClassTool", "Get fee defaulters grouped class-wise", List.of("SCHOOL_FEES_READ", "SCHOOL_FEES_WRITE", "TENANT_ADMIN"), List.of(), List.of("Class-wise fee defaulters"), List.of("Use GetStudentFeeTool for single student dues"));
        }
        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            return new ToolResult("SUCCESS", domainQueryService.feesDefaultersByClass(),
                    List.of("Show top 10 high overdue students", "Draft reminder campaign"));
        }
    }

    @Component
    public static class FeesManagementTool implements AiTool {
        private final AiDomainQueryService domainQueryService;

        public FeesManagementTool(AiDomainQueryService domainQueryService) {
            this.domainQueryService = domainQueryService;
        }

        @Override public ToolDefinition definition() {
            return new ToolDefinition(
                    "FeesManagementTool",
                    "Fees module summary including collection, overdue, and class-wise defaulters.",
                    List.of("SCHOOL_FEES_READ", "SCHOOL_FEES_WRITE", "TENANT_ADMIN"),
                    List.of("query"),
                    List.of("Fees module summary this month", "Show fee collection and defaulters"),
                    List.of("Use GetStudentFeeTool for individual student dues"),
                    true);
        }

        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            return new ToolResult(
                    "SUCCESS",
                    domainQueryService.feesModuleSummary(input == null ? Map.of() : input),
                    List.of("Show defaulters class-wise", "Show pending fee for a student"));
        }
    }

    @Component
    public static class TeacherWorkloadTool implements AiTool {
        private final AiDomainQueryService domainQueryService;

        public TeacherWorkloadTool(AiDomainQueryService domainQueryService) {
            this.domainQueryService = domainQueryService;
        }

        @Override public ToolDefinition definition() {
            return new ToolDefinition("TeacherWorkloadTool", "Get teacher workload distribution and overload risk", List.of("SCHOOL_ACADEMIC_READ", "SCHOOL_ACADEMIC_WRITE", "TENANT_ADMIN"), List.of(), List.of("Teacher periods load"), List.of("Use TeacherSearchTool for profile lookup"), true);
        }
        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            return new ToolResult("SUCCESS", domainQueryService.teacherWorkload(),
                    List.of("Show timetable rebalance suggestions"));
        }
    }

    @Component
    public static class ExamPassRateTool implements AiTool {
        private final AiDomainQueryService domainQueryService;

        public ExamPassRateTool(AiDomainQueryService domainQueryService) {
            this.domainQueryService = domainQueryService;
        }

        @Override public ToolDefinition definition() {
            return new ToolDefinition("ExamPassRateTool", "Get exam pass percentage trends by class and term", List.of("SCHOOL_EXAMS_READ", "SCHOOL_EXAMS_WRITE", "TENANT_ADMIN"), List.of("term"), List.of("Pass rate in term 1"), List.of("Use SchoolOverviewTool for non-exam KPIs"));
        }
        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            String term = String.valueOf(input.getOrDefault("term", ""));
            return new ToolResult("SUCCESS", domainQueryService.examPassRate(term),
                    List.of("Show failed subject clusters", "Compare with previous term"));
        }
    }

    @Component
    public static class ExamsManagementTool implements AiTool {
        private final AiDomainQueryService domainQueryService;

        public ExamsManagementTool(AiDomainQueryService domainQueryService) {
            this.domainQueryService = domainQueryService;
        }

        @Override public ToolDefinition definition() {
            return new ToolDefinition(
                    "ExamsManagementTool",
                    "Exams module summary including exam status, published results, and pass-rate trend.",
                    List.of("SCHOOL_EXAMS_READ", "SCHOOL_EXAMS_WRITE", "TENANT_ADMIN"),
                    List.of("query"),
                    List.of("Exams module summary", "Exam dashboard with pass percentage"),
                    List.of("Use ExamPassRateTool when only pass-rate for a term is needed"),
                    true);
        }

        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            return new ToolResult(
                    "SUCCESS",
                    domainQueryService.examsModuleSummary(input == null ? Map.of() : input),
                    List.of("Show pass rate for term 1", "Show recent completed exams"));
        }
    }

    @Component
    public static class TransportManagementTool implements AiTool {
        private final AiDomainQueryService domainQueryService;

        public TransportManagementTool(AiDomainQueryService domainQueryService) {
            this.domainQueryService = domainQueryService;
        }

        @Override public ToolDefinition definition() {
            return new ToolDefinition(
                    "TransportManagementTool",
                    "Transport module summary with routes, vehicles, drivers, live tracking and dues.",
                    List.of("SCHOOL_TRANSPORT_READ", "SCHOOL_TRANSPORT_WRITE", "TENANT_ADMIN"),
                    List.of("query"),
                    List.of("Transport module summary", "Transport dashboard with routes and dues"),
                    List.of("Use GetTransportDueTool for class-level due count only"),
                    true);
        }

        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            return new ToolResult(
                    "SUCCESS",
                    domainQueryService.transportModuleSummary(input == null ? Map.of() : input),
                    List.of("Show route-wise assigned students", "Show transport dues"));
        }
    }

    @Component
    public static class SettingsManagementTool implements AiTool {
        private final AiDomainQueryService domainQueryService;

        public SettingsManagementTool(AiDomainQueryService domainQueryService) {
            this.domainQueryService = domainQueryService;
        }

        @Override public ToolDefinition definition() {
            return new ToolDefinition(
                    "SettingsManagementTool",
                    "School settings module summary with profile, features, and branches.",
                    List.of("TENANT_ADMIN", "SCHOOL_SETTINGS_WRITE", "SCHOOL_REPORTS_READ"),
                    List.of("query"),
                    List.of("Show school settings summary", "List all school branches"),
                    List.of("Use SchoolOverviewTool for broad KPIs"),
                    true);
        }

        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            return new ToolResult("SUCCESS", domainQueryService.settingsModuleSummary(input == null ? Map.of() : input), List.of("Show feature flags", "Show school branches"));
        }
    }

    @Component
    public static class LeaveManagementTool implements AiTool {
        private final AiDomainQueryService domainQueryService;
        public LeaveManagementTool(AiDomainQueryService domainQueryService) { this.domainQueryService = domainQueryService; }
        @Override public ToolDefinition definition() {
            return new ToolDefinition(
                    "LeaveManagementTool",
                    "Leave module summary with pending, approved, rejected, and policy/balance.",
                    List.of("TENANT_ADMIN", "LEAVE_APPROVE", "LEAVE_SELF"),
                    List.of("query"),
                    List.of("Leave module summary", "How many pending leaves are there?"),
                    List.of("Use SettingsManagementTool for non-leave settings"),
                    true);
        }
        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            return new ToolResult("SUCCESS", domainQueryService.leaveModuleSummary(input == null ? Map.of() : input), List.of("Show pending leaves", "Show my leave balance"));
        }
    }

    @Component
    public static class HostelManagementTool implements AiTool {
        private final AiDomainQueryService domainQueryService;
        public HostelManagementTool(AiDomainQueryService domainQueryService) { this.domainQueryService = domainQueryService; }
        @Override public ToolDefinition definition() {
            return new ToolDefinition(
                    "HostelManagementTool",
                    "Hostel module summary with occupancy, incidents, gate-pass status.",
                    List.of("SCHOOL_HOSTEL_READ", "SCHOOL_HOSTEL_WRITE", "TENANT_ADMIN"),
                    List.of("query"),
                    List.of("Hostel module summary", "How many pending gate passes are there?"),
                    List.of("Use LeaveManagementTool for staff leave workflow"),
                    true);
        }
        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            return new ToolResult("SUCCESS", domainQueryService.hostelModuleSummary(input == null ? Map.of() : input), List.of("Show hostel incidents", "Show occupancy"));
        }
    }

    @Component
    public static class LibraryManagementTool implements AiTool {
        private final AiDomainQueryService domainQueryService;
        public LibraryManagementTool(AiDomainQueryService domainQueryService) { this.domainQueryService = domainQueryService; }
        @Override public ToolDefinition definition() {
            return new ToolDefinition(
                    "LibraryManagementTool",
                    "Library module summary with books, issued and overdue trend.",
                    List.of("SCHOOL_LIBRARY_READ", "SCHOOL_LIBRARY_WRITE", "TENANT_ADMIN"),
                    List.of("query"),
                    List.of("Library module summary", "How many overdue books are there?"),
                    List.of("Use ReportsManagementTool for cross-module analytics"),
                    true);
        }
        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            return new ToolResult("SUCCESS", domainQueryService.libraryModuleSummary(input == null ? Map.of() : input), List.of("Show overdue list", "Show recently issued books"));
        }
    }

    @Component
    public static class AuditManagementTool implements AiTool {
        private final AiDomainQueryService domainQueryService;
        public AuditManagementTool(AiDomainQueryService domainQueryService) { this.domainQueryService = domainQueryService; }
        @Override public ToolDefinition definition() {
            return new ToolDefinition(
                    "AuditManagementTool",
                    "Audit module summary with latest logs and action trail details.",
                    List.of("SCHOOL_AUDIT_READ", "TENANT_ADMIN"),
                    List.of("query"),
                    List.of("Show last 20 audit logs", "Audit logs for latest actions"),
                    List.of("Use ReportsManagementTool for report jobs"),
                    true);
        }
        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            return new ToolResult("SUCCESS", domainQueryService.auditModuleSummary(input == null ? Map.of() : input), List.of("Show last 50 audit logs", "Filter audit by module"));
        }
    }

    @Component
    public static class ReportsManagementTool implements AiTool {
        private final AiDomainQueryService domainQueryService;
        public ReportsManagementTool(AiDomainQueryService domainQueryService) { this.domainQueryService = domainQueryService; }
        @Override public ToolDefinition definition() {
            return new ToolDefinition(
                    "ReportsManagementTool",
                    "Reports module summary with dashboard KPIs, activities, generated reports.",
                    List.of("SCHOOL_REPORTS_READ", "SCHOOL_REPORTS_WRITE", "TENANT_ADMIN"),
                    List.of("query"),
                    List.of("Reports module summary this month", "Show generated reports"),
                    List.of("Use AuditManagementTool for audit trails"),
                    true);
        }
        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            return new ToolResult("SUCCESS", domainQueryService.reportsModuleSummary(input == null ? Map.of() : input), List.of("Show generated reports", "Show dashboard KPIs"));
        }
    }

    @Component
    public static class InboxManagementTool implements AiTool {
        private final AiDomainQueryService domainQueryService;
        public InboxManagementTool(AiDomainQueryService domainQueryService) { this.domainQueryService = domainQueryService; }
        @Override public ToolDefinition definition() {
            return new ToolDefinition(
                    "InboxManagementTool",
                    "Inbox/announcements module summary with unread and timeline items.",
                    List.of("SCHOOL_COMMUNICATION_READ", "SCHOOL_COMMUNICATION_WRITE", "TENANT_ADMIN"),
                    List.of("query"),
                    List.of("Inbox summary", "Show latest announcements and notices"),
                    List.of("Use ReportsManagementTool for analytics-only asks"),
                    true);
        }
        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            return new ToolResult("SUCCESS", domainQueryService.inboxModuleSummary(input == null ? Map.of() : input), List.of("Show unread inbox items", "Show latest notices"));
        }
    }

    @Component
    public static class PayrollPendingApprovalsTool implements AiTool {
        private final AiDomainQueryService domainQueryService;

        public PayrollPendingApprovalsTool(AiDomainQueryService domainQueryService) {
            this.domainQueryService = domainQueryService;
        }

        @Override public ToolDefinition definition() {
            return new ToolDefinition("PayrollPendingApprovalsTool", "Get payroll pending approvals by department", List.of("SCHOOL_PAYROLL_READ", "SCHOOL_PAYROLL_WRITE", "TENANT_ADMIN"), List.of("month"), List.of("Payroll pending approvals this month"), List.of("Use TeacherWorkloadTool for timetable/period-related questions"));
        }
        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            String month = String.valueOf(input.getOrDefault("month", ""));
            return new ToolResult("SUCCESS", domainQueryService.payrollPendingApprovals(month),
                    List.of("Open payroll approvals queue", "Notify approvers"));
        }
    }

    @Component
    public static class PayrollManagementTool implements AiTool {
        private final AiDomainQueryService domainQueryService;

        public PayrollManagementTool(AiDomainQueryService domainQueryService) {
            this.domainQueryService = domainQueryService;
        }

        @Override public ToolDefinition definition() {
            return new ToolDefinition(
                    "PayrollManagementTool",
                    "Payroll module summary with pending approvals, status buckets, and department backlog.",
                    List.of("SCHOOL_PAYROLL_READ", "SCHOOL_PAYROLL_WRITE", "TENANT_ADMIN"),
                    List.of("query"),
                    List.of("Payroll module summary this month", "Payroll dashboard pending and completed"),
                    List.of("Use PayrollPendingApprovalsTool for only pending queue by month"),
                    true);
        }

        @Override public ToolResult execute(ToolContext context, Map<String, Object> input) {
            return new ToolResult(
                    "SUCCESS",
                    domainQueryService.payrollModuleSummary(input == null ? Map.of() : input),
                    List.of("Show pending approvals by department", "Show recent completed payroll attempts"));
        }
    }

    private static String normalizeQuery(Map<String, Object> input) {
        Object q = input == null ? null : input.get("query");
        String query = q == null ? "" : String.valueOf(q).trim();
        if (query.length() > 120) {
            return query.substring(0, 120);
        }
        return query;
    }
}
