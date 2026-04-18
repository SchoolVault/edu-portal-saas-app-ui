package com.school.erp.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * <p><strong>API JSON</strong> ({@code @Primary} {@link ObjectMapper}): plain JSON for HTTP and in-app use.
 * Do <strong>not</strong> enable Jackson default typing here — clients would have to send {@code @class}
 * metadata on every request body (e.g. logout DTOs), which breaks public REST contracts.</p>
 *
 * <p><strong>Redis</strong> ({@link #redisObjectMapper()}): separate mapper with default typing so
 * {@link org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer} can deserialize
 * cached values back to concrete DTO types (see {@link CacheConfig}).</p>
 */
@Configuration
public class JacksonConfig {

    public static final String REDIS_OBJECT_MAPPER = "redisObjectMapper";

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = JsonMapper.builder()
                .addModule(new JavaTimeModule())
                .build();
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }

    /**
     * Used only by Redis serializers (cache + {@link RedisConfig}). Keeps type metadata in Redis payloads
     * without polluting HTTP JSON semantics.
     */
    @Bean(REDIS_OBJECT_MAPPER)
    public ObjectMapper redisObjectMapper() {
        ObjectMapper mapper = JsonMapper.builder()
                .addModule(new JavaTimeModule())
                .build();
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );
        return mapper;
    }
}
