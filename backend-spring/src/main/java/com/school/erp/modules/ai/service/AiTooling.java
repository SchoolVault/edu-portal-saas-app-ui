package com.school.erp.modules.ai.service;

import java.util.List;
import java.util.Map;

public final class AiTooling {
    private AiTooling() {}

    public record ToolContext(String tenantId, Long userId, String role, String locale, String moduleKey) {}

    public record ToolDefinition(
            String name,
            String description,
            List<String> requiredAuthorities,
            List<String> requiredParams,
            List<String> examplePrompts,
            List<String> doNotUseWhen,
            boolean requiresAcademicYear) {
        public ToolDefinition(String name, String description, List<String> requiredAuthorities) {
            this(name, description, requiredAuthorities, List.of(), List.of(), List.of(), false);
        }

        public ToolDefinition(
                String name,
                String description,
                List<String> requiredAuthorities,
                List<String> requiredParams,
                List<String> examplePrompts,
                List<String> doNotUseWhen) {
            this(name, description, requiredAuthorities, requiredParams, examplePrompts, doNotUseWhen, false);
        }
    }

    public record ToolCall(String toolName, Map<String, Object> input) {}

    public record ToolResult(String status, Map<String, Object> payload, List<String> suggestions) {}

    public interface AiTool {
        ToolDefinition definition();
        ToolResult execute(ToolContext context, Map<String, Object> input);
    }
}
