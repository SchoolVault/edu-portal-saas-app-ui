package com.school.erp.modules.exams.repository;

import com.school.erp.modules.exams.entity.ParentExamNotificationPreference;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParentExamNotificationPreferenceRepository extends JpaRepository<ParentExamNotificationPreference, Long> {
    Optional<ParentExamNotificationPreference> findByTenantIdAndUserIdAndIsDeletedFalse(String tenantId, Long userId);
}
