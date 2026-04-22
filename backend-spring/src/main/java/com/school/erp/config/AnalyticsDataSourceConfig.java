package com.school.erp.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

@Configuration
public class AnalyticsDataSourceConfig {

    @Bean
    @ConfigurationProperties("app.analytics.datasource")
    @ConditionalOnExpression("T(org.springframework.util.StringUtils).hasText('${app.analytics.datasource.url:}')")
    public DataSourceProperties analyticsDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean(name = "analyticsDataSource")
    @ConditionalOnExpression("T(org.springframework.util.StringUtils).hasText('${app.analytics.datasource.url:}')")
    public DataSource analyticsDataSource(DataSourceProperties analyticsDataSourceProperties) {
        return analyticsDataSourceProperties
                .initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();
    }

    @Bean(name = "analyticsJdbcTemplate")
    @ConditionalOnExpression("T(org.springframework.util.StringUtils).hasText('${app.analytics.datasource.url:}')")
    public JdbcTemplate analyticsJdbcTemplate(@Qualifier("analyticsDataSource") DataSource analyticsDataSource) {
        return new JdbcTemplate(analyticsDataSource);
    }
}
