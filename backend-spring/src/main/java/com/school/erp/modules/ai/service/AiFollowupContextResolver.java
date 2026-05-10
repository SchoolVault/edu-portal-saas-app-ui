package com.school.erp.modules.ai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.modules.ai.domain.AiToolLog;
import com.school.erp.modules.ai.repository.AiToolLogRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class AiFollowupContextResolver {
    private static final TypeReference<Map<String, Object>> MAP_REF = new TypeReference<>() {};
    private static final Set<String> CONTEXT_TOOLS = Set.of(
            "AcademicManagementTool",
            "StudentRosterTool",
            "StudentGuardianDetailsTool",
            "CountStudentsTool",
            "TeacherDirectoryTool",
            "TeacherModuleTool",
            "TeacherSearchTool",
            "FeesManagementTool",
            "GenerateFeeReportTool",
            "GetStudentFeeTool",
            "FeesDefaultersByClassTool",
            "AttendanceManagementTool",
            "GetAttendanceTool",
            "TeacherAttendanceTool",
            "TimetableManagementTool",
            "PayrollManagementTool",
            "PayrollPendingApprovalsTool",
            "ExamsManagementTool",
            "ExamPassRateTool",
            "TransportManagementTool",
            "GetTransportDueTool",
            "SettingsManagementTool",
            "LeaveManagementTool",
            "HostelManagementTool",
            "LibraryManagementTool",
            "AuditManagementTool",
            "ReportsManagementTool",
            "InboxManagementTool");
    private final AiToolLogRepository toolLogRepository;
    private final ObjectMapper objectMapper;

    public AiFollowupContextResolver(AiToolLogRepository toolLogRepository, ObjectMapper objectMapper) {
        this.toolLogRepository = toolLogRepository;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> resolve(
            String tenantId,
            String conversationId,
            String prompt,
            String toolName,
            Map<String, Object> input) {
        Map<String, Object> merged = new HashMap<>(input == null ? Map.of() : input);
        if (!CONTEXT_TOOLS.contains(toolName) || !isFollowupPrompt(prompt)) {
            return merged;
        }
        List<AiToolLog> logs = toolLogRepository.findTop20ByTenantIdAndConversationKeyAndIsDeletedFalseOrderByIdDesc(tenantId, conversationId);
        for (AiToolLog log : logs) {
            if (!"SUCCESS".equalsIgnoreCase(log.getStatus())) continue;
            if (!CONTEXT_TOOLS.contains(log.getToolName())) continue;
            Map<String, Object> lastInput = parseJson(log.getRequestJson());
            if (!merged.containsKey("className") && lastInput.get("className") != null) {
                merged.put("className", lastInput.get("className"));
            }
            if (!merged.containsKey("sectionName") && lastInput.get("sectionName") != null) {
                merged.put("sectionName", lastInput.get("sectionName"));
            }
            if (!merged.containsKey("query") && lastInput.get("query") != null && isTeacherFollowup(prompt)) {
                merged.put("query", lastInput.get("query"));
            }
            if (isFeesFollowup(prompt)) {
                if (!merged.containsKey("month") && lastInput.get("month") != null) {
                    merged.put("month", lastInput.get("month"));
                }
                if (!merged.containsKey("query") && lastInput.get("query") != null) {
                    merged.put("query", lastInput.get("query"));
                }
            }
            if (isAttendanceFollowup(prompt)) {
                if (!merged.containsKey("month") && lastInput.get("month") != null) {
                    merged.put("month", lastInput.get("month"));
                }
                if (!merged.containsKey("query") && lastInput.get("query") != null) {
                    merged.put("query", lastInput.get("query"));
                }
            }
            if (isTeacherFollowup(prompt)) {
                if (!merged.containsKey("status") && lastInput.get("status") != null) {
                    merged.put("status", lastInput.get("status"));
                }
                if (!merged.containsKey("subject") && lastInput.get("subject") != null) {
                    merged.put("subject", lastInput.get("subject"));
                }
            }
            if ((!merged.containsKey("className") || merged.get("className") == null)
                    && (!merged.containsKey("sectionName") || merged.get("sectionName") == null)
                    && (!isTeacherFollowup(prompt) || (!merged.containsKey("query") && !merged.containsKey("status") && !merged.containsKey("subject")))
                    && (!isFeesFollowup(prompt) || (!merged.containsKey("month") && !merged.containsKey("query")))
                    && (!isAttendanceFollowup(prompt) || (!merged.containsKey("month") && !merged.containsKey("query")))) {
                continue;
            }
            break;
        }
        return merged;
    }

    private boolean isFollowupPrompt(String prompt) {
        String p = prompt == null ? "" : prompt.toLowerCase();
        return p.contains("that class")
                || p.contains("those students")
                || p.contains("these students")
                || p.contains("section-wise")
                || p.contains("class-wise")
                || p.contains("show only")
                || p.contains("those")
                || p.contains("their")
                || p.contains("same");
    }

    private boolean isTeacherFollowup(String prompt) {
        String p = prompt == null ? "" : prompt.toLowerCase();
        return p.contains("those teacher")
                || p.contains("these teacher")
                || p.contains("their contact")
                || p.contains("their phone")
                || p.contains("their details")
                || p.contains("their email")
                || p.contains("same teachers")
                || p.contains("same list");
    }

    private boolean isFeesFollowup(String prompt) {
        String p = prompt == null ? "" : prompt.toLowerCase();
        return p.contains("same month")
                || p.contains("those defaulters")
                || p.contains("those dues")
                || p.contains("their dues")
                || p.contains("fee summary")
                || p.contains("collection for that month");
    }

    private boolean isAttendanceFollowup(String prompt) {
        String p = prompt == null ? "" : prompt.toLowerCase();
        return p.contains("attendance for same month")
                || p.contains("same attendance")
                || p.contains("those absent")
                || p.contains("attendance details")
                || p.contains("below 75")
                || p.contains("that month attendance");
    }

    private Map<String, Object> parseJson(String raw) {
        if (raw == null || raw.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(raw, MAP_REF);
        } catch (Exception e) {
            return Map.of();
        }
    }
}
