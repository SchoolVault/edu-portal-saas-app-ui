package com.school.erp.modules.notification.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.notification.dto.NotificationOpsDTOs;
import com.school.erp.modules.notification.entity.Notification;
import com.school.erp.modules.notification.service.NotificationOutboxService;
import com.school.erp.modules.notification.service.NotificationService;
import com.school.erp.modules.notification.sms.impl.RoutingSmsService;
import com.school.erp.security.rbac.RbacSpel;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notifications", description = "User Notification Management")
public class NotificationController {
    private final NotificationService service;
    private final NotificationOutboxService outboxService;
    private final RoutingSmsService routingSmsService;

    @GetMapping
    @PreAuthorize(RbacSpel.COMMUNICATION_INBOX_READ)
    @Operation(summary = "Get user notifications")
    public ResponseEntity<ApiResponse<List<Notification>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(service.getUserNotifications()));
    }

    @GetMapping("/paged")
    @PreAuthorize(RbacSpel.COMMUNICATION_INBOX_READ)
    @Operation(summary = "Get user notifications (paged)")
    public ResponseEntity<ApiResponse<PageResponse<Notification>>> listPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(service.getUserNotificationsPaged(page, size)));
    }

    @GetMapping("/unread-count")
    @PreAuthorize(RbacSpel.COMMUNICATION_INBOX_READ)
    @Operation(summary = "Get unread notification count")
    public ResponseEntity<ApiResponse<Long>> unreadCount() {
        return ResponseEntity.ok(ApiResponse.ok(service.getUnreadCount()));
    }

    @GetMapping("/{id}")
    @PreAuthorize(RbacSpel.COMMUNICATION_INBOX_READ)
    @Operation(summary = "Get one notification (current user / super-admin filtered scope)")
    public ResponseEntity<ApiResponse<Notification>> getOne(@PathVariable Long id) {
        Notification n = service.getNotificationForCurrentUser(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", id));
        return ResponseEntity.ok(ApiResponse.ok(n));
    }

    @PutMapping("/{id}/read")
    @PreAuthorize(RbacSpel.COMMUNICATION_INBOX_READ)
    @Operation(summary = "Mark notification as read")
    public ResponseEntity<ApiResponse<Void>> markRead(@PathVariable Long id) {
        service.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Marked as read"));
    }

    @PutMapping("/read-all")
    @PreAuthorize(RbacSpel.COMMUNICATION_INBOX_READ)
    @Operation(summary = "Mark all notifications as read")
    public ResponseEntity<ApiResponse<Void>> markAllRead() {
        service.markAllAsRead();
        return ResponseEntity.ok(ApiResponse.ok(null, "All marked as read"));
    }

    @GetMapping("/ops/dead-letter")
    @PreAuthorize(RbacSpel.SCHOOL_COMMUNICATION_READ)
    @Operation(summary = "Dead-letter queue items")
    public ResponseEntity<ApiResponse<PageResponse<NotificationOpsDTOs.DeadLetterItem>>> deadLetterPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(outboxService.deadLetterPage(page, size)));
    }

    @PostMapping("/ops/dead-letter/{id}/replay")
    @PreAuthorize(RbacSpel.SCHOOL_COMMUNICATION_WRITE)
    @Operation(summary = "Replay dead-letter entry")
    public ResponseEntity<ApiResponse<NotificationOpsDTOs.ReplayResult>> replayOne(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(outboxService.replayDeadLetter(id), "Replay requested"));
    }

    @PostMapping("/ops/dead-letter/replay-by-campaign/{campaignId}")
    @PreAuthorize(RbacSpel.SCHOOL_COMMUNICATION_WRITE)
    @Operation(summary = "Replay dead-letter entries for campaign")
    public ResponseEntity<ApiResponse<NotificationOpsDTOs.ReplayResult>> replayByCampaign(
            @PathVariable String campaignId,
            @RequestParam(defaultValue = "200") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(outboxService.replayCampaignDeadLetters(campaignId, limit), "Replay requested"));
    }

    @GetMapping("/ops/provider-health")
    @PreAuthorize(RbacSpel.SCHOOL_COMMUNICATION_READ)
    @Operation(summary = "SMS provider health snapshot")
    public ResponseEntity<ApiResponse<NotificationOpsDTOs.ProviderHealthResponse>> providerHealth() {
        NotificationOpsDTOs.ProviderHealthResponse out = new NotificationOpsDTOs.ProviderHealthResponse();
        out.setProviders(routingSmsService.providerHealthSnapshot());
        return ResponseEntity.ok(ApiResponse.ok(out));
    }

    public NotificationController(
            final NotificationService service,
            final NotificationOutboxService outboxService,
            final RoutingSmsService routingSmsService) {
        this.service = service;
        this.outboxService = outboxService;
        this.routingSmsService = routingSmsService;
    }
}
