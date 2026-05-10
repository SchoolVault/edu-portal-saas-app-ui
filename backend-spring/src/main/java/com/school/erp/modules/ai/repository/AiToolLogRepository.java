package com.school.erp.modules.ai.repository;

import com.school.erp.modules.ai.domain.AiToolLog;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AiToolLogRepository extends JpaRepository<AiToolLog, Long> {
    List<AiToolLog> findTop20ByTenantIdAndConversationKeyAndIsDeletedFalseOrderByIdDesc(String tenantId, String conversationKey);
    long countByCreatedAtBefore(LocalDateTime cutoff);
    int deleteByCreatedAtBefore(LocalDateTime cutoff);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE AiToolLog t SET t.isDeleted = true, t.isActive = false, t.deletedAt = :now, t.updatedAt = :now WHERE t.tenantId = :tenantId AND t.conversationKey = :conversationKey AND t.isDeleted = false")
    int softDeleteByConversationKey(
            @Param("tenantId") String tenantId,
            @Param("conversationKey") String conversationKey,
            @Param("now") LocalDateTime now);
}
