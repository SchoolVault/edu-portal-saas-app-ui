package com.school.erp.modules.notification.dto;

import jakarta.validation.constraints.NotBlank;

public class NotificationWebhookDTOs {
    public record ProviderReceiptRequest(
            @NotBlank String tenantId,
            @NotBlank String correlationId,
            String providerMessageId,
            @NotBlank String providerStatus,
            String providerErrorCode,
            String providerErrorMessage) {}
}
