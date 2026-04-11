package com.school.erp.modules.chat.repository;

import com.school.erp.modules.chat.entity.ChatConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatConversationRepository extends JpaRepository<ChatConversation, Long> {
    Optional<ChatConversation> findByIdAndIsDeletedFalse(Long id);

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

    /**
     * Direct threads that include both users (newest activity first). Caller should verify exactly two active participants.
     */
    @Query("""
            select distinct c from ChatConversation c, ChatParticipant p1, ChatParticipant p2
            where c.tenantId = :tenantId and c.isDeleted = false
              and lower(trim(c.type)) = 'direct'
              and p1.tenantId = c.tenantId and p1.conversationId = c.id and p1.isDeleted = false and p1.userId = :u1
              and p2.tenantId = c.tenantId and p2.conversationId = c.id and p2.isDeleted = false and p2.userId = :u2
            order by c.lastMessageAt desc nulls last, c.id desc
            """)
    List<ChatConversation> findDirectConversationsForUserPair(
            @Param("tenantId") String tenantId,
            @Param("u1") Long u1,
            @Param("u2") Long u2);
}

