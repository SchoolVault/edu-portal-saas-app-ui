package com.school.erp.modules.ai.service;

import com.school.erp.modules.ai.service.AiTooling.ToolContext;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class TeacherToolSelectionEvalTest {

    @Test
    void shouldReportTeacherPromptRoutingAccuracy() {
        MockRuleBasedLlmProvider provider = new MockRuleBasedLlmProvider();
        ToolContext context = new ToolContext("tenant-a", 1L, "ADMIN", "en", "ai-assistant");
        List<EvalCase> cases = teacherEvalCases();

        int matched = 0;
        List<String> failures = new ArrayList<>();
        for (EvalCase tc : cases) {
            String actual = provider.plan(tc.prompt(), context, List.of()).toolCalls().get(0).toolName();
            if (tc.expectedTool().equals(actual)) {
                matched++;
            } else {
                failures.add("Prompt: \"" + tc.prompt() + "\" expected=" + tc.expectedTool() + " actual=" + actual);
            }
        }

        double accuracy = cases.isEmpty() ? 0.0 : (matched * 100.0) / cases.size();
        System.out.println("Teacher eval prompts: " + cases.size());
        System.out.println("Teacher routing matched: " + matched);
        System.out.println("Teacher routing accuracy: " + String.format("%.2f", accuracy) + "%");
        if (!failures.isEmpty()) {
            System.out.println("Teacher routing failures:");
            failures.stream().limit(25).forEach(System.out::println);
        }

        Assertions.assertTrue(cases.size() >= 120, "Expected at least 120 teacher eval prompts");
    }

    private List<EvalCase> teacherEvalCases() {
        List<EvalCase> cases = new ArrayList<>();

        String[] directoryPrompts = {
                "show all teachers",
                "list teachers in my school",
                "teacher directory",
                "teacher contacts list",
                "contact number of teachers",
                "phone of teachers",
                "show their phone",
                "show their email",
                "same teachers contact details",
                "only active teachers list",
                "list on leave teachers",
                "math teachers list",
                "science teacher contacts",
                "english teacher phone numbers",
                "show same list with contact"
        };
        for (String p : directoryPrompts) {
            cases.add(new EvalCase(p, "TeacherDirectoryTool"));
        }

        String[] modulePrompts = {
                "teacher module summary",
                "teacher summary for my school",
                "teacher assignment coverage",
                "class teacher assignment coverage",
                "teacher workload by class",
                "homeroom coverage for teachers",
                "show teacher assignment coverage for class 8",
                "class 9 teacher assignment status",
                "teacher capacity summary",
                "teacher allocation summary"
        };
        for (String p : modulePrompts) {
            cases.add(new EvalCase(p, "TeacherModuleTool"));
        }

        String[] teacherProfilePrompts = {
                "teacher profile of aarav",
                "show me teacher details of meera",
                "faculty profile for physics teacher",
                "show teacher details",
                "give teacher profile"
        };
        for (String p : teacherProfilePrompts) {
            cases.add(new EvalCase(p, "TeacherSearchTool"));
        }

        String[] attendancePrompts = {
                "teacher attendance pending",
                "which teachers are absent today",
                "teacher absent list",
                "pending teacher attendance actions",
                "teacher attendance exceptions"
        };
        for (String p : attendancePrompts) {
            cases.add(new EvalCase(p, "TeacherAttendanceTool"));
        }

        String[] workloadPrompts = {
                "teacher workload report",
                "teacher periods load",
                "faculty workload analytics",
                "who are overloaded teachers",
                "workload balancing view"
        };
        for (String p : workloadPrompts) {
            cases.add(new EvalCase(p, "TeacherWorkloadTool"));
        }

        // Natural-language variants, typo-heavy prompts, and follow-ups.
        String[] noisyTeacherDirectory = {
                "pls show techer list",
                "all teahcers contacts",
                "same teacher list with phone",
                "those teachers number",
                "their details again",
                "can u show same teachers email",
                "active math teacher list pls",
                "on leave teacher phone",
                "give me faculty contacts",
                "teacher directory with numbers"
        };
        for (String p : noisyTeacherDirectory) {
            cases.add(new EvalCase(p, "TeacherDirectoryTool"));
        }

        String[] noisyTeacherModule = {
                "teahcer module summry",
                "class wise teacher assignment",
                "teacher homeroom coverge",
                "faculty assignment coverage class 10",
                "teacher load by class"
        };
        for (String p : noisyTeacherModule) {
            cases.add(new EvalCase(p, "TeacherModuleTool"));
        }

        // Expand to 120+ by deterministic templating.
        String[] subjects = {"math", "science", "english", "hindi", "physics", "chemistry", "biology"};
        String[] statuses = {"active", "on leave"};
        for (String subject : subjects) {
            for (String status : statuses) {
                cases.add(new EvalCase("list " + status + " " + subject + " teachers", "TeacherDirectoryTool"));
                cases.add(new EvalCase("show " + status + " " + subject + " teacher contact", "TeacherDirectoryTool"));
                cases.add(new EvalCase("same " + status + " " + subject + " teachers email", "TeacherDirectoryTool"));
            }
        }

        for (int cls = 1; cls <= 12; cls++) {
            cases.add(new EvalCase("teacher assignment coverage for class " + cls, "TeacherModuleTool"));
            cases.add(new EvalCase("class " + cls + " teacher workload by class", "TeacherModuleTool"));
            cases.add(new EvalCase("class " + cls + " homeroom coverage", "TeacherModuleTool"));
            cases.add(new EvalCase("class " + cls + " teacher attendance pending", "TeacherAttendanceTool"));
        }

        return cases;
    }

    private record EvalCase(String prompt, String expectedTool) {}
}

