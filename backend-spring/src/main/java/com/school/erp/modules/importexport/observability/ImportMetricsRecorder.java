package com.school.erp.modules.importexport.observability;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Micrometer metrics for bulk import — scrape via {@code /actuator/metrics} or Prometheus (if enabled).
 * Tags are intentionally low-cardinality (job type only) to avoid Prometheus label explosion.
 */
@Component
public class ImportMetricsRecorder {

    public static final String METER_NS = "school.import";

    private final Counter jobsSubmitted;
    private final Counter jobsCompleted;
    private final Counter jobsFailed;
    private final Counter linesSuccess;
    private final Counter linesFailed;
    private final Counter dryRuns;
    private final Counter dryRunRowsValidated;
    private final Counter idempotentSubmitReplays;
    private final Timer jobDuration;
    private final AtomicInteger activeJobsGauge = new AtomicInteger(0);

    public ImportMetricsRecorder(MeterRegistry registry) {
        this.jobsSubmitted = Counter.builder(METER_NS + ".jobs.submitted")
                .description("Import jobs accepted for async processing")
                .register(registry);
        this.jobsCompleted = Counter.builder(METER_NS + ".jobs.completed")
                .description("Import jobs finished successfully (all lines processed)")
                .register(registry);
        this.jobsFailed = Counter.builder(METER_NS + ".jobs.failed")
                .description("Import jobs ended in FAILED status")
                .register(registry);
        this.linesSuccess = Counter.builder(METER_NS + ".lines.success")
                .description("Import line rows committed successfully")
                .register(registry);
        this.linesFailed = Counter.builder(METER_NS + ".lines.failed")
                .description("Import line rows that failed validation or persistence")
                .register(registry);
        this.dryRuns = Counter.builder(METER_NS + ".dry_run.executions")
                .description("Dry-run validations executed")
                .register(registry);
        this.dryRunRowsValidated = Counter.builder(METER_NS + ".dry_run.rows_scanned")
                .description("Rows scanned during dry-run (sum)")
                .register(registry);
        this.idempotentSubmitReplays = Counter.builder(METER_NS + ".submit.idempotent_replays")
                .description("Submit API returned an existing in-flight job (same file + mapping)")
                .register(registry);
        this.jobDuration = Timer.builder(METER_NS + ".job.duration")
                .description("Wall-clock time to process one import job end-to-end")
                .register(registry);
        Gauge.builder(METER_NS + ".jobs.active", activeJobsGauge, AtomicInteger::get)
                .description("Import jobs currently executing on this JVM")
                .register(registry);
    }

    public void incrementJobsSubmitted() {
        jobsSubmitted.increment();
    }

    public void incrementJobsCompleted() {
        jobsCompleted.increment();
    }

    public void incrementJobsFailed() {
        jobsFailed.increment();
    }

    public void incrementLinesSuccess(int n) {
        if (n > 0) {
            linesSuccess.increment(n);
        }
    }

    public void incrementLinesFailed(int n) {
        if (n > 0) {
            linesFailed.increment(n);
        }
    }

    public void recordDryRun(int rowsScanned) {
        dryRuns.increment();
        if (rowsScanned > 0) {
            dryRunRowsValidated.increment(rowsScanned);
        }
    }

    public void incrementIdempotentReplay() {
        idempotentSubmitReplays.increment();
    }

    public void recordJobDurationMs(long millis) {
        if (millis >= 0) {
            jobDuration.record(millis, TimeUnit.MILLISECONDS);
        }
    }

    public void activeJobStarted() {
        activeJobsGauge.incrementAndGet();
    }

    public void activeJobFinished() {
        activeJobsGauge.updateAndGet(v -> v > 0 ? v - 1 : 0);
    }
}
