package com.school.erp.modules.chat.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.chat.dto.ChatDTOs;
import com.school.erp.modules.chat.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chat")
@Tag(name = "Chat", description = "Conversation-centric chat (inbox, conversations, messages) with realtime delivery")
@PreAuthorize("hasAnyRole('ADMIN','TEACHER','PARENT','STUDENT','SUPER_ADMIN')")
public class ChatController {
    private final ChatService chatService;

    @GetMapping("/inbox")
    @Operation(summary = "Get my inbox (conversation list)")
    public ResponseEntity<ApiResponse<List<ChatDTOs.InboxConversationResponse>>> inbox() {
        return ResponseEntity.ok(ApiResponse.ok(chatService.inbox()));
    }

    @PostMapping("/conversations")
    @Operation(summary = "Create a conversation")
    public ResponseEntity<ApiResponse<ChatDTOs.InboxConversationResponse>> createConversation(@Valid @RequestBody ChatDTOs.CreateConversationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(chatService.createConversation(request)));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    @Operation(summary = "List messages in a conversation (paged)")
    public ResponseEntity<ApiResponse<Page<ChatDTOs.MessageResponse>>> messages(@PathVariable Long conversationId,
                                                                               @RequestParam(defaultValue = "0") int page,
                                                                               @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(ApiResponse.ok(chatService.getMessages(conversationId, page, size)));
    }

    @PostMapping("/messages")
    @Operation(summary = "Send a message")
    public ResponseEntity<ApiResponse<ChatDTOs.MessageResponse>> send(@Valid @RequestBody ChatDTOs.SendMessageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(chatService.sendMessage(request)));
    }

    @PutMapping("/conversations/read")
    @Operation(summary = "Mark conversation read up to a message id")
    public ResponseEntity<ApiResponse<Void>> markRead(@Valid @RequestBody ChatDTOs.MarkReadRequest request) {
        chatService.markRead(request);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }
}

