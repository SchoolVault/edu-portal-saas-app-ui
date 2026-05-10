package com.school.erp.modules.ai.service;

import com.school.erp.modules.ai.service.AiLlmProvider.OrchestratorPlan;
import com.school.erp.modules.ai.service.AiLlmProvider.ToolCallResult;
import com.school.erp.modules.ai.service.AiTooling.ToolCall;
import com.school.erp.modules.ai.service.AiTooling.ToolContext;
import com.school.erp.modules.ai.service.AiTooling.ToolDefinition;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.LinkedHashMap;
import org.springframework.stereotype.Component;

@Component
public class MockRuleBasedLlmProvider implements AiLlmProvider {
    @Override
    public OrchestratorPlan plan(String prompt, ToolContext context, List<ToolDefinition> toolDefinitions) {
        String p = normalizePrompt(prompt);
        List<ToolCall> calls = new ArrayList<>();
        if ((containsAny(p, "all students details", "all student details", "show all students", "list all students")
                || (p.contains("students details") && p.contains("all")))
                && containsAny(p, "class", "section")) {
            calls.add(new ToolCall("StudentRosterTool", Map.of("query", prompt)));
        } else if (containsAny(p, "teacher timetable", "teacher schedule")
                || (containsAny(p, "teacher") && containsAny(p, "timetable", "schedule") && containsAny(p, "week", "weekly", "this week"))) {
            calls.add(new ToolCall("TimetableManagementTool", Map.of("query", prompt)));
        } else if (containsAny(p, "settings module", "school settings", "tenant settings", "feature flags", "school branches", "branch details")) {
            calls.add(new ToolCall("SettingsManagementTool", Map.of("query", prompt)));
        } else if (containsAny(p, "leave module", "leave summary", "pending leave", "on leave today", "leave requests")) {
            calls.add(new ToolCall("LeaveManagementTool", Map.of("query", prompt)));
        } else if (containsAny(p, "hostel module", "hostel summary", "hostel occupancy", "gate pass", "hostel incidents")) {
            calls.add(new ToolCall("HostelManagementTool", Map.of("query", prompt)));
        } else if (containsAny(p, "library module", "library summary", "overdue books", "library dashboard")) {
            calls.add(new ToolCall("LibraryManagementTool", Map.of("query", prompt)));
        } else if (containsAny(p, "audit module", "audit logs", "last audit", "activity logs")) {
            calls.add(new ToolCall("AuditManagementTool", Map.of("query", prompt)));
        } else if (containsAny(p, "reports module", "report module", "generated reports", "dashboard kpi", "report summary")) {
            calls.add(new ToolCall("ReportsManagementTool", Map.of("query", prompt)));
        } else if (containsAny(p, "inbox module", "inbox summary", "announcements", "notices", "unread inbox", "latest notices")) {
            calls.add(new ToolCall("InboxManagementTool", Map.of("query", prompt)));
        } else if (containsAny(p, "transport module", "transport dashboard", "transport summary", "route dashboard")) {
            calls.add(new ToolCall("TransportManagementTool", Map.of("query", prompt)));
        } else if (containsAny(p, "exams module", "exam module", "exam dashboard", "exam summary", "results dashboard")) {
            calls.add(new ToolCall("ExamsManagementTool", Map.of("query", prompt)));
        } else if (containsAny(p, "payroll module", "payroll dashboard", "payroll summary", "salary module summary")) {
            calls.add(new ToolCall("PayrollManagementTool", Map.of("query", prompt)));
        } else if (containsAny(p, "timetable", "time table", "period schedule", "class schedule")
                && containsAny(p, "class", "section")) {
            calls.add(new ToolCall("TimetableManagementTool", Map.of("query", prompt)));
        } else if (containsAny(p, "attendance module", "attendance summary by class", "class-wise attendance", "attendance trend", "attendance dashboard", "below 75 attendance")
                || (p.contains("attendance summary") && p.contains("class"))) {
            calls.add(new ToolCall("AttendanceManagementTool", Map.of("query", prompt)));
        } else if (containsAny(p, "fees module", "fee module", "collection and defaulters", "fees dashboard")
                || (p.contains("fees summary") && p.contains("class"))) {
            calls.add(new ToolCall("FeesManagementTool", Map.of("query", prompt)));
        } else if (containsAny(p, "show their phone", "show their email", "their contact", "their phone", "their email", "same list", "same teachers", "their details again")) {
            calls.add(new ToolCall("TeacherDirectoryTool", Map.of("query", prompt)));
        } else if ((containsAny(p, "teacher", "teachers", "faculty")) && containsAny(p, "attendance", "absent", "pending")) {
            calls.add(new ToolCall("TeacherAttendanceTool", Map.of()));
        } else if (containsAny(p, "homeroom coverage") && p.contains("class")) {
            calls.add(new ToolCall("TeacherModuleTool", Map.of("query", prompt)));
        } else if ((containsAny(p, "teacher", "teachers", "faculty"))
                && containsAny(p, "assignment coverage", "teacher assignment", "class teacher assignment", "teacher assignment status", "teacher load by class", "teacher workload by class", "homeroom coverage", "teacher module", "teacher summary", "teacher allocation", "teacher capacity")) {
            calls.add(new ToolCall("TeacherModuleTool", Map.of("query", prompt)));
        } else if ((containsAny(p, "teacher", "teachers", "faculty"))
                && (containsAny(p, "list", "directory", "contact", "phone", "mobile", "email", "same list", "same teachers", "those teachers", "their contact", "their phone", "their email")
                || p.contains("show all teachers")
                || p.contains("all teachers")
                || p.matches(".*\\b(active|on leave|inactive)\\b.*\\bteachers?\\b.*"))) {
            calls.add(new ToolCall("TeacherDirectoryTool", Map.of("query", prompt)));
        } else if ((containsAny(p, "teacher", "faculty"))
                && containsAny(p, "profile", "details", "detail", "bio", "information")) {
            calls.add(new ToolCall("TeacherSearchTool", extractNamedArg(prompt)));
        } else if (containsAny(p, "how many classes", "how many sections", "student strength", "class strength", "class-wise strength", "section-wise", "section wise", "homeroom", "class teacher")
                && containsAny(p, "class", "section", "academic")) {
            calls.add(new ToolCall("AcademicManagementTool", Map.of("query", prompt)));
        } else if (containsAny(p, "those students", "these students", "list of those students", "show me the list of those students")) {
            calls.add(new ToolCall("StudentRosterTool", Map.of("query", prompt)));
        } else if (containsAny(p, "teacher details", "teacher profile", "show me details of")
                && containsAny(p, "teacher", "faculty")) {
            calls.add(new ToolCall("TeacherSearchTool", extractNamedArg(prompt)));
        } else if (containsAny(p, "guardian details", "guardian info", "parent details", "parent contact", "their guardian details")
                && containsAny(p, "class", "section")) {
            calls.add(new ToolCall("StudentGuardianDetailsTool", Map.of("query", prompt)));
        } else if (containsAny(p, "show all students", "list all students", "all students")
                && containsAny(p, "class", "section")) {
            calls.add(new ToolCall("StudentRosterTool", Map.of("query", prompt)));
        } else if (containsAny(p, "staff details", "staff profile", "non teaching staff", "office staff")) {
            calls.add(new ToolCall("StaffDirectorySearchTool", extractNamedArg(prompt)));
        } else if (containsAny(p, "student details", "student profile", "show me details of")
                && p.contains("student")) {
            calls.add(new ToolCall("StudentSearchTool", extractNamedArg(prompt)));
        } else if ((containsAny(p, "teacher", "teachers") && containsAny(p, "attendance", "absent", "pending"))
                || containsAny(p, "teacher attendance", "pending teacher", "teacher absent")) {
            calls.add(new ToolCall("TeacherAttendanceTool", Map.of()));
        } else if (containsAny(p, "defaulter", "defaulters by class", "fee default", "overdue fee by class", "overdue fees", "class-wise overdue", "those defaulters", "same month defaulters")) {
            calls.add(new ToolCall("FeesDefaultersByClassTool", Map.of("asOf", "today")));
        } else if (containsAny(p, "teacher workload", "workload", "overloaded teacher", "period load", "periods")) {
            calls.add(new ToolCall("TeacherWorkloadTool", Map.of("asOf", "today")));
        } else if (containsAny(p, "exam pass", "pass rate", "pass percent", "result percentage")) {
            calls.add(new ToolCall("ExamPassRateTool", Map.of("term", "Term 1")));
        } else if (containsAny(p, "payroll pending", "payroll queue", "unapproved payroll", "salary approval", "pending approvals by department")) {
            calls.add(new ToolCall("PayrollPendingApprovalsTool", Map.of("month", "current")));
        } else if ((containsAny(p, "how many", "count", "total") && p.contains("student"))
                || p.contains("student strength")
                || p.contains("enrolment")) {
            if (containsAny(p, "absent", "attendance")) {
                calls.add(new ToolCall("GetAttendanceTool", Map.of()));
            } else {
                calls.add(new ToolCall("CountStudentsTool", Map.of("asOf", "today", "query", prompt)));
            }
        } else if (containsAny(p, "transport", "bus", "route")) {
            calls.add(new ToolCall("GetTransportDueTool", Map.of("className", "Class 8")));
        } else if (containsAny(p, "fee", "dues", "collection", "defaulter")) {
            if (containsAny(p, "summary", "report", "month", "collection")) {
                calls.add(new ToolCall("GenerateFeeReportTool", Map.of("month", "April")));
            } else {
                calls.add(new ToolCall("GetStudentFeeTool", extractNamedArg(prompt)));
            }
        } else if (containsAny(p, "absent", "attendance")) {
            calls.add(new ToolCall("GetAttendanceTool", Map.of()));
        } else if (containsAny(p, "homework", "assignment")) {
            calls.add(new ToolCall("HomeworkSummaryTool", Map.of()));
        } else if (containsAny(p, "overview", "kpi", "school status", "dashboard", "all modules", "overall", "school name", "my school")) {
            calls.add(new ToolCall("SchoolOverviewTool", Map.of("scope", "all")));
        } else if (containsAny(p, "teacher", "class", "section", "staff", "payroll", "library", "hostel", "report", "communication")) {
            calls.add(new ToolCall("SchoolOverviewTool", Map.of("scope", "all")));
        } else {
            calls.add(new ToolCall("StudentSearchTool", extractNamedArg(prompt)));
        }
        return new OrchestratorPlan(calls);
    }

