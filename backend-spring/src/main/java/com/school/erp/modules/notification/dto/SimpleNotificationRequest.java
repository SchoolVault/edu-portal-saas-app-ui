package com.school.erp.modules.notification.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SimpleNotificationRequest {
    private String tenantId;
    private Long userId;
    private String recipientPhone;
    private String recipientEmail;
    private String subject;
    private String message;
    private NotificationMessageType type;
    private NotificationMessagePriority priority;
}
