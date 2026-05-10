package com.school.erp.modules.ai.service;

import com.school.erp.modules.ai.service.AiTooling.ToolContext;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class MockRuleBasedLlmProviderContractTest {

    @Test
    void shouldRouteAdminPromptsToExpectedTools() {
        MockRuleBasedLlmProvider provider = new MockRuleBasedLlmProvider();
        ToolContext context = new ToolContext("tenant-a", 1L, "ADMIN", "en", "ai-assistant");

        Map<String, String> promptToExpectedTool = new LinkedHashMap<>();
        promptToExpectedTool.put("How many students are there today?", "CountStudentsTool");
        promptToExpectedTool.put("how many students are there in class 9 - A", "CountStudentsTool");
        promptToExpectedTool.put("show me the list of those students", "StudentRosterTool");
        promptToExpectedTool.put("Show all students from class 8 section A", "StudentRosterTool");
        promptToExpectedTool.put("Show all those students details from class 8 section A", "StudentRosterTool");
        promptToExpectedTool.put("Show guardian details of any student from class 9 section A", "StudentGuardianDetailsTool");
        promptToExpectedTool.put("How many classes and sections are there in academic management?", "AcademicManagementTool");
        promptToExpectedTool.put("Show class-wise student strength", "AcademicManagementTool");
        promptToExpectedTool.put("show only section-wise for that class", "AcademicManagementTool");
        promptToExpectedTool.put("Give me student count", "CountStudentsTool");
        promptToExpectedTool.put("Total students in school", "CountStudentsTool");
        promptToExpectedTool.put("Current enrolment strength", "CountStudentsTool");
        promptToExpectedTool.put("Count of enrolled students as of today", "CountStudentsTool");

        promptToExpectedTool.put("Show pending fee for Rohit", "GetStudentFeeTool");
        promptToExpectedTool.put("Fee dues for class 8", "GetStudentFeeTool");
        promptToExpectedTool.put("Student fee status for Ananya", "GetStudentFeeTool");
        promptToExpectedTool.put("Outstanding fee details", "GetStudentFeeTool");
        promptToExpectedTool.put("Fee pending amount", "GetStudentFeeTool");

        promptToExpectedTool.put("Generate fee summary report for April", "GenerateFeeReportTool");
        promptToExpectedTool.put("Fee collection report", "GenerateFeeReportTool");
        promptToExpectedTool.put("Monthly fee collection summary", "GenerateFeeReportTool");
        promptToExpectedTool.put("Collection trend for this month", "GenerateFeeReportTool");
        promptToExpectedTool.put("Show fee collection month-wise", "GenerateFeeReportTool");

        promptToExpectedTool.put("Which students are absent today?", "GetAttendanceTool");
        promptToExpectedTool.put("Attendance summary", "GetAttendanceTool");
        promptToExpectedTool.put("Show absent list count", "GetAttendanceTool");
        promptToExpectedTool.put("Daily attendance numbers", "GetAttendanceTool");
        promptToExpectedTool.put("Attendance compliance status", "GetAttendanceTool");

        promptToExpectedTool.put("Transport dues for class 8", "GetTransportDueTool");
        promptToExpectedTool.put("Bus fee due list", "GetTransportDueTool");
        promptToExpectedTool.put("Route payment pending", "GetTransportDueTool");
        promptToExpectedTool.put("Transport pending records", "GetTransportDueTool");
        promptToExpectedTool.put("Transport overview dues", "GetTransportDueTool");

        promptToExpectedTool.put("Homework completion summary", "HomeworkSummaryTool");
        promptToExpectedTool.put("Assignment pending report", "HomeworkSummaryTool");
        promptToExpectedTool.put("Homework tracker", "HomeworkSummaryTool");
        promptToExpectedTool.put("Pending assignments analytics", "HomeworkSummaryTool");
        promptToExpectedTool.put("Homework status by class", "HomeworkSummaryTool");

        promptToExpectedTool.put("Teacher attendance pending", "TeacherAttendanceTool");
        promptToExpectedTool.put("Which teachers are absent?", "TeacherAttendanceTool");
        promptToExpectedTool.put("Pending teacher attendance actions", "TeacherAttendanceTool");
        promptToExpectedTool.put("Teacher absent report", "TeacherAttendanceTool");
        promptToExpectedTool.put("Teacher attendance exceptions", "TeacherAttendanceTool");

        promptToExpectedTool.put("Show fee defaulters by class", "FeesDefaultersByClassTool");
        promptToExpectedTool.put("Overdue fee by class section", "FeesDefaultersByClassTool");
        promptToExpectedTool.put("Defaulter student count class-wise", "FeesDefaultersByClassTool");
        promptToExpectedTool.put("Class-wise overdue fees", "FeesDefaultersByClassTool");
        promptToExpectedTool.put("Fee default analysis by class", "FeesDefaultersByClassTool");

        promptToExpectedTool.put("Teacher workload report", "TeacherWorkloadTool");
        promptToExpectedTool.put("Who are overloaded teachers", "TeacherWorkloadTool");
        promptToExpectedTool.put("Workload balancing view", "TeacherWorkloadTool");
        promptToExpectedTool.put("Teacher periods load", "TeacherWorkloadTool");
        promptToExpectedTool.put("Faculty workload analytics", "TeacherWorkloadTool");

        promptToExpectedTool.put("Exam pass rate by class", "ExamPassRateTool");
        promptToExpectedTool.put("Result percentage trend", "ExamPassRateTool");
        promptToExpectedTool.put("Pass rate analytics term 1", "ExamPassRateTool");
        promptToExpectedTool.put("Overall exam pass percentage", "ExamPassRateTool");
        promptToExpectedTool.put("Class wise pass percent", "ExamPassRateTool");

        promptToExpectedTool.put("Payroll pending approvals by department", "PayrollPendingApprovalsTool");
        promptToExpectedTool.put("Salary approvals pending", "PayrollPendingApprovalsTool");
        promptToExpectedTool.put("Payroll queue pending", "PayrollPendingApprovalsTool");
        promptToExpectedTool.put("Department wise payroll pending", "PayrollPendingApprovalsTool");
        promptToExpectedTool.put("Unapproved payroll actions", "PayrollPendingApprovalsTool");

        promptToExpectedTool.put("What is my school name?", "SchoolOverviewTool");
        promptToExpectedTool.put("Tell me overall school KPI", "SchoolOverviewTool");
        promptToExpectedTool.put("Teacher count in school", "SchoolOverviewTool");
        promptToExpectedTool.put("Class and section summary", "SchoolOverviewTool");
        promptToExpectedTool.put("Give complete school overview", "SchoolOverviewTool");

        Assertions.assertTrue(promptToExpectedTool.size() >= 50, "Expected at least 50 contract prompts");

        for (Map.Entry<String, String> tc : promptToExpectedTool.entrySet()) {
            String prompt = tc.getKey();
            String expectedTool = tc.getValue();
            String actual = provider.plan(prompt, context, java.util.List.of()).toolCalls().get(0).toolName();
            Assertions.assertEquals(expectedTool, actual, "Prompt route mismatch: " + prompt);
        }
    }
}
