package com.school.erp.modules.notification.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.notification.dto.NotificationWebhookDTOs;
import com.school.erp.modules.notification.service.NotificationOutboxService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

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

    @PostMapping("/msg91")
    public ResponseEntity<ApiResponse<Void>> msg91Receipt(
            @RequestBody Map<String, Object> payload,
            @RequestParam("tenantId") String tenantId,
            @RequestHeader(name = "X-Webhook-Secret", required = false) String secret) {
        if (!notificationOutboxService.isWebhookSecretValid(secret)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Invalid webhook secret"));
        }
        String requestId = firstNonBlank(payload, "requestId", "request_id", "correlationId", "correlation_id");
        String messageId = firstNonBlank(payload, "messageId", "message_id", "msgid", "msg_id");
        String statusRaw = firstNonBlank(payload, "status", "dlrStatus", "deliveryStatus", "type");
        String reason = firstNonBlank(payload, "reason", "description", "error", "errorMessage", "message");
        String errorCode = firstNonBlank(payload, "errorCode", "error_code", "code");

        String providerStatus = mapMsg91Status(statusRaw);
        String providerErrorCode = StringUtils.hasText(errorCode) ? errorCode : statusRaw;
        boolean updated = false;
        if (StringUtils.hasText(requestId)) {
            updated = notificationOutboxService.applyProviderReceipt(
                    tenantId,
                    requestId,
                    messageId,
                    providerStatus,
                    providerErrorCode,
                    reason);
        }
        if (!updated && StringUtils.hasText(messageId)) {
            updated = notificationOutboxService.applyProviderReceiptByProviderMessageId(
                    tenantId,
                    messageId,
                    providerStatus,
                    providerErrorCode,
                    reason);
        }
        if (!updated) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Outbox message not found"));
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "MSG91 webhook receipt processed"));
    }

    private static String mapMsg91Status(String rawStatus) {
        if (!StringUtils.hasText(rawStatus)) {
            return "FAILED";
        }
        String normalized = rawStatus.trim().toUpperCase();
        return switch (normalized) {
            case "DELIVERED", "SUCCESS", "SENT" -> "DELIVERED";
            case "SUBMITTED", "QUEUED", "PROCESSING" -> "QUEUED";
            case "REJECTED", "FAILED", "UNDELIVERED", "DND", "INVALID" -> "FAILED";
            default -> normalized;
        };
    }

    private static String firstNonBlank(Map<String, Object> payload, String... keys) {
        if (payload == null || payload.isEmpty()) {
            return null;
        }
        for (String key : keys) {
            Object value = payload.get(key);
            if (value == null) {
                continue;
            }
            String text = String.valueOf(value).trim();
            if (!text.isEmpty()) {
                return text;
            }
        }
        return null;
    }
}
