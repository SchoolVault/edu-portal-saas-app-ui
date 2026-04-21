package com.school.erp.modules.importexport.observability;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ImportMetricsRecorderTest {

    @Test
    void counters_increment() {
        MeterRegistry registry = new SimpleMeterRegistry();
        ImportMetricsRecorder rec = new ImportMetricsRecorder(registry);
        rec.incrementJobsSubmitted();
        rec.incrementLinesSuccess(3);
        Counter c = registry.find(ImportMetricsRecorder.METER_NS + ".jobs.submitted").counter();
        assertThat(c.count()).isEqualTo(1.0);
        Counter lines = registry.find(ImportMetricsRecorder.METER_NS + ".lines.success").counter();
        assertThat(lines.count()).isEqualTo(3.0);
    }
}
