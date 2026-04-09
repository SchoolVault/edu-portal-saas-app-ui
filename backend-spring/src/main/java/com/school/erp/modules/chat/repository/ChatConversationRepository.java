package com.school.erp.modules.chat.repository;

import com.school.erp.modules.chat.entity.ChatConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatConversationRepository extends JpaRepository<ChatConversation, Long> {
    Optional<ChatConversation> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    @Query("""
            select c from ChatConversation c
            where c.tenantId = :tenantId and c.isDeleted = false
              and exists (
                select p.id from ChatParticipant p
                where p.tenantId = :tenantId and p.isDeleted = false
                  and p.conversationId = c.id and p.userId = :userId
              )
            order by c.lastMessageAt desc nulls last, c.id desc
            """)
    List<ChatConversation> findInbox(@Param("tenantId") String tenantId, @Param("userId") Long userId);
}

