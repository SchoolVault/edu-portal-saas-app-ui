package com.school.erp.modules.ai.service;

import com.school.erp.modules.ai.service.AiTooling.ToolCall;
import com.school.erp.modules.ai.service.AiTooling.ToolContext;
import com.school.erp.modules.ai.service.AiTooling.ToolDefinition;
import java.util.List;

public interface AiLlmProvider {
    OrchestratorPlan plan(String prompt, ToolContext context, List<ToolDefinition> toolDefinitions);
    String composeFinalAnswer(String prompt, List<ToolCallResult> toolResults, ToolContext context);

    record OrchestratorPlan(List<ToolCall> toolCalls) {}
    record ToolCallResult(String toolName, String status, Object payload) {}
}
