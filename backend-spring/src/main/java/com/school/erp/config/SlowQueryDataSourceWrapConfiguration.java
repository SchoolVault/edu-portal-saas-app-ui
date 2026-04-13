package com.school.erp.config;

import com.zaxxer.hikari.HikariDataSource;
import net.ttddyy.dsproxy.listener.logging.SLF4JSlowQueryListener;
import net.ttddyy.dsproxy.support.ProxyDataSourceBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

import javax.sql.DataSource;
import java.util.concurrent.TimeUnit;

/**
 * Wraps each {@link HikariDataSource} with a slow-query listener (datasource-proxy).
 * Enable with {@code app.datasource.slow-query.enabled=true} (default on in {@code dev} profile).
 */
@Configuration
@ConditionalOnProperty(prefix = "app.datasource.slow-query", name = "enabled", havingValue = "true")
@EnableConfigurationProperties(SlowQueryLoggingProperties.class)
public class SlowQueryDataSourceWrapConfiguration {

    @Bean
    public static BeanPostProcessor slowQueryHikariWrapper(SlowQueryLoggingProperties props) {
        return new SlowQueryHikariWrapper(props);
    }

    static final class SlowQueryHikariWrapper implements BeanPostProcessor, Ordered {

        private static final Logger log = LoggerFactory.getLogger(SlowQueryHikariWrapper.class);

        private final SlowQueryLoggingProperties props;

        SlowQueryHikariWrapper(SlowQueryLoggingProperties props) {
            this.props = props;
        }

        @Override
        public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
            if (!(bean instanceof HikariDataSource)) {
                return bean;
            }
            HikariDataSource hikari = (HikariDataSource) bean;
            long ms = Math.max(1L, props.getThresholdMs());
            DataSource proxy = ProxyDataSourceBuilder.create(hikari)
                    .name("slow-query:" + beanName)
                    .listener(new SLF4JSlowQueryListener(ms, TimeUnit.MILLISECONDS))
                    .build();
            log.info("Slow-query JDBC proxy enabled for bean={} thresholdMs={}", beanName, ms);
            return proxy;
        }

        @Override
        public int getOrder() {
            return Ordered.LOWEST_PRECEDENCE;
        }
    }
}
