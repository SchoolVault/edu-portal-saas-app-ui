package com.school.erp.config;

import com.zaxxer.hikari.HikariDataSource;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import net.ttddyy.dsproxy.ExecutionInfo;
import net.ttddyy.dsproxy.QueryInfo;
import net.ttddyy.dsproxy.listener.QueryExecutionListener;
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
import java.util.List;
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
    public BeanPostProcessor slowQueryHikariWrapper(SlowQueryLoggingProperties props, MeterRegistry meterRegistry) {
        return new SlowQueryHikariWrapper(props, meterRegistry);
    }

    static final class SlowQueryHikariWrapper implements BeanPostProcessor, Ordered {

        private static final Logger log = LoggerFactory.getLogger(SlowQueryHikariWrapper.class);

        private final SlowQueryLoggingProperties props;
        private final MeterRegistry meterRegistry;

        SlowQueryHikariWrapper(SlowQueryLoggingProperties props, MeterRegistry meterRegistry) {
            this.props = props;
            this.meterRegistry = meterRegistry;
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
                    .listener(new SlowQueryMetricsListener(beanName, ms, meterRegistry))
                    .build();
            log.info("Slow-query JDBC proxy enabled for bean={} thresholdMs={}", beanName, ms);
            return proxy;
        }

        @Override
        public int getOrder() {
            return Ordered.LOWEST_PRECEDENCE;
        }
    }

    static final class SlowQueryMetricsListener implements QueryExecutionListener {
        private final String dataSourceName;
        private final long thresholdMs;
        private final MeterRegistry meterRegistry;
        private final Counter slowQueryCounter;

        SlowQueryMetricsListener(String dataSourceName, long thresholdMs, MeterRegistry meterRegistry) {
            this.dataSourceName = dataSourceName;
            this.thresholdMs = thresholdMs;
            this.meterRegistry = meterRegistry;
            this.slowQueryCounter = Counter.builder("erp.db.query.slow.count")
                    .description("Count of SQL queries over configured threshold")
                    .tag("datasource", dataSourceName)
                    .register(meterRegistry);
        }

        @Override
        public void beforeQuery(ExecutionInfo execInfo, List<QueryInfo> list) {
            // no-op
        }

        @Override
        public void afterQuery(ExecutionInfo execInfo, List<QueryInfo> list) {
            long elapsedMs = execInfo.getElapsedTime();
            Timer.builder("erp.db.query.latency")
                    .description("SQL query execution latency")
                    .tag("datasource", dataSourceName)
                    .register(meterRegistry)
                    .record(elapsedMs, TimeUnit.MILLISECONDS);
            if (elapsedMs >= thresholdMs) {
                slowQueryCounter.increment();
            }
        }
    }
}
