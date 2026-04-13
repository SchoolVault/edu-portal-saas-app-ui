package com.school.erp.config.datasource;

import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.util.StringUtils;

/**
 * Enables read-replica routing only when {@code app.datasource.read.url} is non-blank
 * (typically from env {@code READ_DATASOURCE_URL}).
 */
public final class ReadReplicaEnabledCondition implements Condition {

    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        String url = context.getEnvironment().getProperty("app.datasource.read.url", "");
        return StringUtils.hasText(url != null ? url.trim() : "");
    }
}