    @Override
    public String composeFinalAnswer(String prompt, List<ToolCallResult> toolResults, ToolContext context) {
        if (toolResults == null || toolResults.isEmpty()) {
            return "I could not find data for this request yet. Please try rephrasing your question.";
        }
        ToolCallResult primary = toolResults.get(0);
        if (!(primary.payload() instanceof Map<?, ?> raw)) {
            return "I completed your request, but no structured data was returned.";
        }
        @SuppressWarnings("unchecked")
        Map<String, Object> payload = (Map<String, Object>) raw;
        String clarification = clarificationQuestion(payload);
        if (clarification != null) {
            return clarification;
        }
        String tool = primary.toolName();
        if ("CountStudentsTool".equals(tool)) {
            Object count = payload.getOrDefault("studentCount", "N/A");
            Object asOf = payload.getOrDefault("asOf", "today");
            Object cls = payload.get("className");
            Object sec = payload.get("sectionName");
            if (cls != null && sec != null) {
                return "As of " + asOf + ", total students in " + cls + " section " + sec + " are " + count + ".";
            }
            if (cls != null) {
                return "As of " + asOf + ", total students in " + cls + " are " + count + ".";
            }
            return "As of " + asOf + ", your school has " + count + " students.";
        }
        if ("GetAttendanceTool".equals(tool)) {
            Object absent = payload.getOrDefault("absentCount", "N/A");
            Object below = payload.getOrDefault("below75Count", "N/A");
            return "Today, " + absent + " students are absent and " + below + " students are below 75% attendance.";
        }
        if ("GetStudentFeeTool".equals(tool)) {
            Object amount = payload.getOrDefault("pendingAmount", "N/A");
            Object currency = payload.getOrDefault("currency", "INR");
            return "The pending fee amount is " + amount + " " + currency + ".";
        }
        if ("GenerateFeeReportTool".equals(tool)) {
            Object month = payload.getOrDefault("month", "selected month");
            Object total = payload.getOrDefault("totalCollected", "N/A");
            Object delta = payload.getOrDefault("deltaVsLastMonthPct", "N/A");
            return "Fee collection for " + month + " is " + total + ", with a " + delta + "% change from last month.";
        }
        if ("GetTransportDueTool".equals(tool)) {
            Object cls = payload.getOrDefault("className", "selected class");
            Object dues = payload.getOrDefault("dues", "N/A");
            return cls + " has " + dues + " transport due records.";
        }
        if ("StudentSearchTool".equals(tool)) {
            Object total = payload.getOrDefault("total", "N/A");
            return "I found " + total + " matching student record(s).";
        }
        if ("StudentRosterTool".equals(tool)) {
            Object total = payload.getOrDefault("total", "N/A");
            Object cls = payload.getOrDefault("className", "selected class");
            Object sec = payload.getOrDefault("sectionName", "selected section");
            String sample = sampleNames(payload.get("matches"), 5);
            return "I found " + total + " students in " + cls + " section " + sec + ". "
                    + (sample.isBlank() ? "" : ("Sample: " + sample + "."));
        }
        if ("StudentGuardianDetailsTool".equals(tool)) {
            Object total = payload.getOrDefault("total", "N/A");
            Object cls = payload.getOrDefault("className", "selected class");
            Object sec = payload.getOrDefault("sectionName", "selected section");
            String sample = sampleGuardianDetails(payload.get("guardians"), 3);
            return "Guardian details are ready for " + total + " students in " + cls + " section " + sec + ". "
                    + (sample.isBlank() ? "" : sample);
        }
        if ("AcademicManagementTool".equals(tool)) {
            Object totalClasses = payload.getOrDefault("totalClasses", "N/A");
            Object totalSections = payload.getOrDefault("totalSections", "N/A");
            Object strength = payload.getOrDefault("totalStudentStrength", payload.getOrDefault("studentStrength", "N/A"));
            if ("class".equals(String.valueOf(payload.get("scope")))) {
                return "Academic summary for " + payload.getOrDefault("className", "selected class") + ": "
                        + strength + " students across " + payload.getOrDefault("totalSections", "N/A") + " sections.";
            }
            return "Academic management snapshot: " + totalClasses + " classes, " + totalSections + " sections, and "
                    + strength + " total students.";
        }
        if ("TeacherSearchTool".equals(tool)) {
            Object total = payload.getOrDefault("total", "N/A");
            return "I found " + total + " matching teacher record(s). " + sampleNames(payload.get("matches"), 3);
        }
        if ("TeacherDirectoryTool".equals(tool)) {
            Object total = payload.getOrDefault("total", "N/A");
            return "Teacher directory has " + total + " matching record(s). " + sampleNames(payload.get("matches"), 5)
                    + " You can ask: 'show their phone', 'show their email', or 'only active teachers'.";
        }
        if ("TeacherModuleTool".equals(tool)) {
            if ("teacher-class".equals(String.valueOf(payload.get("scope")))) {
                return "Teacher assignment coverage for " + payload.getOrDefault("className", "selected class")
                        + ": class-teacher slots=" + payload.getOrDefault("classTeacherAssignments", "N/A")
                        + ", subject assignments=" + payload.getOrDefault("subjectTeacherAssignments", "N/A") + ".";
            }
            return "Teacher module snapshot: total teachers "
                    + payload.getOrDefault("totalTeachers", "N/A")
                    + ", active " + payload.getOrDefault("activeTeachers", "N/A")
                    + ", on leave " + payload.getOrDefault("onLeaveTeachers", "N/A")
                    + ", assigned homeroom slots " + payload.getOrDefault("assignedHomeroomSlots", "N/A") + ".";
        }
        if ("StaffDirectorySearchTool".equals(tool)) {
            Object total = payload.getOrDefault("total", "N/A");
            return "I found " + total + " matching staff record(s).";
        }
        if ("TeacherAttendanceTool".equals(tool)) {
            Object pending = safeSize(payload.get("pendingTeachers"));
            return "There are " + pending + " teachers who have pending attendance actions right now.";
        }
        if ("AttendanceManagementTool".equals(tool)) {
            return "Attendance snapshot: present " + payload.getOrDefault("presentCount", "N/A")
                    + ", absent " + payload.getOrDefault("absentCount", "N/A")
                    + ", present rate " + payload.getOrDefault("presentPct", "N/A")
                    + "%, below 75% count " + payload.getOrDefault("below75Count", "N/A") + ".";
        }
        if ("TimetableManagementTool".equals(tool)) {
            String scope = String.valueOf(payload.get("scope"));
            if ("teacher-weekly".equals(scope) || "teacher-today".equals(scope)) {
                String title = "teacher-today".equals(scope) ? "Today's timetable" : "Weekly timetable";
                return title + " for " + payload.getOrDefault("teacherName", "the teacher")
                        + " (" + payload.getOrDefault("totalSlots", "N/A") + " slots).\n"
                        + timetableLines(payload.get("slots"));
            }
            if ("class-weekly".equals(scope) || "class-today".equals(scope)) {
                String title = "class-today".equals(scope) ? "Today's timetable" : "Weekly timetable";
                return title + " for " + payload.getOrDefault("className", "selected class")
                        + " section " + payload.getOrDefault("sectionName", "selected section")
                        + " (" + payload.getOrDefault("totalSlots", "N/A") + " slots).\n"
                        + timetableLines(payload.get("slots"));
            }
            return "Timetable for " + payload.getOrDefault("className", "selected class")
                    + " section " + payload.getOrDefault("sectionName", "selected section")
                    + " is ready with " + payload.getOrDefault("totalSlots", "N/A") + " scheduled slots.";
        }
        if ("PayrollManagementTool".equals(tool)) {
            return "Payroll snapshot: submitted " + payload.getOrDefault("submittedCount", "N/A")
                    + ", completed " + payload.getOrDefault("completedCount", "N/A")
                    + ", failed " + payload.getOrDefault("failedCount", "N/A")
                    + ", pending approvals " + payload.getOrDefault("pendingApprovals", "N/A") + ".";
        }
        if ("ExamsManagementTool".equals(tool)) {
            return "Exams snapshot: total exams " + payload.getOrDefault("totalExams", "N/A")
                    + ", completed " + payload.getOrDefault("completedExams", "N/A")
                    + ", published results " + payload.getOrDefault("publishedResults", "N/A")
                    + ", overall pass rate " + payload.getOrDefault("overallPassPct", "N/A") + "%.";
        }
        if ("TransportManagementTool".equals(tool)) {
            return "Transport snapshot: routes " + payload.getOrDefault("activeRoutes", "N/A")
                    + ", vehicles " + payload.getOrDefault("activeVehicles", "N/A")
                    + ", drivers " + payload.getOrDefault("drivers", "N/A")
                    + ", assigned students " + payload.getOrDefault("assignedStudents", "N/A")
                    + ", dues " + payload.getOrDefault("transportDue", "N/A") + ".";
        }
        if ("SettingsManagementTool".equals(tool)) {
            return "Settings snapshot for " + payload.getOrDefault("schoolName", "school")
                    + ": branch count " + payload.getOrDefault("branchCount", "N/A")
                    + ", feature flags loaded.";
        }
        if ("LeaveManagementTool".equals(tool)) {
            return "Leave snapshot: pending " + payload.getOrDefault("pendingCount", "N/A")
                    + ", approved " + payload.getOrDefault("approvedCount", "N/A")
                    + ", rejected " + payload.getOrDefault("rejectedCount", "N/A") + ".";
        }
        if ("HostelManagementTool".equals(tool)) {
            return "Hostel snapshot: residents " + payload.getOrDefault("residents", "N/A")
                    + ", vacant beds " + payload.getOrDefault("vacantBeds", "N/A")
                    + ", pending gate passes " + payload.getOrDefault("pendingGatePasses", "N/A") + ".";
        }
        if ("LibraryManagementTool".equals(tool)) {
            return "Library snapshot: books " + payload.getOrDefault("bookCount", "N/A")
                    + ", issued " + payload.getOrDefault("issuedCount", "N/A")
                    + ", overdue " + payload.getOrDefault("overdueCount", "N/A") + ".";
        }
        if ("AuditManagementTool".equals(tool)) {
            return "Audit logs ready: total " + payload.getOrDefault("total", "N/A")
                    + ", returning last " + payload.getOrDefault("limit", "N/A") + " entries.";
        }
        if ("ReportsManagementTool".equals(tool)) {
            return "Reports snapshot: generated reports " + payload.getOrDefault("generatedCount", "N/A")
                    + ", recent activities and KPIs loaded.";
        }
        if ("InboxManagementTool".equals(tool)) {
            return "Inbox snapshot: unread " + payload.getOrDefault("unreadMessages", "N/A")
                    + ", timeline items " + payload.getOrDefault("timelineCount", "N/A")
                    + ", announcements " + payload.getOrDefault("announcementCount", "N/A") + ".";
        }
        if ("FeesDefaultersByClassTool".equals(tool)) {
            return "Fee defaulter snapshot is ready class-wise. Top overdue classes are highlighted with pending totals for targeted collection follow-up.";
        }
        if ("FeesManagementTool".equals(tool)) {
            return "Fees module summary: collected " + payload.getOrDefault("totalCollected", "N/A")
                    + ", pending " + payload.getOrDefault("totalPending", "N/A")
                    + ", overdue count " + payload.getOrDefault("overdueCount", "N/A")
                    + ", total defaulters " + payload.getOrDefault("totalDefaulters", "N/A") + ".";
        }
        if ("TeacherWorkloadTool".equals(tool)) {
            return "Teacher workload analysis is ready. It includes average periods per teacher and overloaded faculty requiring timetable rebalancing.";
        }
        if ("ExamPassRateTool".equals(tool)) {
            return "Exam performance summary is ready with overall pass percentage and class-wise pass rates for the selected term.";
        }
        if ("PayrollPendingApprovalsTool".equals(tool)) {
            return "Payroll approvals summary is ready with department-wise pending approvals for quick closure.";
        }
        if ("HomeworkSummaryTool".equals(tool)) {
            return "Homework update: " + payload.getOrDefault("submitted", "N/A") + " submissions received, "
                    + payload.getOrDefault("pending", "N/A") + " still pending, with highest delay in "
                    + payload.getOrDefault("topLateClass", "N/A") + ".";
        }
        if ("SchoolOverviewTool".equals(tool)) {
            return composeSchoolOverviewAnswer(prompt, payload);
        }
        return "I processed your request successfully.";
    }

