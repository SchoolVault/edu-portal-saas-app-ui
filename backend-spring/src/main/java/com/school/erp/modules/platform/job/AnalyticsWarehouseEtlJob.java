package com.school.erp.modules.platform.job;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Stub ETL heartbeat into {@code analytics_etl_heartbeat}. Point {@code app.analytics.datasource.url} at a warehouse later and swap {@link JdbcTemplate} wiring.
 */
@Component
public class AnalyticsWarehouseEtlJob {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsWarehouseEtlJob.class);

    private final JdbcTemplate jdbcTemplate;

    @Value("${app.analytics.etl.enabled:false}")
    private boolean enabled;

    public AnalyticsWarehouseEtlJob(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Scheduled(cron = "${app.analytics.etl.cron:0 15 1 * * *}")
    @Transactional
    public void runStubEtl() {
        if (!enabled) {
            return;
        }
        try {
            jdbcTemplate.update(
                    "INSERT INTO analytics_etl_heartbeat (ran_at, job_name, note) VALUES (?, ?, ?)",
                    LocalDateTime.now(),
                    "analytics-warehouse-stub",
                    "Extend to copy facts from outbox / domain events");
            log.debug("analytics_etl heartbeat written");
        } catch (Exception e) {
            log.warn("analytics_etl skipped: {}", e.getMessage());
        }
    }
}
