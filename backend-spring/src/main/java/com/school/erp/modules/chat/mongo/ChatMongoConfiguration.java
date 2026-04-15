package com.school.erp.modules.chat.mongo;

import com.mongodb.ConnectionString;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;

/**
 * Wires Mongo only when {@code app.chat.message-store=mongo}. Auto-configuration is excluded globally
 * ({@link com.school.erp.SchoolErpApplication}) so local {@code jpa} runs without a Mongo URI.
 */
@Configuration
@ConditionalOnProperty(name = "app.chat.message-store", havingValue = "mongo")
public class ChatMongoConfiguration {

    public static final String CHAT_MONGO_TEMPLATE = "chatMongoTemplate";
    public static final String CHAT_MONGO_CLIENT = "chatMongoClient";

    @Bean(name = CHAT_MONGO_CLIENT)
    public MongoClient chatMongoClient(org.springframework.core.env.Environment env) {
        String uri = env.getRequiredProperty("spring.data.mongodb.uri");
        return MongoClients.create(uri);
    }

    @Bean(name = CHAT_MONGO_TEMPLATE)
    public MongoTemplate chatMongoTemplate(@Qualifier(CHAT_MONGO_CLIENT) MongoClient client,
                                           org.springframework.core.env.Environment env) {
        String uri = env.getRequiredProperty("spring.data.mongodb.uri");
        ConnectionString cs = new ConnectionString(uri);
        String db = cs.getDatabase() != null ? cs.getDatabase() : "school_erp_chat";
        return new MongoTemplate(client, db);
    }
}