    private String clarificationQuestion(Map<String, Object> payload) {
        if (payload == null || payload.isEmpty()) {
            return null;
        }
        Object explicit = payload.get("clarificationQuestion");
        if (explicit != null && !String.valueOf(explicit).isBlank()) {
            return String.valueOf(explicit);
        }
        Object error = payload.get("error");
        if (error == null) {
            return null;
        }
        String errorText = String.valueOf(error).trim();
        if (errorText.isBlank()) {
            return null;
        }
        Object requires = payload.get("requires");
        if (requires instanceof List<?> list && !list.isEmpty()) {
            String needed = list.stream().map(Objects::toString).filter(v -> !v.isBlank()).reduce((a, b) -> a + ", " + b).orElse("");
            if (!needed.isBlank()) {
                return "I need a bit more context before answering accurately. Please confirm: " + needed + ".";
            }
        }
        return "I need a bit more context before answering accurately. " + errorText + ".";
    }

    @SuppressWarnings("unchecked")
    private String timetableLines(Object value) {
        if (!(value instanceof List<?> rows) || rows.isEmpty()) {
            return "No timetable slots found for the requested scope.";
        }
        Map<String, List<String>> dayLines = new LinkedHashMap<>();
        for (Object row : rows) {
            if (!(row instanceof Map<?, ?> raw)) continue;
            Map<String, Object> m = (Map<String, Object>) raw;
            String day = String.valueOf(m.getOrDefault("day", "DAY"));
            String line = "P" + m.getOrDefault("period", "-")
                    + " " + m.getOrDefault("startTime", "") + "-" + m.getOrDefault("endTime", "")
                    + " | " + m.getOrDefault("subject", "-")
                    + " | " + m.getOrDefault("className", "") + (String.valueOf(m.getOrDefault("sectionName", "")).isBlank() ? "" : ("-" + m.getOrDefault("sectionName", "")));
            dayLines.computeIfAbsent(day, k -> new ArrayList<>()).add(line);
        }
        StringBuilder out = new StringBuilder();
        for (Map.Entry<String, List<String>> e : dayLines.entrySet()) {
            out.append(e.getKey()).append(":\n");
            for (String l : e.getValue()) {
                out.append("- ").append(l).append("\n");
            }
        }
        return out.toString().trim();
    }

