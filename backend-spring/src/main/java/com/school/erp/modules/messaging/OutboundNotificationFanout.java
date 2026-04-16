package com.school.erp.modules.messaging;

import com.school.erp.config.RabbitMQConfig;
import com.school.erp.modules.messaging.dto.OutboundJobMessage;
import jakarta.annotation.Nullable;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Publishes outbound comms jobs to RabbitMQ so HTTP handlers stay fast. Safe no-op when AMQP is disabled.
 */
@Component
public class OutboundNotificationFanout {
    private static final Logger log = LoggerFactory.getLogger(OutboundNotificationFanout.class);

    @Nullable
    private final RabbitTemplate rabbitTemplate;

    public OutboundNotificationFanout(@Autowired(required = false) @Nullable RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishAfterBroadcast(String jobType, List<String> tenantIds, String title, String message, int notificationRows) {
        if (rabbitTemplate == null) {
            log.debug("Outbound fan-out skipped (no RabbitTemplate) jobType={} tenants={}", jobType, tenantIds.size());
            return;
        }
        OutboundJobMessage msg = new OutboundJobMessage();
        msg.setJobType(jobType);
        msg.setCorrelationId(UUID.randomUUID().toString());
        msg.setTenantIds(tenantIds);
        msg.setTitle(title);
        msg.setBody(message);
        msg.setChannels(List.of("IN_APP", "EMAIL", "SMS"));
        msg.setMetadata(Map.of("notificationRowsCreated", notificationRows));
        try {
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, "event.outbound.notification", msg);
            log.info("Published outbound job type={} correlationId={} tenants={}", jobType, msg.getCorrelationId(), tenantIds.size());
        } catch (Exception e) {
            log.warn("Outbound publish failed: {}", e.getMessage());
        }
    }
}
