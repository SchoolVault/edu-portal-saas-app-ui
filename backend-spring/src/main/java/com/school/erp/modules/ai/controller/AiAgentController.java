package com.school.erp.modules.ai.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.ai.dto.AiAgentDtos;
import com.school.erp.modules.ai.service.AiAgentOrchestratorService;
import com.school.erp.modules.ai.service.AiLlmProviderRouter;
import com.school.erp.modules.ai.service.AiProviderProperties;
import com.school.erp.modules.ai.service.AiToolRegistryService;
import com.school.erp.security.RequireTenantFeature;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.Executor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/v1/ai/agent")
@RequireTenantFeature("aiAssistant")
public class AiAgentController {
    private final AiAgentOrchestratorService orchestratorService;
    private final Executor taskExecutor;
    private final AiLlmProviderRouter providerRouter;
    private final AiProviderProperties providerProperties;
    private final AiToolRegistryService toolRegistryService;

    public AiAgentController(
            AiAgentOrchestratorService orchestratorService,
            @Qualifier("aiAgentExecutor") Executor taskExecutor,
            AiLlmProviderRouter providerRouter,
            AiProviderProperties providerProperties,
            AiToolRegistryService toolRegistryService) {
        this.orchestratorService = orchestratorService;
        this.taskExecutor = taskExecutor;
        this.providerRouter = providerRouter;
        this.providerProperties = providerProperties;
        this.toolRegistryService = toolRegistryService;
    }

    @PostMapping("/chat")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<AiAgentDtos.ChatResponse> chat(@Valid @RequestBody AiAgentDtos.ChatRequest request) {
        AiAgentDtos.ChatResponse response = orchestratorService.chat(request, evt -> {});
        return ApiResponse.ok(response);
    }

    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("isAuthenticated()")
    public SseEmitter chatStream(@Valid @RequestBody AiAgentDtos.ChatRequest request) {
        SseEmitter emitter = new SseEmitter(120_000L);
        final SecurityContext capturedContext = SecurityContextHolder.getContext();
        taskExecutor.execute(() -> {
            SecurityContext previous = SecurityContextHolder.getContext();
            SecurityContextHolder.setContext(capturedContext);
            try {
                orchestratorService.chat(request, evt -> {
                    try {
                        emitter.send(SseEmitter.event().name(evt.type().name()).data(evt));
                    } catch (IOException ioException) {
                        emitter.complete();
                    }
                });
                emitter.complete();
            } catch (Exception e) {
                try {
                    AiAgentDtos.StreamEvent errEvt = new AiAgentDtos.StreamEvent(
                            AiAgentDtos.StreamEventType.ERROR,
                            request.conversationId(),
                            null,
                            "Access denied or AI stream failed.",
                            null,
                            null,
                            "failed");
                    emitter.send(SseEmitter.event().name(AiAgentDtos.StreamEventType.ERROR.name()).data(errEvt));
                } catch (IOException ignored) {
                    // ignore and close
                } finally {
                    emitter.complete();
                }
            } finally {
                SecurityContextHolder.clearContext();
                if (previous != null) {
                    SecurityContextHolder.setContext(previous);
                }
            }
        });
        return emitter;
    }

    @GetMapping("/health/provider")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Object>> providerHealth() {
        boolean openAiKeyPresent = providerProperties.getProviders().getOpenai() != null
                && providerProperties.getProviders().getOpenai().getApiKey() != null
                && !providerProperties.getProviders().getOpenai().getApiKey().isBlank();
        return ApiResponse.ok(Map.of(
                "configuredProvider", providerProperties.getProvider(),
                "activeProvider", providerRouter.getLastSelectedProvider(),
                "fallbackReason", providerRouter.getLastFallbackReason(),
                "openAiKeyPresent", openAiKeyPresent,
                "requestTimeoutMs", providerProperties.getRequestTimeoutMs()));
    }

    @GetMapping("/tools/contracts")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Object> toolContracts() {
        return ApiResponse.ok(toolRegistryService.listToolDefinitions());
    }

    @GetMapping("/conversations")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Object> conversations() {
        return ApiResponse.ok(orchestratorService.listConversations());
    }

    @GetMapping("/conversations/{conversationId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Object> conversationHistory(@PathVariable String conversationId) {
        try {
            return ApiResponse.ok(orchestratorService.getConversationHistory(conversationId));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage());
        }
    }

    @PatchMapping("/conversations/{conversationId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Object> renameConversation(
            @PathVariable String conversationId,
            @Valid @RequestBody AiAgentDtos.RenameConversationRequest request) {
        try {
            orchestratorService.renameConversation(conversationId, request.title());
            return ApiResponse.ok(Map.of("updated", true));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage());
        }
    }

    @DeleteMapping("/conversations/{conversationId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Object> deleteConversation(@PathVariable String conversationId) {
        try {
            orchestratorService.deleteConversation(conversationId);
            return ApiResponse.ok(Map.of("deleted", true));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage());
        }
    }
}
