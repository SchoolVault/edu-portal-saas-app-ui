package com.school.erp.modules.ai.service;

import com.school.erp.modules.ai.service.AiTooling.ToolContext;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class ToolSelectionEvalRunnerTest {
    @Test
    void shouldRouteRepresentativeAdminPromptPack() {
        MockRuleBasedLlmProvider provider = new MockRuleBasedLlmProvider();
        ToolContext context = new ToolContext("tenant-a", 1L, "ADMIN", "en", "ai-assistant");

        Map<String, String> evalCases = new LinkedHashMap<>();
        evalCases.put("Count students in class 9 section A", "CountStudentsTool");
        evalCases.put("how many students are there in class 9 - A", "CountStudentsTool");
        evalCases.put("Show all students from class 8 section A", "StudentRosterTool");
        evalCases.put("show me the list of those students", "StudentRosterTool");
        evalCases.put("Show all those students details from class 8 section A", "StudentRosterTool");
        evalCases.put("Show guardian details of any student from class 9 section A", "StudentGuardianDetailsTool");
        evalCases.put("How many classes and sections are there in academic management?", "AcademicManagementTool");
        evalCases.put("Show class-wise student strength", "AcademicManagementTool");
        evalCases.put("show only section-wise for that class", "AcademicManagementTool");
        evalCases.put("How many students in class 5", "CountStudentsTool");
        evalCases.put("What is total student strength", "CountStudentsTool");
        evalCases.put("Show pending fee for Rahul", "GetStudentFeeTool");
        evalCases.put("Outstanding dues for student R-103", "GetStudentFeeTool");
        evalCases.put("Monthly fee collection report for April", "GenerateFeeReportTool");
        evalCases.put("Fee summary this month", "GenerateFeeReportTool");
        evalCases.put("How many students are absent today", "GetAttendanceTool");
        evalCases.put("Attendance compliance summary", "GetAttendanceTool");
        evalCases.put("Transport dues for class 8", "GetTransportDueTool");
        evalCases.put("Bus dues by class", "GetTransportDueTool");
        evalCases.put("Show me teacher details of Megha", "TeacherSearchTool");
        evalCases.put("Give staff profile for office assistant", "StaffDirectorySearchTool");
        evalCases.put("Student profile of Aarav", "StudentSearchTool");
        evalCases.put("Which teachers are absent", "TeacherAttendanceTool");
        evalCases.put("Class-wise fee defaulters", "FeesDefaultersByClassTool");
        evalCases.put("Teacher periods load", "TeacherWorkloadTool");
        evalCases.put("Exam pass percentage for term 1", "ExamPassRateTool");
        evalCases.put("Payroll queue pending by department", "PayrollPendingApprovalsTool");
        evalCases.put("What is my school name", "SchoolOverviewTool");
        evalCases.put("Give complete school dashboard overview", "SchoolOverviewTool");

        for (var tc : evalCases.entrySet()) {
            String actual = provider.plan(tc.getKey(), context, java.util.List.of()).toolCalls().get(0).toolName();
            Assertions.assertEquals(tc.getValue(), actual, "Mismatch for prompt: " + tc.getKey());
        }
    }
}
