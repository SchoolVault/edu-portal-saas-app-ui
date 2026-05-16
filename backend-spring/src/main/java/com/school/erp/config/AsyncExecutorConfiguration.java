package com.school.erp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.Executor;

/**
 * Default async pool + dedicated import job executor (fairness: bulk work does not starve other {@code @Async} tasks).
 * Pool sizes are driven by {@link ImportRuntimeProperties} ({@code app.import.executor-*}).
 */
@Configuration
@EnableAsync
public class AsyncExecutorConfiguration implements AsyncConfigurer {

    @Bean(name = "rbacBootstrapExecutor")
    public TaskExecutor rbacBootstrapExecutor(
            @Value("${app.rbac.bootstrap.executor.pool-size:2}") int configuredPoolSize,
            @Value("${app.rbac.bootstrap.executor.queue-capacity:100}") int configuredQueueCapacity,
            @Value("${app.rbac.bootstrap.executor.await-termination-seconds:30}") int configuredAwaitTerminationSeconds) {
        int poolSize = Math.max(1, configuredPoolSize);
        int queueCapacity = Math.max(1, configuredQueueCapacity);
        int awaitTerminationSeconds = Math.max(5, configuredAwaitTerminationSeconds);

        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(poolSize);
        executor.setMaxPoolSize(poolSize);
        executor.setQueueCapacity(queueCapacity);
        executor.setThreadNamePrefix("sv-rbac-bootstrap-");
        executor.setTaskDecorator(new TenantAndMdcTaskDecorator());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(awaitTerminationSeconds);
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }

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
