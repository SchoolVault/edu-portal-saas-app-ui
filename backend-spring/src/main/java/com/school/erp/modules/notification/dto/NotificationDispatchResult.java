package com.school.erp.modules.notification.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NotificationDispatchResult {
    private boolean success;
    private String channel;
    private String messageId;
    private String errorMessage;
    private long deliveryTimeMs;

    public static NotificationDispatchResult success(String channel, String messageId) {
        return NotificationDispatchResult.builder()
                .success(true)
                .channel(channel)
                .messageId(messageId)
                .build();
    }

    public static NotificationDispatchResult failed(String errorMessage) {
        return NotificationDispatchResult.builder()
                .success(false)
                .errorMessage(errorMessage)
                .build();
    }
}
