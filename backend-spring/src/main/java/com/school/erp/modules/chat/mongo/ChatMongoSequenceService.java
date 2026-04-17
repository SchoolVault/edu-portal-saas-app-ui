package com.school.erp.modules.chat.mongo;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
@ConditionalOnProperty(name = "app.chat.message-store", havingValue = "mongo")
public class ChatMongoSequenceService {

    private final MongoTemplate mongoTemplate;

    public ChatMongoSequenceService(@Qualifier(ChatMongoConfiguration.CHAT_MONGO_TEMPLATE) MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    public long nextMessageId() {
        Query q = Query.query(where("_id").is(ChatMongoCounterDocument.MESSAGE_ID_KEY));
        Update u = new Update().inc("seq", 1);
        FindAndModifyOptions opts = new FindAndModifyOptions().returnNew(true).upsert(true);
        ChatMongoCounterDocument doc = mongoTemplate.findAndModify(q, u, opts, ChatMongoCounterDocument.class);
        if (doc == null || doc.getSeq() <= 0) {
            throw new IllegalStateException("Failed to allocate chat message id from Mongo counter");
        }
        return doc.getSeq();
    }
}
