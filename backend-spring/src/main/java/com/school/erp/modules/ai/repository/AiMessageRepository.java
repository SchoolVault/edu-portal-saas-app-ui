package com.school.erp.modules.ai.repository;

import com.school.erp.modules.ai.domain.AiMessage;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AiMessageRepository extends JpaRepository<AiMessage, Long> {
    List<AiMessage> findTop20ByTenantIdAndConversationKeyAndIsDeletedFalseOrderByIdDesc(String tenantId, String conversationKey);
    List<AiMessage> findByTenantIdAndConversationKeyAndIsDeletedFalseOrderByIdAsc(String tenantId, String conversationKey);
    long countByCreatedAtBefore(LocalDateTime cutoff);
    int deleteByCreatedAtBefore(LocalDateTime cutoff);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE AiMessage m SET m.isDeleted = true, m.isActive = false, m.deletedAt = :now, m.updatedAt = :now WHERE m.tenantId = :tenantId AND m.conversationKey = :conversationKey AND m.isDeleted = false")
    int softDeleteByConversationKey(
            @Param("tenantId") String tenantId,
            @Param("conversationKey") String conversationKey,
            @Param("now") LocalDateTime now);
}
