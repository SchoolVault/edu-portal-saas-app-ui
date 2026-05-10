package com.school.erp.modules.ai.service;

import com.school.erp.modules.ai.service.AiTooling.ToolContext;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class MultiModuleToolSelectionEvalTest {

    @Test
    void shouldScoreMultiModuleRoutingOver200Prompts() {
        MockRuleBasedLlmProvider provider = new MockRuleBasedLlmProvider();
        ToolContext context = new ToolContext("tenant-a", 1L, "ADMIN", "en", "ai-assistant");
        List<EvalCase> cases = buildCases();

        int matched = 0;
        List<String> failures = new ArrayList<>();
        for (EvalCase tc : cases) {
            String actual = provider.plan(tc.prompt(), context, List.of()).toolCalls().get(0).toolName();
            if (tc.expected().equals(actual)) {
                matched++;
            } else {
                failures.add("Prompt: \"" + tc.prompt() + "\" expected=" + tc.expected() + " actual=" + actual);
            }
        }
        double accuracy = cases.isEmpty() ? 0 : (matched * 100.0 / cases.size());
        System.out.println("Multi-module prompts: " + cases.size());
        System.out.println("Multi-module matched: " + matched);
        System.out.println("Multi-module routing accuracy: " + String.format("%.2f", accuracy) + "%");
        if (!failures.isEmpty()) {
            System.out.println("Sample routing misses:");
            failures.stream().limit(30).forEach(System.out::println);
        }
        Assertions.assertTrue(cases.size() >= 200, "Expected at least 200 varied prompts");
    }

    private List<EvalCase> buildCases() {
        List<EvalCase> c = new ArrayList<>();

        // Teacher
        addAll(c, "TeacherDirectoryTool",
                "show all teachers", "teacher directory", "teacher contacts", "show their phone", "same teachers email");
        addAll(c, "TeacherModuleTool",
                "teacher module summary", "class teacher assignment coverage", "teacher workload by class", "homeroom coverage class 8");
        addAll(c, "TeacherSearchTool",
                "teacher profile of anita", "show teacher details", "faculty information");
        addAll(c, "TeacherAttendanceTool",
                "teacher attendance pending", "which teachers are absent", "pending teacher attendance");

        // Academic + students
        addAll(c, "AcademicManagementTool",
                "how many classes and sections are there", "show class-wise student strength", "section-wise strength for class 9");
        addAll(c, "CountStudentsTool",
                "how many students are there", "count students in class 9 section A", "total student strength");
        addAll(c, "StudentRosterTool",
                "show all students from class 8 section A", "list all students class 7 section B", "those students list");
        addAll(c, "StudentGuardianDetailsTool",
                "guardian details for class 9 section A", "show parent contact of class 6 section C");
        addAll(c, "StudentSearchTool",
                "student profile of rahul", "show student details", "student information");

        // Fees
        addAll(c, "FeesManagementTool",
                "fees module summary", "fee module dashboard", "fees summary collection and defaulters");
        addAll(c, "GenerateFeeReportTool",
                "fee collection report this month", "monthly fee summary", "collection trend for april");
        addAll(c, "FeesDefaultersByClassTool",
                "show class-wise fee defaulters", "those defaulters", "overdue fee by class");
        addAll(c, "GetStudentFeeTool",
                "pending fee for student r-101", "dues for ananya", "student fee status");

        // Others
        addAll(c, "GetAttendanceTool",
                "how many students are absent today", "attendance summary", "attendance compliance");
        addAll(c, "AttendanceManagementTool",
                "attendance module summary", "class-wise attendance", "attendance dashboard this month", "below 75 attendance summary");
        addAll(c, "TimetableManagementTool",
                "show timetable for class 8 section A", "class 10 section B period schedule", "time table for class 5 section C");
        addAll(c, "PayrollManagementTool",
                "payroll module summary", "payroll dashboard this month", "salary module summary");
        addAll(c, "ExamsManagementTool",
                "exams module summary", "exam dashboard", "results dashboard");
        addAll(c, "TransportManagementTool",
                "transport module summary", "transport dashboard", "route dashboard");
        addAll(c, "SettingsManagementTool",
                "school settings summary", "feature flags in settings module", "list school branches");
        addAll(c, "LeaveManagementTool",
                "leave module summary", "how many pending leave requests", "who is on leave today");
        addAll(c, "HostelManagementTool",
                "hostel module summary", "hostel occupancy summary", "pending gate passes");
        addAll(c, "LibraryManagementTool",
                "library module summary", "how many overdue books", "library dashboard");
        addAll(c, "AuditManagementTool",
                "show last 20 audit logs", "audit logs summary", "latest activity logs");
        addAll(c, "ReportsManagementTool",
                "reports module summary", "show generated reports", "report dashboard kpi summary");
        addAll(c, "InboxManagementTool",
                "inbox summary", "latest announcements and notices", "unread inbox items");
        addAll(c, "GetTransportDueTool",
                "transport dues for class 8", "bus due list", "route payment pending");
        addAll(c, "HomeworkSummaryTool",
                "homework completion summary", "assignment pending report", "homework tracker");
        addAll(c, "TeacherWorkloadTool",
                "teacher periods load", "overloaded teachers", "faculty workload analytics");
        addAll(c, "ExamPassRateTool",
                "exam pass rate term 1", "result percentage trend", "class wise pass percent");
        addAll(c, "PayrollPendingApprovalsTool",
                "payroll pending approvals", "salary approvals pending", "payroll queue");
        addAll(c, "SchoolOverviewTool",
                "what is my school name", "give complete school overview", "dashboard across modules");

        // Expand with templates to go 200+
        String[] classes = {"1","2","3","4","5","6","7","8","9","10","11","12"};
        String[] sections = {"A","B","C","D"};
        for (String cls : classes) {
            c.add(new EvalCase("count students in class " + cls, "CountStudentsTool"));
            c.add(new EvalCase("show class-wise student strength for class " + cls, "AcademicManagementTool"));
            c.add(new EvalCase("teacher assignment coverage for class " + cls, "TeacherModuleTool"));
            c.add(new EvalCase("transport dues for class " + cls, "GetTransportDueTool"));
            c.add(new EvalCase("fees summary for class " + cls, "FeesManagementTool"));
            c.add(new EvalCase("attendance summary for class " + cls, "AttendanceManagementTool"));
            for (String sec : sections) {
                c.add(new EvalCase("show all students from class " + cls + " section " + sec, "StudentRosterTool"));
                c.add(new EvalCase("guardian details class " + cls + " section " + sec, "StudentGuardianDetailsTool"));
                c.add(new EvalCase("count students in class " + cls + " section " + sec, "CountStudentsTool"));
                c.add(new EvalCase("show timetable for class " + cls + " section " + sec, "TimetableManagementTool"));
            }
        }

        String[] subjects = {"math", "science", "english", "hindi", "physics", "chemistry", "biology"};
        for (String s : subjects) {
            c.add(new EvalCase("list " + s + " teachers", "TeacherDirectoryTool"));
            c.add(new EvalCase("show " + s + " teacher contacts", "TeacherDirectoryTool"));
            c.add(new EvalCase("active " + s + " teachers", "TeacherDirectoryTool"));
            c.add(new EvalCase("on leave " + s + " teachers", "TeacherDirectoryTool"));
        }

        String[] months = {"january","february","march","april","may","june","july","august","september","october","november","december"};
        for (String m : months) {
            c.add(new EvalCase("fee collection report for " + m, "GenerateFeeReportTool"));
            c.add(new EvalCase("fees module summary for " + m, "FeesManagementTool"));
            c.add(new EvalCase("payroll pending approvals for " + m, "PayrollPendingApprovalsTool"));
        }
        return c;
    }

    private void addAll(List<EvalCase> cases, String expected, String... prompts) {
        for (String p : prompts) {
            cases.add(new EvalCase(p, expected));
        }
    }

    private record EvalCase(String prompt, String expected) {}
}

