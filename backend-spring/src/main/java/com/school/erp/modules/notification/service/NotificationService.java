package com.school.erp.modules.notification.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.config.RabbitMQConfig;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.fees.entity.FeePayment;
import com.school.erp.modules.fees.repository.FeePaymentRepository;
import com.school.erp.modules.guardian.service.GuardianService;
import com.school.erp.modules.notification.entity.Notification;
import com.school.erp.modules.notification.repository.NotificationRepository;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.tenant.TenantContext;
import com.school.erp.tenant.TenantQueryPolicy;
import jakarta.annotation.Nullable;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class NotificationService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(NotificationService.class);
    private final NotificationRepository repo;
    @Nullable
    private final RabbitTemplate rabbitTemplate;
    private final GuardianService guardianService;
    private final FeePaymentRepository feePaymentRepository;

    @Transactional(readOnly = true)
    public List<Notification> getUserNotifications() {
        String tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();
        List<Notification> raw = new ArrayList<>(repo.findByTenantIdAndUserIdOrderByCreatedAtDesc(tenantId, userId));
        if (isSuperAdminRole()) {
            return raw.stream().filter(this::isPlatformOperatorNotification).collect(Collectors.toList());
        }
        if (isParentRole()) {
            raw.addAll(buildParentFeeReminderNotifications(tenantId, userId));
            raw.sort(Comparator.comparing((Notification n) -> n.getCreatedAt() != null ? n.getCreatedAt() : LocalDateTime.MIN).reversed());
        }
        return raw;
    }

    private boolean isParentRole() {
        String r = TenantContext.getUserRole();
        return r != null && "parent".equalsIgnoreCase(r);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount() {
        if (isSuperAdminRole()) {
            return getUserNotifications().stream().filter(n -> !Boolean.TRUE.equals(n.getIsRead())).count();
        }
        if (isParentRole()) {
            return getUserNotifications().stream().filter(n -> !Boolean.TRUE.equals(n.getIsRead())).count();
        }
        return repo.countByTenantIdAndUserIdAndIsReadFalse(TenantContext.getTenantId(), TenantContext.getUserId());
    }

    private static boolean isSuperAdminRole() {
        String r = TenantContext.getUserRole();
        if (r == null) {
            return false;
        }
        return "SUPER_ADMIN".equalsIgnoreCase(r) || "super_admin".equalsIgnoreCase(r);
    }

    /**
     * Super-admins should not see per-school operational toasts (admissions, fees, class attendance, etc.).
     */
    private boolean isPlatformOperatorNotification(Notification n) {
        String title = n.getTitle() != null ? n.getTitle().toLowerCase(Locale.ROOT) : "";
        String link = n.getLink() != null ? n.getLink().toLowerCase(Locale.ROOT) : "";
        if (link.contains("/super-admin") || link.contains("/platform-") || link.contains("/platform/")) {
            return true;
        }
        if (title.contains("platform") || title.contains("subscription") || title.contains("workspace")
                || title.contains("tenant") || title.contains("billing") || title.contains("maintenance")
                || title.contains("broadcast") || title.contains("purge") || title.contains("onboard")) {
            return true;
        }
        return false;
    }

    @Transactional
    public void markAsRead(Long id) {
        if (id != null && id < 0) {
            log.debug("Ignoring mark read for synthetic fee reminder id={}", id);
            return;
        }
        Long uid = TenantContext.getUserId();
        Notification n;
        if (TenantQueryPolicy.isPlatformSuperAdmin()) {
            n = repo.findById(id).filter(x -> !Boolean.TRUE.equals(x.getIsDeleted())).orElseThrow(() -> new ResourceNotFoundException("Notification", id));
        } else {
            n = repo.findByIdAndTenantIdAndUserIdAndIsDeletedFalse(id, TenantContext.getTenantId(), uid)
                    .orElseThrow(() -> new ResourceNotFoundException("Notification", id));
        }
        n.setIsRead(true);
        repo.save(n);
    }

    @Transactional
    public void markAllAsRead() {
        String tenantId = TenantContext.getTenantId();
        Long uid = TenantContext.getUserId();
        if (isSuperAdminRole()) {
            getUserNotifications().stream()
                    .filter(n -> !Boolean.TRUE.equals(n.getIsRead()) && n.getId() != null && n.getId() > 0)
                    .forEach(n -> {
                        n.setIsRead(true);
                        repo.save(n);
                    });
            return;
        }
        repo.findByTenantIdAndUserIdOrderByCreatedAtDesc(tenantId, uid).stream()
                .filter(n -> !Boolean.TRUE.equals(n.getIsRead()))
                .forEach(n -> {
                    n.setIsRead(true);
                    repo.save(n);
                });
    }

    private List<Notification> buildParentFeeReminderNotifications(String tenantId, Long parentUserId) {
        List<Student> children = guardianService.findStudentsForParentUser(tenantId, parentUserId);
        if (children.isEmpty()) {
            return List.of();
        }
        Set<Long> childIds = children.stream().map(Student::getId).collect(Collectors.toSet());
        LocalDate today = LocalDate.now();
        List<Notification> out = new ArrayList<>();
        for (FeePayment p : feePaymentRepository.findByTenantIdAndIsDeletedFalse(tenantId)) {
            if (!childIds.contains(p.getStudentId()) || !isFeeDueForParentReminder(p, today)) {
                continue;
            }
            String studentLabel = p.getStudentName() != null ? p.getStudentName() : "your child";
            BigDecimal due = p.getDueAmount() != null ? p.getDueAmount() : BigDecimal.ZERO;
            String dueBit = p.getDueDate() != null ? " Due by " + p.getDueDate() + "." : "";
            Notification n = Notification.builder()
                    .title("Fee payment reminder")
                    .message("Outstanding fee for " + studentLabel + ": " + due + "." + dueBit)
                    .type(Enums.NotificationType.WARNING)
                    .userId(parentUserId)
                    .isRead(false)
                    .link("/app/parent")
                    .build();
            n.setTenantId(tenantId);
            n.setId(-p.getId());
            n.setCreatedAt(LocalDateTime.now());
            out.add(n);
        }
        return out;
    }

    private static boolean isFeeDueForParentReminder(FeePayment p, LocalDate today) {
        if (p.getStatus() == Enums.FeeStatus.OVERDUE) {
            return true;
        }
        if (p.getStatus() == Enums.FeeStatus.UNPAID || p.getStatus() == Enums.FeeStatus.PARTIAL) {
            if (p.getDueDate() == null) {
                return false;
            }
            return !p.getDueDate().isAfter(today.plusDays(14));
        }
        return false;
    }

    /**
     * Create notification and optionally publish to RabbitMQ for async processing (email, SMS)
     */
    @Transactional
    public Notification createNotification(String tenantId, Long userId, String title, String message, Enums.NotificationType type, String link) {
        Notification n = Notification.builder().title(title).message(message).type(type).userId(userId).isRead(false).link(link).build();
        n.setTenantId(tenantId);
        repo.save(n);
        if (rabbitTemplate != null) {
            try {
                rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, "event.notification.created", Map.of("tenantId", tenantId, "userId", userId, "title", title, "message", message));
            } catch (Exception e) {
                log.warn("Failed to publish notification event: {}", e.getMessage());
            }
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

    public NotificationService(
            final NotificationRepository repo,
            @Autowired(required = false) @Nullable RabbitTemplate rabbitTemplate,
            final GuardianService guardianService,
            final FeePaymentRepository feePaymentRepository) {
        this.repo = repo;
        this.rabbitTemplate = rabbitTemplate;
        this.guardianService = guardianService;
        this.feePaymentRepository = feePaymentRepository;
    }
}
