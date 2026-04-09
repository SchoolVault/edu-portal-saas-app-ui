package com.school.erp.bootstrap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Runs after Flyway when the {@code dev} profile is active and {@code app.demo-seed.enabled=true}.
 */
@Component
@Order(100)
@Profile("dev")
@ConditionalOnProperty(name = "app.demo-seed.enabled", havingValue = "true")
public class DemoDataSeedRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeedRunner.class);
    private final DemoDataSeedService demoDataSeedService;

    public DemoDataSeedRunner(DemoDataSeedService demoDataSeedService) {
        this.demoDataSeedService = demoDataSeedService;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            demoDataSeedService.seedIfNeeded();
        } catch (Exception e) {
            log.error("Demo data seed failed: {}", e.getMessage(), e);
        }
    }
}
