package com.school.erp.modules.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.modules.ai.domain.AiConversation;
import com.school.erp.modules.ai.domain.AiMessage;
import com.school.erp.modules.ai.domain.AiToolLog;
import com.school.erp.modules.ai.dto.AiAgentDtos;
import com.school.erp.modules.ai.repository.AiConversationRepository;
import com.school.erp.modules.ai.repository.AiMessageRepository;
import com.school.erp.modules.ai.repository.AiToolLogRepository;
import com.school.erp.tenant.TenantContext;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Consumer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AiAgentOrchestratorService {
    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final AiToolLogRepository toolLogRepository;
    private final AiToolRegistryService toolRegistryService;
    private final AiLlmProvider llmProvider;
    private final AiToolArgumentValidator toolArgumentValidator;
    private final AiFollowupContextResolver followupContextResolver;
    private final AiSecurityGuard securityGuard;
    private final AiResponseAuthorizationPolicy responseAuthorizationPolicy;
    private final ObjectMapper objectMapper;

    public AiAgentOrchestratorService(
            AiConversationRepository conversationRepository,
            AiMessageRepository messageRepository,
            AiToolLogRepository toolLogRepository,
            AiToolRegistryService toolRegistryService,
            AiLlmProvider llmProvider,
            AiToolArgumentValidator toolArgumentValidator,
            AiFollowupContextResolver followupContextResolver,
            AiSecurityGuard securityGuard,
            AiResponseAuthorizationPolicy responseAuthorizationPolicy,
            ObjectMapper objectMapper) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.toolLogRepository = toolLogRepository;
        this.toolRegistryService = toolRegistryService;
        this.llmProvider = llmProvider;
        this.toolArgumentValidator = toolArgumentValidator;
        this.followupContextResolver = followupContextResolver;
        this.securityGuard = securityGuard;
        this.responseAuthorizationPolicy = responseAuthorizationPolicy;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public AiAgentDtos.ChatResponse chat(AiAgentDtos.ChatRequest request, Consumer<AiAgentDtos.StreamEvent> streamSink) {
        securityGuard.ensureTenantContext();
        String tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId() == null ? 0L : TenantContext.getUserId();
        String role = TenantContext.getUserRole() == null ? "UNKNOWN" : TenantContext.getUserRole();
        String conversationId = upsertConversation(request, tenantId, userId, role);

        saveMessage(tenantId, conversationId, "user", request.message(), Map.of("moduleKey", request.moduleKey()));
        streamSink.accept(new AiAgentDtos.StreamEvent(AiAgentDtos.StreamEventType.ACK, conversationId, null, null, null, null, null));

        AiTooling.ToolContext toolContext = new AiTooling.ToolContext(tenantId, userId, role, request.locale(), request.moduleKey());
        String sanitizedPrompt = securityGuard.sanitizePrompt(withConversationContext(request.message(), tenantId, conversationId));
        AiLlmProvider.OrchestratorPlan plan = llmProvider.plan(sanitizedPrompt, toolContext, toolRegistryService.listToolDefinitions());

        List<AiAgentDtos.ToolExecutionView> toolsUsed = new ArrayList<>();
        List<AiLlmProvider.ToolCallResult> toolResultsForAnswer = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();
        for (AiTooling.ToolCall call : plan.toolCalls()) {
            Map<String, Object> resolvedInput = followupContextResolver.resolve(
                    tenantId, conversationId, sanitizedPrompt, call.toolName(), call.input());
            AiTooling.ToolDefinition definition = toolRegistryService.findDefinition(call.toolName());
            AiToolArgumentValidator.ValidationResult validation =
                    toolArgumentValidator.validateAndNormalize(definition, call.toolName(), resolvedInput, sanitizedPrompt, tenantId);
            if (!validation.valid()) {
                Map<String, Object> errorPayload = Map.of(
                        "error", "INVALID_TOOL_INPUT",
                        "tool", call.toolName(),
                        "issues", validation.errors());
                AiAgentDtos.ToolExecutionView invalidView =
                        new AiAgentDtos.ToolExecutionView(call.toolName(), "INVALID_INPUT", validation.normalizedInput(), errorPayload);
                toolsUsed.add(invalidView);
                toolResultsForAnswer.add(new AiLlmProvider.ToolCallResult(call.toolName(), "INVALID_INPUT", errorPayload));
                streamSink.accept(new AiAgentDtos.StreamEvent(
                        AiAgentDtos.StreamEventType.TOOL_END, conversationId, null, null, invalidView, null, null));
                continue;
            }
            AiTooling.ToolCall normalizedCall = new AiTooling.ToolCall(call.toolName(), validation.normalizedInput());
            long started = System.currentTimeMillis();
            streamSink.accept(new AiAgentDtos.StreamEvent(
                    AiAgentDtos.StreamEventType.TOOL_START, conversationId, null, null,
                    new AiAgentDtos.ToolExecutionView(normalizedCall.toolName(), "RUNNING", normalizedCall.input(), null), null, null));
            AiTooling.ToolResult result = toolRegistryService.execute(normalizedCall.toolName(), toolContext, normalizedCall.input());
            Map<String, Object> authorizedPayload = responseAuthorizationPolicy.apply(normalizedCall.toolName(), result.payload(), toolContext);
            result = new AiTooling.ToolResult(result.status(), authorizedPayload, result.suggestions());
            long tookMs = System.currentTimeMillis() - started;
            persistToolLog(tenantId, conversationId, normalizedCall, result, tookMs);
            AiAgentDtos.ToolExecutionView view = new AiAgentDtos.ToolExecutionView(normalizedCall.toolName(), result.status(), normalizedCall.input(), result.payload());
            toolsUsed.add(view);
            toolResultsForAnswer.add(new AiLlmProvider.ToolCallResult(normalizedCall.toolName(), result.status(), result.payload()));
            suggestions.addAll(result.suggestions());
            streamSink.accept(new AiAgentDtos.StreamEvent(AiAgentDtos.StreamEventType.TOOL_END, conversationId, null, null, view, null, null));
            streamSink.accept(new AiAgentDtos.StreamEvent(
                    AiAgentDtos.StreamEventType.CARD, conversationId, null, null, null,
                    new AiAgentDtos.ResponseCard("analytics", normalizedCall.toolName(), result.payload()), null));
        }
        runCoverageGuardrailIfNeeded(
                sanitizedPrompt,
                conversationId,
                toolContext,
                toolResultsForAnswer,
                toolsUsed,
                suggestions,
                streamSink,
                tenantId);

        String answer;
        if (toolResultsForAnswer.isEmpty()
                || toolResultsForAnswer.stream().allMatch(r -> "INVALID_INPUT".equalsIgnoreCase(r.status()))) {
            answer = clarificationPromptForInvalidInput(toolResultsForAnswer);
        } else {
            answer = llmProvider.composeFinalAnswer(sanitizedPrompt, toolResultsForAnswer, toolContext);
        }
        String assistantMessageId = UUID.randomUUID().toString();
        for (String token : answer.split(" ")) {
            streamSink.accept(new AiAgentDtos.StreamEvent(AiAgentDtos.StreamEventType.TOKEN, conversationId, assistantMessageId, token + " ", null, null, null));
        }
        saveMessage(tenantId, conversationId, "assistant", answer, Map.of("tools", toolsUsed.size()));
        streamSink.accept(new AiAgentDtos.StreamEvent(AiAgentDtos.StreamEventType.DONE, conversationId, assistantMessageId, null, null, null, "completed"));

        AiAgentDtos.MessageEnvelope envelope =
                new AiAgentDtos.MessageEnvelope(assistantMessageId, conversationId, "assistant", answer, LocalDateTime.now(), Map.of("tools", toolsUsed.size()));
        return new AiAgentDtos.ChatResponse(conversationId, envelope, List.of(), toolsUsed, suggestions.stream().distinct().limit(4).toList());
    }

    @Transactional(readOnly = true)
    public List<AiAgentDtos.ConversationSummary> listConversations() {
        securityGuard.ensureTenantContext();
        String tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId() == null ? 0L : TenantContext.getUserId();
        List<AiConversation> conversations =
                conversationRepository.findTop50ByTenantIdAndStartedByUserIdAndIsDeletedFalseOrderByUpdatedAtDesc(tenantId, userId);
        List<AiAgentDtos.ConversationSummary> out = new ArrayList<>();
        for (AiConversation conversation : conversations) {
            String preview = messageRepository
                    .findTop20ByTenantIdAndConversationKeyAndIsDeletedFalseOrderByIdDesc(tenantId, conversation.getConversationKey())
                    .stream()
                    .findFirst()
                    .map(AiMessage::getContent)
                    .map(this::preview)
                    .orElse("");
            out.add(new AiAgentDtos.ConversationSummary(
                    conversation.getConversationKey(),
                    conversation.getTitle(),
                    conversation.getModuleKey(),
                    conversation.getUpdatedAt(),
                    preview));
        }
        return out;
    }

    @Transactional(readOnly = true)
    public AiAgentDtos.ConversationHistory getConversationHistory(String conversationId) {
        securityGuard.ensureTenantContext();
        String tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId() == null ? 0L : TenantContext.getUserId();
        AiConversation conversation = conversationRepository
                .findByTenantIdAndConversationKeyAndStartedByUserIdAndIsDeletedFalse(tenantId, conversationId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found."));
        List<AiMessage> messages =
                messageRepository.findByTenantIdAndConversationKeyAndIsDeletedFalseOrderByIdAsc(tenantId, conversationId);
        List<AiAgentDtos.MessageEnvelope> history = new ArrayList<>();
        for (AiMessage message : messages) {
            history.add(new AiAgentDtos.MessageEnvelope(
                    String.valueOf(message.getId()),
                    message.getConversationKey(),
                    message.getSenderRole(),
                    message.getContent(),
                    message.getCreatedAt(),
                    Collections.emptyMap()));
        }
        return new AiAgentDtos.ConversationHistory(conversation.getConversationKey(), conversation.getTitle(), history);
    }

    @Transactional
    public void renameConversation(String conversationId, String title) {
        securityGuard.ensureTenantContext();
        String tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId() == null ? 0L : TenantContext.getUserId();
        String normalizedTitle = preview(title);
        if (normalizedTitle.isBlank()) {
            throw new IllegalArgumentException("Conversation title is required.");
        }
        int updated = conversationRepository.renameConversation(
                tenantId, conversationId, userId, normalizedTitle, LocalDateTime.now());
        if (updated <= 0) {
            throw new IllegalArgumentException("Conversation not found.");
        }
    }

    @Transactional
    public void deleteConversation(String conversationId) {
        securityGuard.ensureTenantContext();
        String tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId() == null ? 0L : TenantContext.getUserId();
        LocalDateTime now = LocalDateTime.now();
        int updated = conversationRepository.softDeleteConversation(tenantId, conversationId, userId, now);
        if (updated <= 0) {
            throw new IllegalArgumentException("Conversation not found.");
        }
        messageRepository.softDeleteByConversationKey(tenantId, conversationId, now);
        toolLogRepository.softDeleteByConversationKey(tenantId, conversationId, now);
    }

    private String upsertConversation(AiAgentDtos.ChatRequest request, String tenantId, Long userId, String role) {
        String key = request.conversationId() == null || request.conversationId().isBlank() ? UUID.randomUUID().toString() : request.conversationId();
        if (conversationRepository.findByTenantIdAndConversationKeyAndIsDeletedFalse(tenantId, key).isPresent()) return key;
        AiConversation c = new AiConversation();
        c.setTenantId(tenantId);
        c.setConversationKey(key);
        c.setStartedByUserId(userId);
        c.setStartedByRole(role);
        c.setModuleKey(request.moduleKey());
        c.setTitle(request.message().substring(0, Math.min(80, request.message().length())));
        conversationRepository.save(c);
        return key;
    }

    private void saveMessage(String tenantId, String conversationId, String role, String content, Map<String, Object> metadata) {
        AiMessage m = new AiMessage();
        m.setTenantId(tenantId);
        m.setConversationKey(conversationId);
        m.setSenderRole(role);
        m.setContent(content);
        m.setTokenCount(content.length() / 4);
        m.setMetadataJson(writeJson(metadata));
        messageRepository.save(m);
    }

    private void persistToolLog(String tenantId, String conversationId, AiTooling.ToolCall call, AiTooling.ToolResult result, long tookMs) {
        AiToolLog log = new AiToolLog();
        log.setTenantId(tenantId);
        log.setConversationKey(conversationId);
        log.setMessageKey(UUID.randomUUID().toString());
        log.setToolName(call.toolName());
        log.setStatus(result.status());
        log.setLatencyMs(tookMs);
        log.setRequestJson(writeJson(call.input()));
        log.setResponseJson(writeJson(result.payload()));
        toolLogRepository.save(log);
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    private String preview(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String compact = value.replaceAll("\\s+", " ").trim();
        return compact.substring(0, Math.min(compact.length(), 120));
    }

    private String withConversationContext(String prompt, String tenantId, String conversationId) {
        String p = prompt == null ? "" : prompt;
        String lower = p.toLowerCase();
        boolean needsContext = lower.contains("those")
                || lower.contains("them")
                || lower.contains("their details")
                || lower.startsWith("show all")
                || lower.startsWith("show me all");
        if (!needsContext || conversationId == null || conversationId.isBlank()) {
            return p;
        }
        List<AiMessage> recent = messageRepository.findTop20ByTenantIdAndConversationKeyAndIsDeletedFalseOrderByIdDesc(tenantId, conversationId);
        for (AiMessage m : recent) {
            if ("user".equalsIgnoreCase(m.getSenderRole()) && m.getContent() != null && !m.getContent().equals(prompt)) {
                return p + " | Previous user request context: " + m.getContent();
            }
        }
        return p;
    }

    private void runCoverageGuardrailIfNeeded(
            String prompt,
            String conversationId,
            AiTooling.ToolContext toolContext,
            List<AiLlmProvider.ToolCallResult> toolResultsForAnswer,
            List<AiAgentDtos.ToolExecutionView> toolsUsed,
            List<String> suggestions,
            Consumer<AiAgentDtos.StreamEvent> streamSink,
            String tenantId) {
        String p = prompt == null ? "" : prompt.toLowerCase();
        String missingSignal = firstMissingSignal(p, toolResultsForAnswer);
        if (missingSignal == null) {
            return;
        }
        boolean alreadyTriedOverview = toolResultsForAnswer.stream().anyMatch(r -> "SchoolOverviewTool".equals(r.toolName()));
        if (alreadyTriedOverview) {
            return;
        }
        AiTooling.ToolCall guardCall = new AiTooling.ToolCall("SchoolOverviewTool", Map.of("scope", "all", "guardrail", missingSignal));
        long started = System.currentTimeMillis();
        streamSink.accept(new AiAgentDtos.StreamEvent(
                AiAgentDtos.StreamEventType.TOOL_START, conversationId, null, null,
                new AiAgentDtos.ToolExecutionView(guardCall.toolName(), "RUNNING", guardCall.input(), null), null, null));
        AiTooling.ToolResult guardResult = toolRegistryService.execute(guardCall.toolName(), toolContext, guardCall.input());
        Map<String, Object> authorizedPayload = responseAuthorizationPolicy.apply(guardCall.toolName(), guardResult.payload(), toolContext);
        guardResult = new AiTooling.ToolResult(guardResult.status(), authorizedPayload, guardResult.suggestions());
        long tookMs = System.currentTimeMillis() - started;
        persistToolLog(tenantId, conversationId, guardCall, guardResult, tookMs);
        AiAgentDtos.ToolExecutionView view =
                new AiAgentDtos.ToolExecutionView(guardCall.toolName(), guardResult.status(), guardCall.input(), guardResult.payload());
        toolsUsed.add(view);
        toolResultsForAnswer.add(new AiLlmProvider.ToolCallResult(guardCall.toolName(), guardResult.status(), guardResult.payload()));
        suggestions.addAll(guardResult.suggestions());
        streamSink.accept(new AiAgentDtos.StreamEvent(AiAgentDtos.StreamEventType.TOOL_END, conversationId, null, null, view, null, null));
    }

    private String firstMissingSignal(String promptLower, List<AiLlmProvider.ToolCallResult> results) {
        if (promptLower.contains("school name") || promptLower.contains("my school")) {
            return containsField(results, "schoolName") ? null : "schoolName";
        }
        if ((promptLower.contains("teacher") || promptLower.contains("staff"))
                && (promptLower.contains("count") || promptLower.contains("total") || promptLower.contains("how many"))) {
            return containsField(results, "total") ? null : "teacherCount";
        }
        if (promptLower.contains("class") || promptLower.contains("section")) {
            return containsField(results, "totalSections") ? null : "classSection";
        }
        if (promptLower.contains("payroll") && promptLower.contains("pending")) {
            return containsField(results, "totalPendingApprovals") ? null : "payrollPending";
        }
        if (promptLower.contains("pass rate") || promptLower.contains("exam pass")) {
            return containsField(results, "overallPassPct") ? null : "examPassRate";
        }
        return null;
    }

    private boolean containsField(List<AiLlmProvider.ToolCallResult> results, String key) {
        for (AiLlmProvider.ToolCallResult r : results) {
            if (payloadContainsKey(r.payload(), key)) {
                return true;
            }
        }
        return false;
    }

    @SuppressWarnings("unchecked")
    private boolean payloadContainsKey(Object payload, String key) {
        if (payload instanceof Map<?, ?> map) {
            if (map.containsKey(key)) {
                return true;
            }
            for (Object v : map.values()) {
                if (payloadContainsKey(v, key)) {
                    return true;
                }
            }
            return false;
        }
        if (payload instanceof List<?> list) {
            for (Object v : list) {
                if (payloadContainsKey(v, key)) {
                    return true;
                }
            }
        }
        return false;
    }

    static String clarificationPromptForInvalidInput(List<AiLlmProvider.ToolCallResult> results) {
        if (results == null || results.isEmpty()) {
            return "I need a bit more detail to help correctly. Please share module and scope, for example: class/section, month, or person name.";
        }
        for (AiLlmProvider.ToolCallResult r : results) {
            if (r.payload() instanceof Map<?, ?> map && map.get("issues") instanceof List<?> issues && !issues.isEmpty()) {
                return "I need clarification before I proceed: " + issues.get(0)
                        + ". Please provide the missing details (for example class/section, month, or a person name).";
            }
        }
        return "I need more context to answer accurately. Please share the exact scope (class/section/month/person) and I will continue.";
    }
}
