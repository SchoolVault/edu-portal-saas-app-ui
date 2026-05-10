package com.school.erp.modules.ai.service;

import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class AiToolArgumentValidator {
    private final AiEntityResolver entityResolver;
    private final com.school.erp.modules.academic.service.CurrentAcademicYearResolver currentAcademicYearResolver;

    public AiToolArgumentValidator(
            AiEntityResolver entityResolver,
            com.school.erp.modules.academic.service.CurrentAcademicYearResolver currentAcademicYearResolver) {
        this.entityResolver = entityResolver;
        this.currentAcademicYearResolver = currentAcademicYearResolver;
    }

    public ValidationResult validateAndNormalize(
            AiTooling.ToolDefinition definition,
            String toolName,
            Map<String, Object> input,
            String prompt,
            String tenantId) {
        Map<String, Object> normalized = new HashMap<>(input == null ? Map.of() : input);
        List<String> errors = new ArrayList<>();
        String sourcePrompt = prompt == null || prompt.isBlank() ? String.valueOf(normalized.getOrDefault("query", "")) : prompt;
        normalized.putIfAbsent("query", sourcePrompt);

        switch (toolName) {
            case "CountStudentsTool" -> {
                entityResolver.resolveClassName(sourcePrompt).ifPresent(v -> normalized.putIfAbsent("className", v));
                entityResolver.resolveSectionName(sourcePrompt).ifPresent(v -> normalized.putIfAbsent("sectionName", v));
            }
            case "StudentRosterTool", "StudentGuardianDetailsTool" -> {
                entityResolver.resolveClassName(sourcePrompt).ifPresent(v -> normalized.putIfAbsent("className", v));
                entityResolver.resolveSectionName(sourcePrompt).ifPresent(v -> normalized.putIfAbsent("sectionName", v));
                if (String.valueOf(normalized.getOrDefault("className", "")).isBlank()) {
                    errors.add("className is required");
                }
                if (String.valueOf(normalized.getOrDefault("sectionName", "")).isBlank()) {
                    errors.add("sectionName is required");
                }
            }
            case "GenerateFeeReportTool" -> normalized.putIfAbsent("month", entityResolver.resolveMonthOrDefault(sourcePrompt, YearMonth.now().toString()));
            case "PayrollPendingApprovalsTool" -> normalized.putIfAbsent("month", entityResolver.resolveMonthOrDefault(sourcePrompt, YearMonth.now().toString()));
            case "ExamPassRateTool" -> normalized.putIfAbsent("term", entityResolver.resolveTerm(sourcePrompt).orElse("Term 1"));
            case "FeesManagementTool" -> {
                String query = String.valueOf(normalized.getOrDefault("query", "")).trim();
                if (query.isBlank()) {
                    errors.add("query is required");
                }
                normalized.putIfAbsent("month", entityResolver.resolveMonthOrDefault(sourcePrompt, YearMonth.now().toString()));
            }
            case "AttendanceManagementTool" -> {
                String query = String.valueOf(normalized.getOrDefault("query", "")).trim();
                if (query.isBlank()) {
                    errors.add("query is required");
                }
                normalized.putIfAbsent("month", entityResolver.resolveMonthOrDefault(sourcePrompt, YearMonth.now().toString()));
            }
            case "PayrollManagementTool" -> {
                String query = String.valueOf(normalized.getOrDefault("query", "")).trim();
                if (query.isBlank()) {
                    errors.add("query is required");
                }
                normalized.putIfAbsent("month", entityResolver.resolveMonthOrDefault(sourcePrompt, YearMonth.now().toString()));
            }
            case "ExamsManagementTool" -> {
                String query = String.valueOf(normalized.getOrDefault("query", "")).trim();
                if (query.isBlank()) {
                    errors.add("query is required");
                }
                normalized.putIfAbsent("term", entityResolver.resolveTerm(sourcePrompt).orElse("Term 1"));
            }
            case "TransportManagementTool" -> {
                String query = String.valueOf(normalized.getOrDefault("query", "")).trim();
                if (query.isBlank()) {
                    errors.add("query is required");
                }
            }
            case "SettingsManagementTool", "LeaveManagementTool", "HostelManagementTool", "LibraryManagementTool",
                    "AuditManagementTool", "ReportsManagementTool", "InboxManagementTool" -> {
                String query = String.valueOf(normalized.getOrDefault("query", "")).trim();
                if (query.isBlank()) {
                    errors.add("query is required");
                }
                if ("ReportsManagementTool".equals(toolName)) {
                    normalized.putIfAbsent("month", entityResolver.resolveMonthOrDefault(sourcePrompt, YearMonth.now().toString()));
                }
                if ("AuditManagementTool".equals(toolName)) {
                    java.util.regex.Matcher m = java.util.regex.Pattern.compile("\\blast\\s+(\\d{1,3})\\b").matcher(sourcePrompt.toLowerCase());
                    if (m.find()) {
                        normalized.put("limit", Integer.parseInt(m.group(1)));
                    }
                }
            }
            case "TimetableManagementTool" -> {
                String query = String.valueOf(normalized.getOrDefault("query", "")).trim();
                if (query.isBlank()) {
                    errors.add("query is required");
                }
                boolean teacherTimetableQuery = isTeacherTimetableQuery(sourcePrompt);
                entityResolver.resolveClassName(sourcePrompt).ifPresent(v -> normalized.putIfAbsent("className", v));
                entityResolver.resolveSectionName(sourcePrompt).ifPresent(v -> normalized.putIfAbsent("sectionName", v));
                if (!teacherTimetableQuery) {
                    if (String.valueOf(normalized.getOrDefault("className", "")).isBlank()) {
                        errors.add("className is required");
                    }
                    if (String.valueOf(normalized.getOrDefault("sectionName", "")).isBlank()) {
                        errors.add("sectionName is required");
                    }
                }
            }
            case "StudentSearchTool", "TeacherSearchTool", "TeacherDirectoryTool", "StaffDirectorySearchTool", "GetStudentFeeTool", "TeacherModuleTool" -> {
                String query = String.valueOf(normalized.getOrDefault("query", "")).trim();
                if (query.isBlank()) {
                    errors.add("query is required");
                }
                if ("TeacherDirectoryTool".equals(toolName) || "TeacherModuleTool".equals(toolName)) {
                    entityResolver.resolveTeacherStatus(sourcePrompt).ifPresent(v -> normalized.putIfAbsent("status", v));
                    entityResolver.resolveTeacherSubject(sourcePrompt).ifPresent(v -> normalized.putIfAbsent("subject", v));
                }
            }
            case "AcademicManagementTool" -> {
                String query = String.valueOf(normalized.getOrDefault("query", "")).trim();
                if (query.isBlank()) {
                    errors.add("query is required");
                }
                entityResolver.resolveClassName(sourcePrompt).ifPresent(v -> normalized.putIfAbsent("className", v));
                entityResolver.resolveSectionName(sourcePrompt).ifPresent(v -> normalized.putIfAbsent("sectionName", v));
                String p = sourcePrompt.toLowerCase();
                if (p.contains("section-wise") || p.contains("section wise")) {
                    normalized.put("breakdown", "section-wise");
                } else if (p.contains("class-wise") || p.contains("class wise")) {
                    normalized.put("breakdown", "class-wise");
                }
            }
            default -> {
                // no-op
            }
        }

        if (definition != null && definition.requiresAcademicYear()) {
            Object existingYear = normalized.get("academicYearId");
            if (existingYear == null || String.valueOf(existingYear).isBlank()) {
                Long currentYear = currentAcademicYearResolver.resolveCurrentAcademicYearId(tenantId);
                if (currentYear != null) {
                    normalized.put("academicYearId", currentYear);
                } else {
                    errors.add("academicYearId is required and current academic year could not be resolved");
                }
            }
        }

        return new ValidationResult(errors.isEmpty(), normalized, errors);
    }

    public record ValidationResult(boolean valid, Map<String, Object> normalizedInput, List<String> errors) {}

    private boolean isTeacherTimetableQuery(String sourcePrompt) {
        String p = sourcePrompt == null ? "" : sourcePrompt.toLowerCase();
        return p.contains("teacher") && (p.contains("timetable") || p.contains("schedule"));
    }
}
