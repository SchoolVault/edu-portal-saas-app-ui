package com.school.erp.modules.messaging;

import com.school.erp.config.RabbitMQConfig;
import com.school.erp.modules.messaging.dto.OutboundJobMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Component;

/**
 * Placeholder async processor — replace with SES/Twilio/FCM workers. Keeps API latency low.
 */
@Component
@ConditionalOnBean(ConnectionFactory.class)
public class OutboundJobListener {
    private static final Logger log = LoggerFactory.getLogger(OutboundJobListener.class);

    @RabbitListener(queues = RabbitMQConfig.OUTBOUND_JOBS_QUEUE)
    public void handle(OutboundJobMessage message) {
        if (message == null) {
            return;
        }
        log.info("Outbound job received type={} correlationId={} tenants={} channels={}",
                message.getJobType(),
                message.getCorrelationId(),
                message.getTenantIds() != null ? message.getTenantIds().size() : 0,
                message.getChannels());
    }
}
