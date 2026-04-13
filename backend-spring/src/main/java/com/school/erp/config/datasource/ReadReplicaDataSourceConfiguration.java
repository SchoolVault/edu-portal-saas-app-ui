package com.school.erp.config.datasource;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.flyway.FlywayDataSource;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Conditional;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;
import org.springframework.util.StringUtils;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

/**
 * Optional second MySQL datasource for read scaling. Off until {@code READ_DATASOURCE_URL} is set.
 * <p>
 * Use {@code @Transactional(readOnly = true)} on query-only service methods to hit the replica.
 */
@Configuration
@Conditional(ReadReplicaEnabledCondition.class)
@EnableConfigurationProperties(DataSourceProperties.class)
public class ReadReplicaDataSourceConfiguration {

    @Bean
    @FlywayDataSource
    @ConfigurationProperties("spring.datasource.hikari")
    public HikariDataSource writeDataSource(DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder().type(HikariDataSource.class).build();
    }

    @Bean
    public DataSource readDataSource(Environment env, DataSourceProperties primary) {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(env.getRequiredProperty("app.datasource.read.url"));
        String user = env.getProperty("app.datasource.read.username");
        ds.setUsername(StringUtils.hasText(user) ? user : primary.getUsername());
        String pass = env.getProperty("app.datasource.read.password");
        ds.setPassword(StringUtils.hasText(pass) ? pass : primary.getPassword());
        String driver = env.getProperty("app.datasource.read.driver-class-name");
        if (StringUtils.hasText(driver)) {
            ds.setDriverClassName(driver);
        } else if (StringUtils.hasText(primary.getDriverClassName())) {
            ds.setDriverClassName(primary.getDriverClassName());
        }
        bindReadPool(env, ds);
        ds.setPoolName("read-replica-pool");
        return ds;
    }

    private static void bindReadPool(Environment env, HikariDataSource ds) {
        Integer max = env.getProperty("app.datasource.read.hikari.maximum-pool-size", Integer.class);
        if (max != null) {
            ds.setMaximumPoolSize(max);
        }
        Integer min = env.getProperty("app.datasource.read.hikari.minimum-idle", Integer.class);
        if (min != null) {
            ds.setMinimumIdle(min);
        }
    }

    @Bean
    @Primary
    public DataSource routingDataSource(
            @Qualifier("writeDataSource") DataSource write,
            @Qualifier("readDataSource") DataSource read) {
        ReadWriteRoutingDataSource routing = new ReadWriteRoutingDataSource();
        Map<Object, Object> targets = new HashMap<>();
        targets.put(ReadWriteRoutingDataSource.WRITE, write);
        targets.put(ReadWriteRoutingDataSource.READ, read);
        routing.setTargetDataSources(targets);
        routing.setDefaultTargetDataSource(write);
        routing.afterPropertiesSet();
        return routing;
    }
}
