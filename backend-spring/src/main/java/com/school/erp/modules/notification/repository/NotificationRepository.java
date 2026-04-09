package com.school.erp.modules.notification.repository;
import com.school.erp.modules.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByTenantIdAndUserIdOrderByCreatedAtDesc(String tenantId, Long userId);
    long countByTenantIdAndUserIdAndIsReadFalse(String tenantId, Long userId);

    Optional<Notification> findByIdAndTenantIdAndUserIdAndIsDeletedFalse(Long id, String tenantId, Long userId);
}
