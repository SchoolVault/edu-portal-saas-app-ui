package com.school.erp.modules.chat.port;

import com.school.erp.modules.chat.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Chat message persistence port (MySQL/JPA default; {@link MongoChatMessageStoreAdapter} when {@code app.chat.message-store=mongo}).
 */
public interface ChatMessageStorePort {

    Page<ChatMessage> pageByConversation(String tenantId, Long conversationId, Pageable pageable);

    ChatMessage save(ChatMessage message);

    long countUnreadAfter(String tenantId, Long conversationId, long messageIdAfter, long excludeSenderUserId);
}
