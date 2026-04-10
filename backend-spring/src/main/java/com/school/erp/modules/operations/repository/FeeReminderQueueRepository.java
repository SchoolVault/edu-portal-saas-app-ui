package com.school.erp.modules.operations.repository;

import com.school.erp.modules.operations.entity.FeeReminderQueue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FeeReminderQueueRepository extends JpaRepository<FeeReminderQueue, Long> {

    List<FeeReminderQueue> findByTenantIdAndStatusAndIsDeletedFalseOrderByScheduledAtAsc(String tenantId, String status);

    Optional<FeeReminderQueue> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
