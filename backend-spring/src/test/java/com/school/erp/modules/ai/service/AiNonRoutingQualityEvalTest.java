package com.school.erp.modules.ai.service;

import com.school.erp.modules.academic.service.CurrentAcademicYearResolver;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class AiNonRoutingQualityEvalTest {

    @Test
    void shouldScoreNonRoutingQualityAcrossModules() {
        CurrentAcademicYearResolver resolver = new CurrentAcademicYearResolver(null) {
            @Override
            public Long resolveCurrentAcademicYearId(String tenantId) {
                return 2026L;
            }
        };
        AiToolArgumentValidator validator = new AiToolArgumentValidator(new AiEntityResolver(), resolver);

        double argScore = argumentCorrectnessScore(validator);
        double responseScore = responseQualityScore();
        double rbacScore = rbacCorrectnessScore();
        double clarificationScore = clarificationQualityScore();
        double overall = 0.35 * argScore + 0.25 * responseScore + 0.25 * rbacScore + 0.15 * clarificationScore;

        System.out.println("Non-routing quality scores:");
        System.out.println("Argument correctness: " + format(argScore) + "%");
        System.out.println("Response quality: " + format(responseScore) + "%");
        System.out.println("RBAC correctness: " + format(rbacScore) + "%");
        System.out.println("Clarification quality: " + format(clarificationScore) + "%");
        System.out.println("Overall non-routing score: " + format(overall) + "%");

        Assertions.assertTrue(overall >= 90.0, "Expected non-routing quality >= 90%");
    }

    private double argumentCorrectnessScore(AiToolArgumentValidator validator) {
        List<ArgCase> cases = List.of(
                new ArgCase("TeacherDirectoryTool", true, "show active math teachers", List.of("query", "status", "subject", "academicYearId"), true),
                new ArgCase("TeacherModuleTool", true, "teacher assignment coverage for class 8", List.of("query", "academicYearId"), true),
                new ArgCase("AcademicManagementTool", true, "section-wise strength for class 9", List.of("query", "className", "breakdown", "academicYearId"), true),
                new ArgCase("FeesManagementTool", true, "fees module summary for april", List.of("query", "month", "academicYearId"), true),
                new ArgCase("AttendanceManagementTool", true, "attendance module summary this month", List.of("query", "month", "academicYearId"), true),
                new ArgCase("TimetableManagementTool", true, "show timetable for class 8 section A", List.of("query", "className", "sectionName", "academicYearId"), true),
                new ArgCase("PayrollManagementTool", true, "payroll module summary this month", List.of("query", "month", "academicYearId"), true),
                new ArgCase("ExamsManagementTool", true, "exam dashboard term 1", List.of("query", "term", "academicYearId"), true),
                new ArgCase("TransportManagementTool", true, "transport module summary", List.of("query", "academicYearId"), true),
                new ArgCase("SettingsManagementTool", true, "school settings summary", List.of("query", "academicYearId"), true),
                new ArgCase("LeaveManagementTool", true, "leave module summary", List.of("query", "academicYearId"), true),
                new ArgCase("HostelManagementTool", true, "hostel module summary", List.of("query", "academicYearId"), true),
                new ArgCase("LibraryManagementTool", true, "library module summary", List.of("query", "academicYearId"), true),
                new ArgCase("AuditManagementTool", true, "show last 20 audit logs", List.of("query", "limit", "academicYearId"), true),
                new ArgCase("ReportsManagementTool", true, "reports module summary this month", List.of("query", "month", "academicYearId"), true),
                new ArgCase("InboxManagementTool", true, "latest announcements and notices", List.of("query", "academicYearId"), true)
        );
        int passed = 0;
        for (ArgCase c : cases) {
            var def = new AiTooling.ToolDefinition(c.tool(), c.tool(), List.of(), List.of("query"), List.of(), List.of(), c.requiresYear());
            var result = validator.validateAndNormalize(def, c.tool(), Map.of(), c.prompt(), "tenant-a");
            boolean ok = result.valid() == c.expectedValid();
            for (String key : c.expectedKeys()) {
                ok &= result.normalizedInput().containsKey(key);
            }
            if (ok) passed++;
        }
        return (passed * 100.0) / cases.size();
    }

    private double responseQualityScore() {
        MockRuleBasedLlmProvider provider = new MockRuleBasedLlmProvider();
        AiTooling.ToolContext ctx = new AiTooling.ToolContext("tenant-a", 1L, "ADMIN", "en", "ai");
        Map<String, Map<String, Object>> payloads = new LinkedHashMap<>();
        payloads.put("TeacherModuleTool", Map.of("totalTeachers", 100, "activeTeachers", 90, "onLeaveTeachers", 10, "assignedHomeroomSlots", 50));
        payloads.put("FeesManagementTool", Map.of("totalCollected", 1000, "totalPending", 100, "overdueCount", 10, "totalDefaulters", 5));
        payloads.put("AttendanceManagementTool", Map.of("presentCount", 900, "absentCount", 100, "presentPct", 90, "below75Count", 30));
        payloads.put("TimetableManagementTool", Map.of("className", "Class 8", "sectionName", "A", "totalSlots", 36));
        payloads.put("PayrollManagementTool", Map.of("submittedCount", 10, "completedCount", 8, "failedCount", 2, "pendingApprovals", 4));
        payloads.put("ExamsManagementTool", Map.of("totalExams", 6, "completedExams", 5, "publishedResults", 4, "overallPassPct", 86));
        payloads.put("TransportManagementTool", Map.of("activeRoutes", 8, "activeVehicles", 10, "drivers", 9, "assignedStudents", 230, "transportDue", 14));
        payloads.put("SettingsManagementTool", Map.of("schoolName", "Greenfield", "branchCount", 3));
        payloads.put("LeaveManagementTool", Map.of("pendingCount", 12, "approvedCount", 31, "rejectedCount", 3));
        payloads.put("HostelManagementTool", Map.of("residents", 210, "vacantBeds", 30, "pendingGatePasses", 8));
        payloads.put("LibraryManagementTool", Map.of("bookCount", 2000, "issuedCount", 450, "overdueCount", 22));
        payloads.put("AuditManagementTool", Map.of("total", 1000, "limit", 20));
        payloads.put("ReportsManagementTool", Map.of("generatedCount", 55));
        payloads.put("InboxManagementTool", Map.of("unreadMessages", 4, "timelineCount", 14, "announcementCount", 8));
        int passed = 0;
        for (var e : payloads.entrySet()) {
            var results = List.of(new AiLlmProvider.ToolCallResult(e.getKey(), "SUCCESS", e.getValue()));
            String answer = provider.composeFinalAnswer("summary", results, ctx);
            boolean ok = answer != null && !answer.isBlank()
                    && !answer.toLowerCase().contains("processed your request successfully")
                    && !answer.toLowerCase().contains("no structured data");
            if (ok) passed++;
        }
        return (passed * 100.0) / payloads.size();
    }

    private double rbacCorrectnessScore() {
        AiResponseAuthorizationPolicy policy = new AiResponseAuthorizationPolicy();
        Map<String, Object> payload = Map.of(
                "name", "Rahul",
                "phone", "+91-99999",
                "email", "x@y.com",
                "nested", Map.of("guardianPhone", "+91-88888"),
                "rows", List.of(Map.of("email", "a@b.com", "ok", 1))
        );
        var teacherView = policy.apply("StudentSearchTool", payload, new AiTooling.ToolContext("tenant-a", 2L, "TEACHER", "en", "ai"));
        var adminView = policy.apply("StudentSearchTool", payload, new AiTooling.ToolContext("tenant-a", 1L, "ADMIN", "en", "ai"));
        int checks = 0;
        int passed = 0;
        checks++; if ("[restricted]".equals(teacherView.get("phone"))) passed++;
        checks++; if ("[restricted]".equals(teacherView.get("email"))) passed++;
        checks++; if ("+91-99999".equals(adminView.get("phone"))) passed++;
        checks++; if ("x@y.com".equals(adminView.get("email"))) passed++;
        return (passed * 100.0) / checks;
    }

    private double clarificationQualityScore() {
        List<AiLlmProvider.ToolCallResult> invalid = List.of(
                new AiLlmProvider.ToolCallResult("TimetableManagementTool", "INVALID_INPUT", Map.of("issues", List.of("className is required")))
        );
        String msg = AiAgentOrchestratorService.clarificationPromptForInvalidInput(invalid);
        int checks = 3;
        int passed = 0;
        if (msg.toLowerCase().contains("clarification")) passed++;
        if (msg.toLowerCase().contains("classname") || msg.toLowerCase().contains("class")) passed++;
        if (msg.toLowerCase().contains("missing")) passed++;
        return (passed * 100.0) / checks;
    }

    private String format(double value) {
        return String.format("%.2f", value);
    }

    private record ArgCase(String tool, boolean requiresYear, String prompt, List<String> expectedKeys, boolean expectedValid) {}
}

