package com.school.erp.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.common.idempotency.IdempotencyFilter;
import com.school.erp.common.idempotency.IdempotencyProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.data.redis.core.StringRedisTemplate;

@Configuration
@EnableConfigurationProperties(IdempotencyProperties.class)
public class IdempotencyConfiguration {

    @Bean
    @ConditionalOnBean(StringRedisTemplate.class)
    @ConditionalOnProperty(name = "app.idempotency.enabled", havingValue = "true", matchIfMissing = true)
    public IdempotencyFilter idempotencyFilter(
            StringRedisTemplate redis,
            ObjectMapper objectMapper,
            IdempotencyProperties props,
            Environment env) {
        String ns = env.getProperty("app.redis.key-namespace", "sv");
        return new IdempotencyFilter(redis, objectMapper, props, ns);
    }
}
