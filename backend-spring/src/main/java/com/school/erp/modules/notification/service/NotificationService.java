package com.school.erp.modules.notification.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.config.RabbitMQConfig;
import com.school.erp.modules.notification.entity.Notification;
import com.school.erp.modules.notification.repository.NotificationRepository;
import com.school.erp.tenant.TenantContext;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(NotificationService.class);
    private final NotificationRepository repo;
    private final RabbitTemplate rabbitTemplate;

    @Transactional(readOnly = true)
    public List<Notification> getUserNotifications() {
        return repo.findByTenantIdAndUserIdOrderByCreatedAtDesc(TenantContext.getTenantId(), TenantContext.getUserId());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount() {
        return repo.countByTenantIdAndUserIdAndIsReadFalse(TenantContext.getTenantId(), TenantContext.getUserId());
    }

    @Transactional
    public void markAsRead(Long id) {
        repo.findById(id).ifPresent(n -> {
            n.setIsRead(true);
            repo.save(n);
        });
    }

    @Transactional
    public void markAllAsRead() {
        getUserNotifications().stream().filter(n -> !n.getIsRead()).forEach(n -> {
            n.setIsRead(true);
            repo.save(n);
        });
    }

    /**
     * Create notification and optionally publish to RabbitMQ for async processing (email, SMS)
     */
    @Transactional
    public Notification createNotification(String tenantId, Long userId, String title, String message, Enums.NotificationType type, String link) {
        Notification n = Notification.builder().title(title).message(message).type(type).userId(userId).isRead(false).link(link).build();
        n.setTenantId(tenantId);
        repo.save(n);
        // Publish event for async processing
        try {
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, "event.notification.created", Map.of("tenantId", tenantId, "userId", userId, "title", title, "message", message));
        } catch (Exception e) {
            log.warn("Failed to publish notification event: {}", e.getMessage());
        }
        return n;
    }

    /**
     * Convenience methods for common notification types
     */
    public void notifyStudentCreated(String tenantId, Long adminUserId, String studentName) {
        createNotification(tenantId, adminUserId, "New Admission", studentName + " has been admitted", Enums.NotificationType.SUCCESS, "/app/students");
    }

    public void notifyFeePayment(String tenantId, Long adminUserId, String studentName, String amount) {
        createNotification(tenantId, adminUserId, "Fee Payment Received", "Payment of " + amount + " received from " + studentName, Enums.NotificationType.INFO, "/app/fees");
    }

    public void notifyAttendanceAlert(String tenantId, Long adminUserId, String className, double percentage) {
        createNotification(tenantId, adminUserId, "Attendance Alert", className + " has " + percentage + "% attendance today", Enums.NotificationType.WARNING, "/app/attendance");
    }

    public void notifyExamSchedule(String tenantId, Long userId, String examName) {
        createNotification(tenantId, userId, "Exam Schedule", examName + " schedule has been published", Enums.NotificationType.INFO, "/app/exams");
    }

    public NotificationService(final NotificationRepository repo, final RabbitTemplate rabbitTemplate) {
        this.repo = repo;
        this.rabbitTemplate = rabbitTemplate;
    }
}
