package com.school.erp.modules.notification.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.notification.entity.Notification;
import com.school.erp.modules.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notifications", description = "User Notification Management")
public class NotificationController {
    private final NotificationService service;

    @GetMapping
    @Operation(summary = "Get user notifications")
    public ResponseEntity<ApiResponse<List<Notification>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(service.getUserNotifications()));
    }

    @GetMapping("/paged")
    @Operation(summary = "Get user notifications (paged)")
    public ResponseEntity<ApiResponse<PageResponse<Notification>>> listPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(service.getUserNotificationsPaged(page, size)));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get unread notification count")
    public ResponseEntity<ApiResponse<Long>> unreadCount() {
        return ResponseEntity.ok(ApiResponse.ok(service.getUnreadCount()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get one notification (current user / super-admin filtered scope)")
    public ResponseEntity<ApiResponse<Notification>> getOne(@PathVariable Long id) {
        Notification n = service.getNotificationForCurrentUser(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", id));
        return ResponseEntity.ok(ApiResponse.ok(n));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Mark notification as read")
    public ResponseEntity<ApiResponse<Void>> markRead(@PathVariable Long id) {
        service.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Marked as read"));
    }

    @PutMapping("/read-all")
    @Operation(summary = "Mark all notifications as read")
    public ResponseEntity<ApiResponse<Void>> markAllRead() {
        service.markAllAsRead();
        return ResponseEntity.ok(ApiResponse.ok(null, "All marked as read"));
    }

    public NotificationController(final NotificationService service) {
        this.service = service;
    }
}
