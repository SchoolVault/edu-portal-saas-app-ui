package com.school.erp.modules.chat.port;

import com.school.erp.common.exception.BusinessException;
import com.school.erp.modules.chat.entity.ChatMessage;
import com.school.erp.modules.chat.mongo.ChatMessageMongoDocument;
import com.school.erp.modules.chat.validation.ChatMessagePayloadValidator;
import com.school.erp.modules.chat.mongo.ChatMongoConfiguration;
import com.school.erp.modules.chat.mongo.ChatMongoSequenceService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * MongoDB-backed {@link ChatMessageStorePort}. Uses monotonic numeric ids for API compatibility with JPA.
 */
@Component
@ConditionalOnProperty(name = "app.chat.message-store", havingValue = "mongo")
public class MongoChatMessageStoreAdapter implements ChatMessageStorePort {

    private final MongoTemplate mongoTemplate;
    private final ChatMongoSequenceService sequenceService;

    public MongoChatMessageStoreAdapter(
            @Qualifier(ChatMongoConfiguration.CHAT_MONGO_TEMPLATE) MongoTemplate mongoTemplate,
            ChatMongoSequenceService sequenceService) {
        this.mongoTemplate = mongoTemplate;
        this.sequenceService = sequenceService;
    }

    @Override
    public Page<ChatMessage> pageByConversation(String tenantId, Long conversationId, Pageable pageable) {
        Criteria base = Criteria.where("tenantId").is(tenantId)
                .and("conversationId").is(conversationId)
                .and("isDeleted").is(false);
        Query countQuery = Query.query(base);
        long total = mongoTemplate.count(countQuery, ChatMessageMongoDocument.class);

        Query q = Query.query(base);
        q.with(pageable);
        if (!pageable.getSort().isSorted()) {
            q.with(Sort.by(Sort.Direction.DESC, "id"));
        }
        List<ChatMessageMongoDocument> docs = mongoTemplate.find(q, ChatMessageMongoDocument.class);
        List<ChatMessage> content = docs.stream().map(this::toEntity).collect(Collectors.toList());
        return new PageImpl<>(content, pageable, total);
    }

    @Override
    public ChatMessage save(ChatMessage message) {
        ChatMessagePayloadValidator.validateForSave(message);
        if (StringUtils.hasText(message.getClientMessageId())) {
            Query dup = Query.query(Criteria.where("tenantId").is(message.getTenantId())
                    .and("conversationId").is(message.getConversationId())
                    .and("clientMessageId").is(message.getClientMessageId())
                    .and("isDeleted").is(false));
            if (mongoTemplate.exists(dup, ChatMessageMongoDocument.class)) {
                throw new BusinessException("Duplicate clientMessageId for this conversation");
            }
        }

        LocalDateTime now = LocalDateTime.now();
        long id = sequenceService.nextMessageId();
        ChatMessageMongoDocument doc = toDocument(message, id, now);
        mongoTemplate.insert(doc);
        return toEntity(doc);
    }

    @Override
    public long countUnreadAfter(String tenantId, Long conversationId, long messageIdAfter, long excludeSenderUserId) {
        Query q = Query.query(Criteria.where("tenantId").is(tenantId)
                .and("conversationId").is(conversationId)
                .and("isDeleted").is(false)
                .and("id").gt(messageIdAfter)
                .and("senderUserId").ne(excludeSenderUserId));
        return mongoTemplate.count(q, ChatMessageMongoDocument.class);
    }

    private static ChatMessageMongoDocument toDocument(ChatMessage msg, long id, LocalDateTime now) {
        ChatMessageMongoDocument d = new ChatMessageMongoDocument();
        d.setId(id);
        d.setTenantId(msg.getTenantId());
        d.setConversationId(msg.getConversationId());
        d.setSenderUserId(msg.getSenderUserId());
        d.setSenderRole(msg.getSenderRole());
        d.setSenderName(msg.getSenderName());
        d.setBody(msg.getBody());
        d.setBodyType(msg.getBodyType() != null ? msg.getBodyType() : "text");
        d.setClientMessageId(msg.getClientMessageId());
        d.setIsActive(msg.getIsActive() != null ? msg.getIsActive() : true);
        d.setIsDeleted(msg.getIsDeleted() != null ? msg.getIsDeleted() : false);
        d.setDeletedAt(msg.getDeletedAt());
        d.setCreatedAt(now);
        d.setUpdatedAt(now);
        d.setCreatedBy(msg.getCreatedBy());
        d.setUpdatedBy(msg.getUpdatedBy());
        return d;
    }

    private ChatMessage toEntity(ChatMessageMongoDocument d) {
        ChatMessage m = new ChatMessage();
        m.setId(d.getId());
        m.setTenantId(d.getTenantId());
        m.setConversationId(d.getConversationId());
        m.setSenderUserId(d.getSenderUserId());
        m.setSenderRole(d.getSenderRole());
        m.setSenderName(d.getSenderName());
        m.setBody(d.getBody());
        m.setBodyType(d.getBodyType());
        m.setClientMessageId(d.getClientMessageId());
        m.setIsActive(d.getIsActive());
        m.setIsDeleted(d.getIsDeleted());
        m.setDeletedAt(d.getDeletedAt());
        m.setCreatedAt(d.getCreatedAt());
        m.setUpdatedAt(d.getUpdatedAt());
        m.setCreatedBy(d.getCreatedBy());
        m.setUpdatedBy(d.getUpdatedBy());
        return m;
    }
}
