package com.school.erp.config;

import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

/**
 * Optional profile-based Hikari preset for quick environment sizing.
 * Explicit spring.datasource.hikari values still remain source-of-truth.
 */
@Configuration
@EnableConfigurationProperties(HikariPresetProperties.class)
public class HikariPresetDataSourceConfiguration {

    @Bean
    public BeanPostProcessor hikariPresetWrapper(HikariPresetProperties props) {
        return new HikariPresetWrapper(props);
    }

    static final class HikariPresetWrapper implements BeanPostProcessor, Ordered {
        private static final Logger log = LoggerFactory.getLogger(HikariPresetWrapper.class);
        private final HikariPresetProperties props;

        HikariPresetWrapper(HikariPresetProperties props) {
            this.props = props;
        }

        @Override
        public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
            if (!(bean instanceof HikariDataSource ds)) {
                return bean;
            }
            String profile = props.getProfile() == null ? "none" : props.getProfile().trim().toLowerCase();
            switch (profile) {
                case "small" -> apply(ds, 12, 3, 20_000L, 300_000L, 600_000L, 120_000L);
                case "medium" -> apply(ds, 24, 6, 20_000L, 300_000L, 600_000L, 120_000L);
                case "large" -> apply(ds, 48, 12, 20_000L, 300_000L, 600_000L, 120_000L);
                default -> {
                    return bean;
                }
            }
            log.info("Applied hikari preset profile={} bean={} maxPool={} minIdle={}",
                    profile, beanName, ds.getMaximumPoolSize(), ds.getMinimumIdle());
            return bean;
        }

        private void apply(
                HikariDataSource ds,
                int maxPool,
                int minIdle,
                long connTimeoutMs,
                long idleTimeoutMs,
                long maxLifetimeMs,
                long keepaliveMs) {
            ds.setMaximumPoolSize(maxPool);
            ds.setMinimumIdle(minIdle);
            ds.setConnectionTimeout(connTimeoutMs);
            ds.setIdleTimeout(idleTimeoutMs);
            ds.setMaxLifetime(maxLifetimeMs);
            ds.setKeepaliveTime(keepaliveMs);
        }

        @Override
        public int getOrder() {
            return Ordered.HIGHEST_PRECEDENCE;
        }
    }
}

