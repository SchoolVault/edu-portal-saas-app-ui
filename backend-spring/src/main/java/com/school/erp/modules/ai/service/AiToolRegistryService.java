package com.school.erp.modules.ai.service;

import com.school.erp.modules.ai.service.AiTooling.AiTool;
import com.school.erp.modules.ai.service.AiTooling.ToolDefinition;
import com.school.erp.modules.ai.service.AiTooling.ToolResult;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class AiToolRegistryService {
    private final Map<String, AiTool> tools = new ConcurrentHashMap<>();
    private final AiSecurityGuard securityGuard;

    public AiToolRegistryService(List<AiTool> discoveredTools, AiSecurityGuard securityGuard) {
        this.securityGuard = securityGuard;
        for (AiTool tool : discoveredTools) {
            tools.put(tool.definition().name(), tool);
        }
    }

    public List<ToolDefinition> listToolDefinitions() {
        return tools.values().stream().map(AiTool::definition).toList();
    }

    public ToolDefinition findDefinition(String name) {
        AiTool tool = tools.get(name);
        return tool == null ? null : tool.definition();
    }

    public ToolResult execute(String name, AiTooling.ToolContext context, Map<String, Object> input) {
        AiTool tool = tools.get(name);
        if (tool == null) {
            return new ToolResult("NOT_FOUND", Map.of("error", "Tool not registered"), List.of());
        }
        securityGuard.ensureHasAnyAuthority(tool.definition().requiredAuthorities());
        return tool.execute(context, input);
    }
}
