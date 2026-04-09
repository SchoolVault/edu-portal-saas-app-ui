package com.school.erp.modules.chat.repository;

import com.school.erp.modules.chat.entity.ChatParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatParticipantRepository extends JpaRepository<ChatParticipant, Long> {
    Optional<ChatParticipant> findByTenantIdAndConversationIdAndUserIdAndIsDeletedFalse(String tenantId, Long conversationId, Long userId);
    List<ChatParticipant> findByTenantIdAndConversationIdAndIsDeletedFalse(String tenantId, Long conversationId);

    @Query("""
            select p from ChatParticipant p
            where p.tenantId = :tenantId and p.isDeleted = false and p.userId = :userId
            """)
    List<ChatParticipant> findByUser(@Param("tenantId") String tenantId, @Param("userId") Long userId);
}

