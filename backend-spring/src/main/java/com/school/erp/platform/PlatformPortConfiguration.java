package com.school.erp.platform;

import com.school.erp.platform.port.AnalyticsEventPublisher;
import com.school.erp.platform.port.DomainEventPublisher;
import com.school.erp.platform.port.SearchIndexService;
import com.school.erp.platform.port.internal.NoOpAnalyticsEventPublisher;
import com.school.erp.platform.port.internal.NoOpSearchIndexService;
import com.school.erp.platform.port.internal.SpringDomainEventPublisher;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registers default (no-op / Spring) platform ports. Provide your own {@code @Bean} of the same
 * type to plug ClickHouse, OpenSearch, Kafka, etc., without changing feature modules.
 */
@Configuration
public class PlatformPortConfiguration {

    @Bean
    @ConditionalOnMissingBean(AnalyticsEventPublisher.class)
    public AnalyticsEventPublisher analyticsEventPublisher() {
        return new NoOpAnalyticsEventPublisher();
    }

    @Bean
    @ConditionalOnMissingBean(SearchIndexService.class)
    public SearchIndexService searchIndexService() {
        return new NoOpSearchIndexService();
    }

    @Bean
    @ConditionalOnMissingBean(DomainEventPublisher.class)
    public DomainEventPublisher domainEventPublisher(ApplicationEventPublisher applicationEventPublisher) {
        return new SpringDomainEventPublisher(applicationEventPublisher);
    }
}
