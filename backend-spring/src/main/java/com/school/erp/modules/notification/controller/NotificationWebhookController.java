package com.school.erp.modules.notification.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.notification.dto.NotificationWebhookDTOs;
import com.school.erp.modules.notification.service.NotificationOutboxService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications/webhooks")
public class NotificationWebhookController {
    private final NotificationOutboxService notificationOutboxService;

    public NotificationWebhookController(NotificationOutboxService notificationOutboxService) {
        this.notificationOutboxService = notificationOutboxService;
    }

    @PostMapping("/provider")
    public ResponseEntity<ApiResponse<Void>> providerReceipt(
            @Valid @RequestBody NotificationWebhookDTOs.ProviderReceiptRequest request,
            @RequestHeader(name = "X-Webhook-Secret", required = false) String secret) {
        if (!notificationOutboxService.isWebhookSecretValid(secret)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Invalid webhook secret"));
        }
        boolean updated = notificationOutboxService.applyProviderReceipt(
                request.tenantId(),
                request.correlationId(),
                request.providerMessageId(),
                request.providerStatus(),
                request.providerErrorCode(),
                request.providerErrorMessage());
        if (!updated) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Outbox message not found"));
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "Webhook receipt processed"));
    }
}
