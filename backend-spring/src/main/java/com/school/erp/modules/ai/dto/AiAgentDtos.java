package com.school.erp.modules.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public final class AiAgentDtos {
    private AiAgentDtos() {}

    public record ChatRequest(
            String conversationId,
            @NotBlank String message,
            String moduleKey,
            String locale,
            Map<String, Object> contextHints,
            Boolean stream) {}

    public record RenameConversationRequest(
            @NotBlank
            @Size(min = 2, max = 120)
            String title) {}

    public record MessageEnvelope(
            String id,
            String conversationId,
            String role,
            String content,
            LocalDateTime at,
            Map<String, Object> metadata) {}

    public record ToolExecutionView(
            String toolName,
            String status,
            Map<String, Object> input,
            Map<String, Object> output) {}

    public record ResponseCard(
            String type,
            String title,
            Map<String, Object> payload) {}

    public record ChatResponse(
            String conversationId,
            MessageEnvelope assistantMessage,
            List<ResponseCard> cards,
            List<ToolExecutionView> toolsUsed,
            List<String> suggestions) {}

    public record ConversationSummary(
            String conversationId,
            String title,
            String moduleKey,
            LocalDateTime updatedAt,
            String lastMessagePreview) {}

    public record ConversationHistory(
            String conversationId,
            String title,
            List<MessageEnvelope> messages) {}

    public record StreamEvent(
            @NotNull StreamEventType type,
            String conversationId,
            String messageId,
            String token,
            ToolExecutionView tool,
            ResponseCard card,
            String doneReason) {}

    public enum StreamEventType {
        ACK,
        TOKEN,
        TOOL_START,
        TOOL_END,
        CARD,
        DONE,
        ERROR
    }
}
