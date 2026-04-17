package com.school.erp.modules.chat.mongo;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.chat.message-store", havingValue = "mongo")
public class ChatMongoIndexInitializer {

    private final MongoTemplate mongoTemplate;

    public ChatMongoIndexInitializer(@Qualifier(ChatMongoConfiguration.CHAT_MONGO_TEMPLATE) MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @PostConstruct
    public void ensureIndexes() {
        mongoTemplate.indexOps(ChatMessageMongoDocument.class)
                .ensureIndex(new Index()
                        .on("tenantId", Sort.Direction.ASC)
                        .on("conversationId", Sort.Direction.ASC)
                        .on("isDeleted", Sort.Direction.ASC)
                        .on("id", Sort.Direction.DESC)
                        .named("idx_tenant_conv_del_id"));
        mongoTemplate.indexOps(ChatMessageMongoDocument.class)
                .ensureIndex(new Index()
                        .on("tenantId", Sort.Direction.ASC)
                        .on("conversationId", Sort.Direction.ASC)
                        .on("clientMessageId", Sort.Direction.ASC)
                        .named("idx_tenant_conv_clientMsg")
                        .sparse());
    }
}
