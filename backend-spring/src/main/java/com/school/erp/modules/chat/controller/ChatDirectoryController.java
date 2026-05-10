package com.school.erp.modules.chat.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.security.RequireTenantFeature;
import com.school.erp.security.rbac.RbacSpel;
import com.school.erp.modules.chat.dto.ChatDirectoryDTOs;
import com.school.erp.modules.chat.service.ChatDirectoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/chat")
@Tag(name = "Chat Directory", description = "Role-aware directory for starting chats (teacher<->parent via students/classes)")
@RequireTenantFeature("chat")
public class ChatDirectoryController {
    private final ChatDirectoryService directoryService;

    @GetMapping("/directory")
    @PreAuthorize(RbacSpel.CHAT_TENANT_PARTICIPANT)
    @Operation(summary = "Get chat directory for current user", description = "Teacher sees their class rosters; Parent sees their children & class teacher; Admin sees teachers/parents")
    public ResponseEntity<ApiResponse<ChatDirectoryDTOs.DirectoryResponse>> directory() {
        return ResponseEntity.ok(ApiResponse.ok(directoryService.getDirectory()));
    }

    public ChatDirectoryController(ChatDirectoryService directoryService) {
        this.directoryService = directoryService;
    }
}

