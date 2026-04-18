package com.school.erp.modules.notification.mq;

import com.school.erp.common.enums.Enums;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

/**
 * Payload for RabbitMQ async notification tasks (SMS, Email, Push).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationTask implements Serializable {
    private String tenantId;
    private List<Long> userIds;
    private String title;
    private String message;
    private Enums.NotificationType type;
    private String link;
    private String channel; // SMS, EMAIL, PUSH, ALL
    private Map<String, Object> metadata;
}
