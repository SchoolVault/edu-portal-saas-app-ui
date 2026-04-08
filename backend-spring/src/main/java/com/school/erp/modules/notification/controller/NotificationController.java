package com.school.erp.modules.notification.controller;
import com.school.erp.common.dto.ApiResponse; import com.school.erp.modules.notification.entity.Notification;
import com.school.erp.tenant.TenantContext; import io.swagger.v3.oas.annotations.Operation; import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor; import org.springframework.http.ResponseEntity; import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/v1/notifications") @RequiredArgsConstructor
@Tag(name = "Notifications", description = "User Notification APIs")
public class NotificationController {
    private final com.school.erp.modules.notification.repository.NotificationRepository repo;

    @GetMapping @Operation(summary = "Get user notifications")
    public ResponseEntity<ApiResponse<List<Notification>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(repo.findByTenantIdAndUserIdOrderByCreatedAtDesc(TenantContext.getTenantId(), TenantContext.getUserId())));
    }

    @GetMapping("/unread-count") @Operation(summary = "Get unread notification count")
    public ResponseEntity<ApiResponse<Long>> unreadCount() {
        return ResponseEntity.ok(ApiResponse.ok(repo.countByTenantIdAndUserIdAndIsReadFalse(TenantContext.getTenantId(), TenantContext.getUserId())));
    }

    @PutMapping("/{id}/read") @Operation(summary = "Mark notification as read")
    public ResponseEntity<ApiResponse<Void>> markRead(@PathVariable Long id) {
        repo.findById(id).ifPresent(n -> { n.setIsRead(true); repo.save(n); });
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PutMapping("/read-all") @Operation(summary = "Mark all notifications as read")
    public ResponseEntity<ApiResponse<Void>> markAllRead() {
        repo.findByTenantIdAndUserIdOrderByCreatedAtDesc(TenantContext.getTenantId(), TenantContext.getUserId())
                .forEach(n -> { n.setIsRead(true); repo.save(n); });
        return ResponseEntity.ok(ApiResponse.ok(null, "All marked as read"));
    }
}
