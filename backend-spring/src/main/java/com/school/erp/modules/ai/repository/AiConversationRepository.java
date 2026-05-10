package com.school.erp.modules.ai.repository;

import com.school.erp.modules.ai.domain.AiConversation;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AiConversationRepository extends JpaRepository<AiConversation, Long> {
    Optional<AiConversation> findByTenantIdAndConversationKeyAndIsDeletedFalse(String tenantId, String conversationKey);
    Optional<AiConversation> findByTenantIdAndConversationKeyAndStartedByUserIdAndIsDeletedFalse(
            String tenantId, String conversationKey, Long startedByUserId);
    List<AiConversation> findTop50ByTenantIdAndStartedByUserIdAndIsDeletedFalseOrderByUpdatedAtDesc(String tenantId, Long startedByUserId);
    long countByCreatedAtBefore(LocalDateTime cutoff);
    int deleteByCreatedAtBefore(LocalDateTime cutoff);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE AiConversation c SET c.title = :title, c.updatedAt = :now WHERE c.tenantId = :tenantId AND c.conversationKey = :conversationKey AND c.startedByUserId = :userId AND c.isDeleted = false")
    int renameConversation(
            @Param("tenantId") String tenantId,
            @Param("conversationKey") String conversationKey,
            @Param("userId") Long userId,
            @Param("title") String title,
            @Param("now") LocalDateTime now);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE AiConversation c SET c.isDeleted = true, c.isActive = false, c.deletedAt = :now, c.updatedAt = :now WHERE c.tenantId = :tenantId AND c.conversationKey = :conversationKey AND c.startedByUserId = :userId AND c.isDeleted = false")
    int softDeleteConversation(
            @Param("tenantId") String tenantId,
            @Param("conversationKey") String conversationKey,
            @Param("userId") Long userId,
            @Param("now") LocalDateTime now);
}