    private Map<String, Object> extractNamedArg(String prompt) {
        Map<String, Object> out = new HashMap<>();
        out.put("query", prompt);
        return out;
    }

    private boolean containsAny(String text, String... values) {
        for (String v : values) {
            if (text.contains(v)) return true;
        }
        return false;
    }

    private String normalizePrompt(String prompt) {
        String p = prompt == null ? "" : prompt.toLowerCase(Locale.ROOT);
        return p.replace("teahcer", "teacher")
                .replace("techer", "teacher")
                .replace("teahcers", "teachers")
                .replace("teachr", "teacher")
                .replace("faculity", "faculty")
                .replace("summry", "summary")
                .replace("coverge", "coverage");
    }

    private int safeSize(Object value) {
        if (value instanceof List<?> list) {
            return list.size();
        }
        return 0;
    }

    @SuppressWarnings("unchecked")
    private String sampleNames(Object value, int max) {
        if (!(value instanceof List<?> list) || list.isEmpty()) return "";
        List<String> names = new ArrayList<>();
        for (Object row : list) {
            if (row instanceof Map<?, ?> map) {
                Object name = ((Map<String, Object>) map).get("name");
                if (name != null && !name.toString().isBlank()) {
                    names.add(name.toString());
                }
            }
            if (names.size() >= max) break;
        }
        return String.join(", ", names);
    }

