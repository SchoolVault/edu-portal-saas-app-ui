package com.school.erp.config;

import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Ensures {@code java.time} types (e.g. {@link java.time.LocalDate}) serialize for JSON APIs and Redis/cache,
 * even if classpath auto-discovery is incomplete in a given deployment.
 */
@Configuration
public class JacksonConfig {

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer registerJavaTimeModule() {
        return builder -> builder.modulesToInstall(JavaTimeModule.class);
    }
}
