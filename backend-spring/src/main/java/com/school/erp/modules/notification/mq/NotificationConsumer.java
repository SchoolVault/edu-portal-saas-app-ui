package com.school.erp.modules.notification.mq;

import com.school.erp.config.RabbitMQConfig;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.notification.dto.SimpleNotificationRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationConsumer {

    private final com.school.erp.modules.notification.service.NotificationService inAppNotificationService;
    private final com.school.erp.modules.notification.NotificationService dispatchService;
    private final UserRepository userRepository;

    @RabbitListener(queues = RabbitMQConfig.NOTIFICATION_QUEUE)
    public void handleNotificationTask(NotificationTask task) {
        log.info("Received notification task: tenant={} users={} title={}", 
                task.getTenantId(), task.getUserIds() != null ? task.getUserIds().size() : 0, task.getTitle());
        
        if (task.getUserIds() == null || task.getUserIds().isEmpty()) {
            log.warn("Notification task has no users, skipping.");
            return;
        }

        for (Long userId : task.getUserIds()) {
            try {
                // 1. Create In-App Notification
                inAppNotificationService.createNotification(
                        task.getTenantId(),
                        userId,
                        task.getTitle(),
                        task.getMessage(),
                        task.getType(),
                        task.getLink()
                );

                // 2. Dispatch to other channels (SMS/Email) if requested
                if (task.getChannel() != null && (task.getChannel().equals("ALL") || task.getChannel().contains("SMS") || task.getChannel().contains("EMAIL"))) {
                    User user = userRepository.findById(userId).orElse(null);
                    if (user != null) {
                        SimpleNotificationRequest dispatchReq = SimpleNotificationRequest.builder()
                                .tenantId(task.getTenantId())
                                .userId(userId)
                                .recipientPhone(user.getPhone())
                                .recipientEmail(user.getEmail())
                                .subject(task.getTitle())
                                .message(task.getMessage())
                                .build();
                        dispatchService.sendNotification(dispatchReq);
                    }
                }
            } catch (Exception e) {
                log.error("Failed to process notification for user {}: {}", userId, e.getMessage());
            }
        }
    }
}