    @SuppressWarnings("unchecked")
    private String sampleGuardianDetails(Object value, int maxStudents) {
        if (!(value instanceof List<?> list) || list.isEmpty()) return "";
        List<String> lines = new ArrayList<>();
        for (Object row : list) {
            if (row instanceof Map<?, ?> map) {
                String student = String.valueOf(((Map<String, Object>) map).getOrDefault("studentName", ""));
                Object guardiansObj = ((Map<String, Object>) map).get("guardians");
                if (guardiansObj instanceof List<?> gList && !gList.isEmpty() && gList.get(0) instanceof Map<?, ?> gMap) {
                    String guardian = String.valueOf(((Map<String, Object>) gMap).getOrDefault("name", ""));
                    String relation = String.valueOf(((Map<String, Object>) gMap).getOrDefault("relation", ""));
                    if (!student.isBlank() && !guardian.isBlank()) {
                        lines.add(student + " -> " + guardian + (relation.isBlank() ? "" : (" (" + relation + ")")));
                    }
                }
            }
            if (lines.size() >= maxStudents) break;
        }
        return lines.isEmpty() ? "" : ("Examples: " + String.join("; ", lines));
    }

    private String composeSchoolOverviewAnswer(String prompt, Map<String, Object> payload) {
        String p = prompt.toLowerCase(Locale.ROOT);
        Map<String, Object> students = map(payload.get("students"));
        Map<String, Object> teachers = map(payload.get("teachers"));
        Map<String, Object> classes = map(payload.get("classes"));
        Map<String, Object> attendance = map(payload.get("attendance"));
        Map<String, Object> fees = map(payload.get("fees"));
        Map<String, Object> payroll = map(payload.get("payroll"));
        Map<String, Object> transport = map(payload.get("transport"));
        Map<String, Object> library = map(payload.get("library"));
        Map<String, Object> hostel = map(payload.get("hostel"));
        Map<String, Object> communication = map(payload.get("communication"));
        Map<String, Object> reports = map(payload.get("reports"));

        if (containsAny(p, "teacher", "faculty", "staff")) {
            return "Teacher and staff snapshot: " + teachers.getOrDefault("total", "N/A") + " teachers, "
                    + teachers.getOrDefault("presentToday", "N/A") + " present today, "
                    + teachers.getOrDefault("onLeaveToday", "N/A") + " on leave, and "
                    + teachers.getOrDefault("vacanciesOpen", "N/A") + " open positions.";
        }
        if (containsAny(p, "class", "section")) {
            return "Academic structure: " + classes.getOrDefault("totalClasses", "N/A") + " classes with "
                    + classes.getOrDefault("totalSections", "N/A") + " sections. Average section strength is "
                    + classes.getOrDefault("avgClassStrength", "N/A") + ", highest is "
                    + classes.getOrDefault("highestStrengthSection", "N/A") + ".";
        }
        if (containsAny(p, "attendance", "absent")) {
            return "Attendance today: " + attendance.getOrDefault("studentAbsentToday", "N/A")
                    + " students absent, present percentage "
                    + attendance.getOrDefault("studentPresentPct", "N/A") + "%, and "
                    + attendance.getOrDefault("below75PctCount", "N/A") + " students below 75% attendance.";
        }
        if (containsAny(p, "fee", "finance", "collection", "dues")) {
            return "Finance snapshot: pending fee " + fees.getOrDefault("pendingAmountInr", "N/A") + " INR, this month's collection "
                    + fees.getOrDefault("collectedMonthInr", "N/A") + " INR (" + fees.getOrDefault("collectionDeltaPct", "N/A")
                    + "% vs last month), with " + fees.getOrDefault("overdueStudents", "N/A") + " overdue students.";
        }
        if (containsAny(p, "payroll", "salary")) {
            return "Payroll snapshot: monthly gross " + payroll.getOrDefault("monthlyGrossInr", "N/A")
                    + " INR, processed employees " + payroll.getOrDefault("processedEmployees", "N/A")
                    + ", pending approvals " + payroll.getOrDefault("pendingApprovals", "N/A") + ".";
        }
        if (containsAny(p, "transport", "bus")) {
            return "Transport snapshot: " + transport.getOrDefault("activeRoutes", "N/A") + " active routes, "
                    + transport.getOrDefault("activeVehicles", "N/A") + " vehicles, and "
                    + transport.getOrDefault("transportDues", "N/A") + " dues pending.";
        }
        if (containsAny(p, "library", "book")) {
            return "Library snapshot: " + library.getOrDefault("activeMembers", "N/A") + " active members, "
                    + library.getOrDefault("booksIssuedToday", "N/A") + " books issued today, and "
                    + library.getOrDefault("overdueBooks", "N/A") + " overdue books.";
        }
        if (containsAny(p, "hostel")) {
            return "Hostel snapshot: " + hostel.getOrDefault("residents", "N/A") + " residents, "
                    + hostel.getOrDefault("occupiedBeds", "N/A") + " occupied beds, "
                    + hostel.getOrDefault("vacantBeds", "N/A") + " vacant beds.";
        }
        if (containsAny(p, "communication", "message", "campaign", "whatsapp", "sms")) {
            return "Communication snapshot: " + communication.getOrDefault("messagesSentToday", "N/A")
                    + " messages sent today, " + communication.getOrDefault("campaignsRunning", "N/A")
                    + " active campaigns, delivery rate " + communication.getOrDefault("deliveryRatePct", "N/A") + "%.";
        }
        if (containsAny(p, "report", "analytics", "dashboard")) {
            return "Reporting snapshot: " + reports.getOrDefault("scheduledReports", "N/A") + " scheduled reports, "
                    + reports.getOrDefault("failedJobs24h", "N/A") + " failed jobs in last 24 hours, last published: "
                    + reports.getOrDefault("lastPublished", "N/A") + ".";
        }
        return "School overview for " + payload.getOrDefault("schoolName", "your school") + ": "
                + students.getOrDefault("total", "N/A") + " students, "
                + teachers.getOrDefault("total", "N/A") + " teachers, "
                + classes.getOrDefault("totalClasses", "N/A") + " classes / "
                + classes.getOrDefault("totalSections", "N/A") + " sections, "
                + attendance.getOrDefault("studentAbsentToday", "N/A") + " student absences today, and "
                + fees.getOrDefault("pendingAmountInr", "N/A") + " INR pending fees.";
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> map(Object value) {
        if (value instanceof Map<?, ?> m) {
            return (Map<String, Object>) m;
        }
        return Map.of();
    }
}
