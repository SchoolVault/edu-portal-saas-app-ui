package com.school.erp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Default async pool + dedicated import job executor (fairness: bulk work does not starve other {@code @Async} tasks).
 * Pool sizes are driven by {@link ImportRuntimeProperties} ({@code app.import.executor-*}).
 */
@Configuration
@EnableAsync
@EnableConfigurationProperties(AiExecutorProperties.class)
public class AsyncExecutorConfiguration implements AsyncConfigurer {

    @Bean(name = "importJobExecutor")
    public Executor importJobExecutor(ImportRuntimeProperties importRuntimeProperties) {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        int core = Math.max(1, importRuntimeProperties.getExecutorCorePoolSize());
        int max = Math.max(core, importRuntimeProperties.getExecutorMaxPoolSize());
        int queue = Math.max(1, importRuntimeProperties.getExecutorQueueCapacity());
        executor.setCorePoolSize(core);
        executor.setMaxPoolSize(max);
        executor.setQueueCapacity(queue);
        executor.setThreadNamePrefix("sv-import-");
        executor.setTaskDecorator(new TenantAndMdcTaskDecorator());
        executor.initialize();
        return executor;
    }

    /** Dedicated pool for AI streaming/orchestration so import jobs cannot starve agent responses. */
    @Bean(name = "aiAgentExecutor")
    public Executor aiAgentExecutor(AiExecutorProperties aiExecutorProperties) {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        int core = Math.max(1, aiExecutorProperties.getCorePoolSize());
        int max = Math.max(core, aiExecutorProperties.getMaxPoolSize());
        int queue = Math.max(1, aiExecutorProperties.getQueueCapacity());
        executor.setCorePoolSize(core);
        executor.setMaxPoolSize(max);
        executor.setQueueCapacity(queue);
        executor.setThreadNamePrefix(
                (aiExecutorProperties.getThreadNamePrefix() == null || aiExecutorProperties.getThreadNamePrefix().isBlank())
                        ? "sv-ai-agent-"
                        : aiExecutorProperties.getThreadNamePrefix().trim());
        executor.setAllowCoreThreadTimeOut(aiExecutorProperties.isAllowCoreThreadTimeout());
        executor.setKeepAliveSeconds(Math.max(10, aiExecutorProperties.getKeepAliveSeconds()));
        executor.setTaskDecorator(new TenantAndMdcTaskDecorator());
        executor.initialize();
        return executor;
    }

    @Override
    @Primary
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(32);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("sv-async-");
        executor.setTaskDecorator(new TenantAndMdcTaskDecorator());
        executor.initialize();
        return executor;
    }
}
