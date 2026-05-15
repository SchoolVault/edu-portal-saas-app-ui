package com.school.erp.modules.exams.repository;

import com.school.erp.modules.exams.entity.ParentExamNotificationState;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParentExamNotificationStateRepository extends JpaRepository<ParentExamNotificationState, Long> {
    Optional<ParentExamNotificationState> findByTenantIdAndUserIdAndExamIdAndEventTypeAndIsDeletedFalse(
            String tenantId, Long userId, Long examId, String eventType);

    List<ParentExamNotificationState> findByTenantIdAndUserIdAndIsDeletedFalseOrderByUpdatedAtDesc(String tenantId, Long userId);

    long countByTenantIdAndUserIdAndIsDeletedFalseAndLastReadAtIsNull(String tenantId, Long userId);
}
