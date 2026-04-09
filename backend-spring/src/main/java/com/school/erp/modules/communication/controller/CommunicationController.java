package com.school.erp.modules.communication.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.communication.dto.CommunicationDTOs;
import com.school.erp.modules.communication.dto.AnnouncementDTOs;
import com.school.erp.modules.communication.entity.Announcement;
import com.school.erp.modules.communication.service.CommunicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/communication")
@Tag(name = "Communication", description = "Announcements & Teacher-Parent Messaging")
public class CommunicationController {
    private final CommunicationService service;

    // --- Announcements ---
    @GetMapping("/announcements")
    @Operation(summary = "List announcements")
    public ResponseEntity<ApiResponse<List<Announcement>>> listAnnouncements() {
        return ResponseEntity.ok(ApiResponse.ok(service.getAnnouncements()));
    }

    @PostMapping("/announcements")
    @PreAuthorize("hasAnyRole(\'ADMIN\',\'TEACHER\')")
    @Operation(summary = "Create announcement")
    public ResponseEntity<ApiResponse<Announcement>> createAnnouncement(@Valid @RequestBody AnnouncementDTOs.CreateAnnouncementRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createAnnouncement(req)));
    }

    @PutMapping("/announcements/{id}")
    @PreAuthorize("hasAnyRole(\'ADMIN\',\'TEACHER\')")
    @Operation(summary = "Update announcement")
    public ResponseEntity<ApiResponse<Announcement>> updateAnnouncement(@PathVariable Long id, @RequestBody Announcement ann) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateAnnouncement(id, ann)));
    }

    @DeleteMapping("/announcements/{id}")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Delete announcement")
    public ResponseEntity<ApiResponse<Void>> deleteAnnouncement(@PathVariable Long id) {
        service.deleteAnnouncement(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Deleted"));
    }

    // --- Teacher-Parent Messaging ---
    @GetMapping("/messages")
    @Operation(summary = "Get my messages", description = "All messages where current user is sender or receiver")
    public ResponseEntity<ApiResponse<List<CommunicationDTOs.MessageResponse>>> getMessages() {
        return ResponseEntity.ok(ApiResponse.ok(service.getMyMessages()));
    }

    @GetMapping("/messages/conversation/{otherUserId}")
    @Operation(summary = "Get conversation with a user")
    public ResponseEntity<ApiResponse<List<CommunicationDTOs.MessageResponse>>> getConversation(@PathVariable Long otherUserId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getConversation(otherUserId)));
    }

    @PostMapping("/messages")
    @Operation(summary = "Send message", description = "Send message to another user (teacher-parent communication)")
    public ResponseEntity<ApiResponse<CommunicationDTOs.MessageResponse>> sendMessage(@Valid @RequestBody CommunicationDTOs.SendMessageRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.sendMessage(req)));
    }

    @PutMapping("/messages/{id}/read")
    @Operation(summary = "Mark message as read")
    public ResponseEntity<ApiResponse<Void>> markRead(@PathVariable Long id) {
        service.markMessageRead(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/messages/unread-count")
    @Operation(summary = "Get unread message count")
    public ResponseEntity<ApiResponse<Long>> unreadCount() {
        return ResponseEntity.ok(ApiResponse.ok(service.getUnreadMessageCount()));
    }

    public CommunicationController(final CommunicationService service) {
        this.service = service;
    }
}
