package com.school.erp.bootstrap;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.flywaydb.core.api.MigrationState;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Enforces that Flyway has left the database with no failed or pending migrations after startup.
 * Complements {@code spring.flyway.validate-on-migrate} (checksum drift). Fails fast on boot when
 * {@code app.flyway.policy.fail-on-pending} is true (default).
 */
@Component
@Order(Integer.MAX_VALUE)
@ConditionalOnBean(Flyway.class)
@ConditionalOnProperty(name = "spring.flyway.enabled", havingValue = "true", matchIfMissing = true)
public class FlywaySchemaPolicy implements ApplicationRunner, HealthIndicator {

    private final Flyway flyway;
    private final boolean failOnPending;

    public FlywaySchemaPolicy(Flyway flyway, org.springframework.core.env.Environment env) {
        this.flyway = flyway;
        this.failOnPending = env.getProperty("app.flyway.policy.fail-on-pending", Boolean.class, true);
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!failOnPending) {
            return;
        }
        validateOrThrow();
    }

    @Override
    public Health health() {
        try {
            List<String> issues = collectIssues();
            if (issues.isEmpty()) {
                return Health.up()
                        .withDetail("message", "Flyway schema policy OK")
                        .build();
            }
            return Health.down()
                    .withDetail("issues", issues)
                    .build();
        } catch (Exception e) {
            return Health.down(e).build();
        }
    }

    private void validateOrThrow() {
        List<String> issues = collectIssues();
        if (!issues.isEmpty()) {
            throw new IllegalStateException("Flyway schema policy violated: " + String.join("; ", issues));
        }
    }

    private List<String> collectIssues() {
        List<String> issues = new ArrayList<>();
        for (MigrationInfo info : flyway.info().all()) {
            MigrationState state = info.getState();
            if (state == MigrationState.FAILED) {
                issues.add("failed migration " + info.getVersion() + " — " + info.getDescription());
            }
        }
        if (failOnPending) {
            MigrationInfo[] pending = flyway.info().pending();
            if (pending.length > 0) {
                issues.add("pending migrations count=" + pending.length + " (expected 0 after migrate on startup)");
            }
        }
        return issues;
    }
}
