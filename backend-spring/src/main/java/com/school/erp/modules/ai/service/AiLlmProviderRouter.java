package com.school.erp.modules.ai.service;

import com.school.erp.modules.ai.service.AiLlmProvider.OrchestratorPlan;
import com.school.erp.modules.ai.service.AiLlmProvider.ToolCallResult;
import com.school.erp.modules.ai.service.AiTooling.ToolContext;
import com.school.erp.modules.ai.service.AiTooling.ToolDefinition;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Primary
public class AiLlmProviderRouter implements AiLlmProvider {
    private final AiProviderProperties properties;
    private final OpenAiLlmProvider openAiProvider;
    private final MockRuleBasedLlmProvider mockProvider;
    private volatile String lastSelectedProvider = "mock";
    private volatile String lastFallbackReason = "startup-default";

    public AiLlmProviderRouter(
            AiProviderProperties properties,
            OpenAiLlmProvider openAiProvider,
            MockRuleBasedLlmProvider mockProvider) {
        this.properties = properties;
        this.openAiProvider = openAiProvider;
        this.mockProvider = mockProvider;
    }

    @Override
    public OrchestratorPlan plan(String prompt, ToolContext context, List<ToolDefinition> toolDefinitions) {
        return active().plan(prompt, context, toolDefinitions);
    }

    @Override
    public String composeFinalAnswer(String prompt, List<ToolCallResult> toolResults, ToolContext context) {
        return active().composeFinalAnswer(prompt, toolResults, context);
    }

    private AiLlmProvider active() {
        String provider = properties.getProvider() == null ? "mock" : properties.getProvider().trim().toLowerCase();
        if ("openai".equals(provider) && openAiProvider.isConfigured()) {
            log.debug("AI provider selected: openai");
            lastSelectedProvider = "openai";
            lastFallbackReason = "";
            return openAiProvider;
        }
        if (!"openai".equals(provider)) {
            log.info("AI provider fallback: configured provider '{}' routes to mock provider.", provider);
            lastFallbackReason = "provider-not-supported:" + provider;
        } else {
            log.warn("AI provider fallback: openai selected but OPENAI_API_KEY missing/blank; using mock provider.");
            lastFallbackReason = "openai-key-missing";
        }
        lastSelectedProvider = "mock";
        return mockProvider;
    }

    public String getLastSelectedProvider() {
        return lastSelectedProvider;
    }

    public String getLastFallbackReason() {
        return lastFallbackReason;
    }
}
