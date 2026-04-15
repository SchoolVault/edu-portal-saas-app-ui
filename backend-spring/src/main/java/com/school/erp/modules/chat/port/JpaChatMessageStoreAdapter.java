package com.school.erp.modules.chat.port;

import com.school.erp.modules.chat.entity.ChatMessage;
import com.school.erp.modules.chat.validation.ChatMessagePayloadValidator;
import com.school.erp.modules.chat.repository.ChatMessageRepository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.chat.message-store", havingValue = "jpa", matchIfMissing = true)
public class JpaChatMessageStoreAdapter implements ChatMessageStorePort {

    private final ChatMessageRepository repository;

    public JpaChatMessageStoreAdapter(ChatMessageRepository repository) {
        this.repository = repository;
    }

    @Override
    public Page<ChatMessage> pageByConversation(String tenantId, Long conversationId, Pageable pageable) {
        return repository.findByTenantIdAndConversationIdAndIsDeletedFalseOrderByIdDesc(tenantId, conversationId, pageable);
    }

    @Override
    public ChatMessage save(ChatMessage message) {
        ChatMessagePayloadValidator.validateForSave(message);
        return repository.save(message);
    }

    @Override
    public long countUnreadAfter(String tenantId, Long conversationId, long messageIdAfter, long excludeSenderUserId) {
        return repository.countByTenantIdAndConversationIdAndIsDeletedFalseAndIdGreaterThanAndSenderUserIdNot(
                tenantId, conversationId, messageIdAfter, excludeSenderUserId);
    }
}
