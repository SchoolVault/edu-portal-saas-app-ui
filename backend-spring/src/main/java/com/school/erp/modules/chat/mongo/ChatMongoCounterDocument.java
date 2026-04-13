package com.school.erp.modules.chat.mongo;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Atomic counter document for monotonic {@link ChatMessageMongoDocument} ids.
 */
@Document(collection = "chat_counters")
public class ChatMongoCounterDocument {

    public static final String MESSAGE_ID_KEY = "chat_message_id";

    @Id
    private String id;
    private long seq;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public long getSeq() {
        return seq;
    }

    public void setSeq(long seq) {
        this.seq = seq;
    }
}
