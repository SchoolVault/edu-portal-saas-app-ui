package com.school.erp.modules.chat.repository;

import com.school.erp.modules.chat.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    Page<ChatMessage> findByTenantIdAndConversationIdAndIsDeletedFalseOrderByIdDesc(String tenantId, Long conversationId, Pageable pageable);

    long countByTenantIdAndConversationIdAndIsDeletedFalseAndIdGreaterThanAndSenderUserIdNot(
            String tenantId, Long conversationId, Long idAfter, Long excludeSenderUserId);
}

