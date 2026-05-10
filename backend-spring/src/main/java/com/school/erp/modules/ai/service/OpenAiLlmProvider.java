package com.school.erp.modules.ai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.modules.ai.service.AiLlmProvider.OrchestratorPlan;
import com.school.erp.modules.ai.service.AiLlmProvider.ToolCallResult;
import com.school.erp.modules.ai.service.AiTooling.ToolCall;
import com.school.erp.modules.ai.service.AiTooling.ToolContext;
import com.school.erp.modules.ai.service.AiTooling.ToolDefinition;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Component
public class OpenAiLlmProvider implements AiLlmProvider {
    private static final TypeReference<Map<String, Object>> MAP_REF = new TypeReference<>() {};

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final AiProviderProperties properties;

    public OpenAiLlmProvider(
            RestTemplateBuilder restTemplateBuilder,
            ObjectMapper objectMapper,
            AiProviderProperties properties) {
        this.objectMapper = objectMapper;
        this.properties = properties;
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofMillis(properties.getRequestTimeoutMs()))
                .setReadTimeout(Duration.ofMillis(properties.getRequestTimeoutMs()))
                .build();
    }

    public boolean isConfigured() {
        AiProviderProperties.OpenAi openai = properties.getProviders().getOpenai();
        boolean isOpenApiConfigured = openai != null && openai.getApiKey() != null && !openai.getApiKey().isBlank();
        if (!isOpenApiConfigured) {
            log.warn("OpenAI provider is not properly configured. Please set app.ai.providers.openai.api-key to enable AI features.");
        } else {
            log.debug("OpenAI provider config detected (api-key present).");
        }
        return isOpenApiConfigured;
    }

    @Override
    public OrchestratorPlan plan(String prompt, ToolContext context, List<ToolDefinition> toolDefinitions) {
        List<ToolCall> fallback = heuristicFallback(prompt);
        if (!isConfigured()) {
            return new OrchestratorPlan(fallback);
        }
        try {
            List<Map<String, Object>> messages = List.of(
                    Map.of("role", "system", "content", planningSystemPrompt(context)),
                    Map.of("role", "user", "content", prompt));
            Map<String, Object> body = Map.of(
                    "model", resolveModel(),
                    "temperature", 0.1,
                    "tool_choice", "required",
                    "messages", messages,
                    "tools", toOpenAiTools(toolDefinitions));

            JsonNode messageNode = callOpenAi(body);
            JsonNode toolCalls = messageNode.path("tool_calls");
            if (!toolCalls.isArray() || toolCalls.isEmpty()) {
                return new OrchestratorPlan(fallback);
            }
            List<ToolCall> calls = new ArrayList<>();
            for (JsonNode tc : toolCalls) {
                String toolName = tc.path("function").path("name").asText("");
                if (toolName.isBlank()) continue;
                String argsRaw = tc.path("function").path("arguments").asText("{}");
                Map<String, Object> args = parseArgs(argsRaw);
                calls.add(new ToolCall(toolName, args));
            }
            return calls.isEmpty() ? new OrchestratorPlan(fallback) : new OrchestratorPlan(calls);
        } catch (Exception e) {
            log.error("OpenAI planning failed; falling back to heuristic tool plan. cause={}", e.getMessage());
            return new OrchestratorPlan(fallback);
        }
    }

    @Override
    public String composeFinalAnswer(String prompt, List<ToolCallResult> toolResults, ToolContext context) {
        String clarification = clarificationQuestion(toolResults);
        if (clarification != null) {
            return clarification;
        }
        String deterministic = deterministicAnswer(toolResults);
        if (deterministic != null) {
            return deterministic;
        }
        if (!isConfigured()) {
            return "I processed your request successfully.";
        }
        try {
            String toolResultsJson = objectMapper.writeValueAsString(toolResults);
            List<Map<String, Object>> messages = List.of(
                    Map.of("role", "system", "content", answerSystemPrompt(context)),
                    Map.of("role", "user", "content",
                            "User question: " + prompt + "\n\nAuthorized tool results JSON:\n" + toolResultsJson));
            Map<String, Object> body = Map.of(
                    "model", resolveModel(),
                    "temperature", 0.2,
                    "messages", messages);
            JsonNode messageNode = callOpenAi(body);
            String content = messageNode.path("content").asText("");
            if (content == null || content.isBlank()) {
                return "I processed your request successfully.";
            }
            return content.trim();
        } catch (Exception e) {
            log.error("OpenAI answer generation failed; returning generic safe response. cause={}", e.getMessage());
            return "I processed your request successfully.";
        }
    }

    private JsonNode callOpenAi(Map<String, Object> body) {
        AiProviderProperties.OpenAi openai = properties.getProviders().getOpenai();
        String base = (openai.getBaseUrl() == null || openai.getBaseUrl().isBlank())
                ? "https://api.openai.com/v1"
                : openai.getBaseUrl();
        String url = base.endsWith("/") ? base + "chat/completions" : base + "/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openai.getApiKey().trim());
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        HttpEntity<Map<String, Object>> req = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, req, String.class);
        String raw = response.getBody() == null ? "{}" : response.getBody();
        JsonNode root = readJson(raw);
        JsonNode choices = root.path("choices");
        if (!choices.isArray() || choices.isEmpty()) {
            throw new IllegalStateException("OpenAI response has no choices");
        }
        return choices.get(0).path("message");
    }

    private List<Map<String, Object>> toOpenAiTools(List<ToolDefinition> defs) {
        List<Map<String, Object>> tools = new ArrayList<>();
        Map<String, Object> propertyCatalog = Map.ofEntries(
                Map.entry("query", Map.of("type", "string", "description", "Free-text search or identifier")),
                Map.entry("asOf", Map.of("type", "string", "description", "Date or point-in-time")),
                Map.entry("className", Map.of("type", "string", "description", "Class name like Class 9")),
                Map.entry("sectionName", Map.of("type", "string", "description", "Section name like A/B")),
                Map.entry("month", Map.of("type", "string", "description", "Month in yyyy-MM")),
                Map.entry("term", Map.of("type", "string", "description", "Exam term")),
                Map.entry("academicYearId", Map.of("type", "integer", "description", "Current academic year id")),
                Map.entry("scope", Map.of("type", "string", "description", "Result scope or filter")));
        for (ToolDefinition d : defs) {
            Map<String, Object> params = new HashMap<>();
            params.put("type", "object");
            params.put("additionalProperties", true);
            params.put("properties", propertyCatalog);
            if (!d.requiredParams().isEmpty()) {
                java.util.List<String> required = new java.util.ArrayList<>(d.requiredParams());
                if (d.requiresAcademicYear() && !required.contains("academicYearId")) {
                    required.add("academicYearId");
                }
                params.put("required", required);
            } else if (d.requiresAcademicYear()) {
                params.put("required", java.util.List.of("academicYearId"));
            }
            tools.add(Map.of(
                    "type", "function",
                    "function", Map.of(
                            "name", d.name(),
                            "description", d.description(),
                            "parameters", params)));
        }
        return tools;
    }

    private Map<String, Object> parseArgs(String raw) {
        if (raw == null || raw.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(raw, MAP_REF);
        } catch (Exception e) {
            return Map.of();
        }
    }

    private JsonNode readJson(String raw) {
        try {
            return objectMapper.readTree(raw);
        } catch (Exception e) {
            throw new IllegalStateException("Invalid OpenAI response", e);
        }
    }

    private String resolveModel() {
        String openAiModel = properties.getProviders().getOpenai().getModel();
        if (openAiModel != null && !openAiModel.isBlank()) {
            return openAiModel;
        }
        return properties.getDefaultModel();
    }

    private String planningSystemPrompt(ToolContext context) {
        return "You are a school ERP planning assistant. Always choose one or more tools for every user question. "
                + "Respect tenant and role scope. Never fabricate tool names. "
                + "For teacher profile/detail lookup, use TeacherSearchTool. "
                + "For teacher directory/list/contact/email lookups and follow-ups (those teachers/their contact), use TeacherDirectoryTool. "
                + "For teacher module summary and assignment coverage, use TeacherModuleTool. "
                + "For fee module summary (collection + overdue + defaulters), use FeesManagementTool. "
                + "For attendance module summary (class-wise/month-wise/below-75 trends), use AttendanceManagementTool. "
                + "For timetable queries by class-section/day-period schedule or teacher weekly schedule by name, use TimetableManagementTool. "
                + "For payroll module summary (submitted/completed/failed/pending approvals), use PayrollManagementTool. "
                + "For exams module summary (exam status/results/pass-rate trend), use ExamsManagementTool. "
                + "For transport module summary (routes/vehicles/drivers/live tracking/dues), use TransportManagementTool. "
                + "For settings/school profile/feature flags/branches, use SettingsManagementTool. "
                + "For leave module requests, balances, pending approvals, use LeaveManagementTool. "
                + "For hostel module occupancy/incidents/gate-pass, use HostelManagementTool. "
                + "For library module books/issued/overdue, use LibraryManagementTool. "
                + "For audit logs queries (e.g. last 20 logs), use AuditManagementTool. "
                + "For reports module dashboard/generated reports, use ReportsManagementTool. "
                + "For inbox/notices/announcements/unread summary, use InboxManagementTool. "
                + "For non-teaching staff detail lookup, use StaffDirectorySearchTool. "
                + "For student detail lookup, use StudentSearchTool. "
                + "For listing all students in a class-section, use StudentRosterTool. "
                + "For guardian/parent details of students in a class-section, use StudentGuardianDetailsTool. "
                + "For academic management analytics (classes, sections, class strength, homeroom coverage), use AcademicManagementTool. "
                + "For school-level questions such as school name, teacher count, class/section stats, staff counts, "
                + "payroll/library/hostel/transport/report summaries, prefer SchoolOverviewTool. "
                + "For student count questions (including class/section count), prefer CountStudentsTool and pass className/sectionName if present. "
                + "Role=" + safe(context.role()) + ", locale=" + safe(context.locale()) + ".";
    }

    private String answerSystemPrompt(ToolContext context) {
        return "You are School Copilot for a multi-tenant school ERP. "
                + "Use ONLY the provided authorized tool results. "
                + "Do not reveal hidden fields, credentials, or internal implementation details. "
                + "Provide concise, human-friendly business answers. "
                + "Role=" + safe(context.role()) + ", locale=" + safe(context.locale()) + ".";
    }

    private String safe(String value) {
        return value == null ? "unknown" : value;
    }

    @SuppressWarnings("unchecked")
    private String deterministicAnswer(List<ToolCallResult> toolResults) {
        if (toolResults == null || toolResults.isEmpty()) {
            return null;
        }
        ToolCallResult first = toolResults.get(0);
        if (!"TimetableManagementTool".equals(first.toolName())) {
            return null;
        }
        if (!(first.payload() instanceof Map<?, ?> raw)) {
            return null;
        }
        Map<String, Object> payload = (Map<String, Object>) raw;
        String scope = String.valueOf(payload.getOrDefault("scope", ""));
        if ("teacher-weekly".equals(scope)) {
            return "Weekly timetable for " + payload.getOrDefault("teacherName", "the teacher")
                    + " is ready with " + payload.getOrDefault("totalSlots", "N/A")
                    + " slots.\n" + timetableLines(payload.get("slots"));
        }
        if ("teacher-today".equals(scope)) {
            return "Today's timetable for " + payload.getOrDefault("teacherName", "the teacher")
                    + " has " + payload.getOrDefault("totalSlots", "N/A")
                    + " slots.\n" + timetableLines(payload.get("slots"));
        }
        if ("class-weekly".equals(scope) || "timetable-module".equals(scope)) {
            return "Timetable for " + payload.getOrDefault("className", "selected class")
                    + " section " + payload.getOrDefault("sectionName", "selected section")
                    + " is ready with " + payload.getOrDefault("totalSlots", "N/A") + " scheduled slots.\n"
                    + timetableLines(payload.get("slots"));
        }
        if ("class-today".equals(scope)) {
            return "Today's timetable for " + payload.getOrDefault("className", "selected class")
                    + " section " + payload.getOrDefault("sectionName", "selected section")
                    + " has " + payload.getOrDefault("totalSlots", "N/A") + " slots.\n"
                    + timetableLines(payload.get("slots"));
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private String timetableLines(Object value) {
        if (!(value instanceof List<?> rows) || rows.isEmpty()) {
            return "No timetable slots found for the requested scope.";
        }
        Map<String, List<String>> grouped = new LinkedHashMap<>();
        for (Object row : rows) {
            if (!(row instanceof Map<?, ?> raw)) continue;
            Map<String, Object> m = (Map<String, Object>) raw;
            String day = String.valueOf(m.getOrDefault("day", "DAY"));
            String classSection = String.valueOf(m.getOrDefault("className", ""));
            String sec = String.valueOf(m.getOrDefault("sectionName", ""));
            if (!sec.isBlank()) {
                classSection = classSection.isBlank() ? sec : classSection + "-" + sec;
            }
            String line = "P" + m.getOrDefault("period", "-")
                    + " " + m.getOrDefault("startTime", "") + "-" + m.getOrDefault("endTime", "")
                    + " | " + m.getOrDefault("subject", "-")
                    + (classSection.isBlank() ? "" : (" | " + classSection));
            grouped.computeIfAbsent(day, k -> new ArrayList<>()).add(line);
        }
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, List<String>> e : grouped.entrySet()) {
            sb.append(e.getKey()).append(":\n");
            for (String line : e.getValue()) {
                sb.append("- ").append(line).append("\n");
            }
        }
        return sb.toString().trim();
    }

    @SuppressWarnings("unchecked")
    private String clarificationQuestion(List<ToolCallResult> toolResults) {
        if (toolResults == null || toolResults.isEmpty()) {
            return null;
        }
        Object payloadObj = toolResults.get(0).payload();
        if (!(payloadObj instanceof Map<?, ?> map)) {
            return null;
        }
        Map<String, Object> payload = (Map<String, Object>) map;
        Object explicit = payload.get("clarificationQuestion");
        if (explicit != null && !String.valueOf(explicit).isBlank()) {
            return String.valueOf(explicit);
        }
        Object error = payload.get("error");
        if (error == null || String.valueOf(error).isBlank()) {
            return null;
        }
        Object requires = payload.get("requires");
        if (requires instanceof List<?> list && !list.isEmpty()) {
            String needed = list.stream().map(Objects::toString).filter(v -> !v.isBlank()).reduce((a, b) -> a + ", " + b).orElse("");
            if (!needed.isBlank()) {
                return "I need a bit more context before answering accurately. Please confirm: " + needed + ".";
            }
        }
        return "I need a bit more context before answering accurately. " + error + ".";
    }

    private List<ToolCall> heuristicFallback(String prompt) {
        String p = normalizePrompt(prompt);
        if (containsAny(p, "show their phone", "show their email", "their contact", "their phone", "their email", "same list", "same teachers", "their details again")) {
            return List.of(new ToolCall("TeacherDirectoryTool", Map.of("query", prompt)));
        }
        if (containsAny(p, "settings module", "school settings", "tenant settings", "feature flags", "school branches", "branch details")) {
            return List.of(new ToolCall("SettingsManagementTool", Map.of("query", prompt)));
        }
        if (containsAny(p, "teacher timetable", "teacher schedule")
                || (containsAny(p, "teacher") && containsAny(p, "timetable", "schedule") && containsAny(p, "week", "weekly", "this week"))) {
            return List.of(new ToolCall("TimetableManagementTool", Map.of("query", prompt)));
        }
        if (containsAny(p, "leave module", "leave summary", "pending leave", "on leave today", "leave requests")) {
            return List.of(new ToolCall("LeaveManagementTool", Map.of("query", prompt)));
        }
        if (containsAny(p, "hostel module", "hostel summary", "hostel occupancy", "gate pass", "hostel incidents")) {
            return List.of(new ToolCall("HostelManagementTool", Map.of("query", prompt)));
        }
        if (containsAny(p, "library module", "library summary", "overdue books", "library dashboard")) {
            return List.of(new ToolCall("LibraryManagementTool", Map.of("query", prompt)));
        }
        if (containsAny(p, "audit module", "audit logs", "last audit", "activity logs")) {
            return List.of(new ToolCall("AuditManagementTool", Map.of("query", prompt)));
        }
        if (containsAny(p, "reports module", "report module", "generated reports", "dashboard kpi", "report summary")) {
            return List.of(new ToolCall("ReportsManagementTool", Map.of("query", prompt)));
        }
        if (containsAny(p, "inbox module", "inbox summary", "announcements", "notices", "unread inbox", "latest notices")) {
            return List.of(new ToolCall("InboxManagementTool", Map.of("query", prompt)));
        }
        if (containsAny(p, "transport module", "transport dashboard", "transport summary", "route dashboard")) {
            return List.of(new ToolCall("TransportManagementTool", Map.of("query", prompt)));
        }
        if (containsAny(p, "exams module", "exam module", "exam dashboard", "exam summary", "results dashboard")) {
            return List.of(new ToolCall("ExamsManagementTool", Map.of("query", prompt)));
        }
        if (containsAny(p, "payroll module", "payroll dashboard", "payroll summary", "salary module summary")) {
            return List.of(new ToolCall("PayrollManagementTool", Map.of("query", prompt)));
        }
        if (containsAny(p, "timetable", "time table", "period schedule", "class schedule")
                && containsAny(p, "class", "section")) {
            return List.of(new ToolCall("TimetableManagementTool", Map.of("query", prompt)));
        }
        if (containsAny(p, "attendance module", "attendance summary by class", "class-wise attendance", "attendance trend", "attendance dashboard", "below 75 attendance")
                || (p.contains("attendance summary") && p.contains("class"))) {
            return List.of(new ToolCall("AttendanceManagementTool", Map.of("query", prompt)));
        }
        if (containsAny(p, "fees module", "fee module", "collection and defaulters", "fees dashboard")
                || (p.contains("fees summary") && p.contains("class"))) {
            return List.of(new ToolCall("FeesManagementTool", Map.of("query", prompt)));
        }
        if ((containsAny(p, "teacher", "teachers", "faculty")) && containsAny(p, "attendance", "absent", "pending")) {
            return List.of(new ToolCall("TeacherAttendanceTool", Map.of()));
        }
        if (containsAny(p, "homeroom coverage") && p.contains("class")) {
            return List.of(new ToolCall("TeacherModuleTool", Map.of("query", prompt)));
        }
        if ((containsAny(p, "teacher", "teachers", "faculty"))
                && containsAny(p, "assignment coverage", "teacher assignment", "class teacher assignment", "teacher assignment status", "teacher load by class", "teacher workload by class", "homeroom coverage", "teacher module", "teacher summary", "teacher allocation", "teacher capacity")) {
            return List.of(new ToolCall("TeacherModuleTool", Map.of("query", prompt)));
        }
        if ((containsAny(p, "teacher", "teachers", "faculty"))
                && (containsAny(p, "list", "directory", "contact", "phone", "mobile", "email", "same list", "same teachers", "those teachers", "their contact", "their phone", "their email")
                || p.contains("show all teachers")
                || p.contains("all teachers")
                || p.matches(".*\\b(active|on leave|inactive)\\b.*\\bteachers?\\b.*"))) {
            return List.of(new ToolCall("TeacherDirectoryTool", Map.of("query", prompt)));
        }
        if ((containsAny(p, "teacher", "faculty"))
                && containsAny(p, "profile", "details", "detail", "bio", "information")) {
            return List.of(new ToolCall("TeacherSearchTool", Map.of("query", prompt)));
        }
        if ((containsAny(p, "teacher details", "teacher profile", "show me details of") && containsAny(p, "teacher", "faculty"))) {
            return List.of(new ToolCall("TeacherSearchTool", Map.of("query", prompt)));
        }
        if (containsAny(p, "teacher list", "all teachers", "list teachers", "teacher directory", "teacher contacts", "contact number of teachers", "phone of teachers", "their contact", "their phone", "those teachers", "their email", "same teachers", "same list")) {
            return List.of(new ToolCall("TeacherDirectoryTool", Map.of("query", prompt)));
        }
        if (containsAny(p, "teacher module", "teacher summary", "teacher assignment coverage", "class teacher assignment", "teacher workload by class", "homeroom coverage")) {
            return List.of(new ToolCall("TeacherModuleTool", Map.of("query", prompt)));
        }
        if (containsAny(p, "guardian details", "guardian info", "parent details", "parent contact")
                && containsAny(p, "class", "section")) {
            return List.of(new ToolCall("StudentGuardianDetailsTool", Map.of("query", prompt)));
        }
        if ((containsAny(p, "all students details", "all student details", "show all students", "list all students", "all students")
                || (p.contains("students details") && p.contains("all")))
                && containsAny(p, "class", "section")) {
            return List.of(new ToolCall("StudentRosterTool", Map.of("query", prompt)));
        }
        if (containsAny(p, "those students", "these students", "list of those students", "show me the list of those students")) {
            return List.of(new ToolCall("StudentRosterTool", Map.of("query", prompt)));
        }
        if (containsAny(p, "how many classes", "how many sections", "student strength", "class strength", "class-wise strength", "section-wise", "section wise", "homeroom", "class teacher")
                && containsAny(p, "class", "section", "academic")) {
            return List.of(new ToolCall("AcademicManagementTool", Map.of("query", prompt)));
        }
        if (containsAny(p, "staff details", "staff profile", "non teaching staff", "office staff")) {
            return List.of(new ToolCall("StaffDirectorySearchTool", Map.of("query", prompt)));
        }
        if ((containsAny(p, "student details", "student profile", "show me details of")) && p.contains("student")) {
            return List.of(new ToolCall("StudentSearchTool", Map.of("query", prompt)));
        }
        if (containsAny(p, "defaulter", "fee default", "overdue fee by class", "fee overdue class", "overdue fees", "class-wise overdue", "those defaulters", "same month defaulters")) {
            return List.of(new ToolCall("FeesDefaultersByClassTool", Map.of("asOf", "today")));
        }
        if ((containsAny(p, "teacher", "teachers") && containsAny(p, "attendance", "absent", "pending"))
                || containsAny(p, "teacher attendance", "pending teacher", "teacher absent")) {
            return List.of(new ToolCall("TeacherAttendanceTool", Map.of()));
        }
        if (containsAny(p, "teacher workload", "workload", "overloaded teacher", "period load", "periods")) {
            return List.of(new ToolCall("TeacherWorkloadTool", Map.of("asOf", "today")));
        }
        if (containsAny(p, "exam pass", "pass rate", "pass percent", "result percentage")) {
            return List.of(new ToolCall("ExamPassRateTool", Map.of("term", "Term 1")));
        }
        if (containsAny(p, "payroll pending", "payroll queue", "unapproved payroll", "salary approval", "pending approvals by department")) {
            return List.of(new ToolCall("PayrollPendingApprovalsTool", Map.of("month", "current")));
        }
        if ((p.contains("how many") || p.contains("count") || p.contains("total")) && p.contains("student")) {
            if (containsAny(p, "absent", "attendance")) {
                return List.of(new ToolCall("GetAttendanceTool", Map.of()));
            }
            return List.of(new ToolCall("CountStudentsTool", Map.of("asOf", "today", "query", prompt)));
        }
        if (containsAny(p, "school name", "my school", "what is my school")
                || (containsAny(p, "teacher", "staff") && containsAny(p, "count", "total", "how many"))
                || containsAny(p, "class", "section", "library", "hostel", "transport", "report", "dashboard", "overview")) {
            return List.of(new ToolCall("SchoolOverviewTool", Map.of("scope", "all")));
        }
        if (p.contains("fee")) {
            return List.of(new ToolCall("GetStudentFeeTool", Map.of("query", prompt)));
        }
        if (p.contains("absent") || p.contains("attendance")) {
            return List.of(new ToolCall("GetAttendanceTool", Map.of()));
        }
        return List.of(new ToolCall("SchoolOverviewTool", Map.of("scope", "all", "query", prompt)));
    }

    private boolean containsAny(String text, String... values) {
        for (String v : values) {
            if (text.contains(v)) {
                return true;
            }
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
}
