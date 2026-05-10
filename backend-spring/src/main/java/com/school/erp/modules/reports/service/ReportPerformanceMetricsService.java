package com.school.erp.modules.reports.service;

import org.springframework.stereotype.Service;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.LongAdder;

@Service
public class ReportPerformanceMetricsService {
    private static final int LATENCY_WINDOW_SIZE = 400;
    private final ConcurrentHashMap<String, OperationMetrics> operationMetrics = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, SnapshotMetrics> snapshotMetrics = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, LongAdder> jobEventCounters = new ConcurrentHashMap<>();

    public void recordReportRead(String operation, long elapsedMs, int rows) {
        OperationMetrics metrics = operationMetrics.computeIfAbsent(operation, key -> new OperationMetrics());
        metrics.record(elapsedMs, rows);
    }

    public void recordSnapshotHit(String snapshotType) {
        snapshotMetrics.computeIfAbsent(snapshotType, key -> new SnapshotMetrics()).hit.increment();
    }

    public void recordSnapshotMiss(String snapshotType) {
        snapshotMetrics.computeIfAbsent(snapshotType, key -> new SnapshotMetrics()).miss.increment();
    }

    public Map<String, Object> readMetricsSnapshot() {
        Map<String, Object> out = new LinkedHashMap<>();
        Map<String, Object> operationMap = new LinkedHashMap<>();
        operationMetrics.forEach((key, value) -> operationMap.put(key, value.snapshot()));
        Map<String, Object> snapshotMap = new LinkedHashMap<>();
        snapshotMetrics.forEach((key, value) -> snapshotMap.put(key, value.snapshot()));
        Map<String, Object> jobEvents = new LinkedHashMap<>();
        jobEventCounters.forEach((key, value) -> jobEvents.put(key, value.sum()));
        out.put("operations", operationMap);
        out.put("snapshots", snapshotMap);
        out.put("jobEvents", jobEvents);
        return out;
    }

    public void recordJobEvent(String eventCode) {
        if (eventCode == null || eventCode.isBlank()) {
            return;
        }
        jobEventCounters.computeIfAbsent(eventCode.trim().toUpperCase(), key -> new LongAdder()).increment();
    }

    private static final class OperationMetrics {
        private final LongAdder callCount = new LongAdder();
        private final LongAdder totalElapsedMs = new LongAdder();
        private final LongAdder totalRows = new LongAdder();
        private final Deque<Long> latencyWindow = new ArrayDeque<>();

        synchronized void record(long elapsedMs, int rows) {
            callCount.increment();
            totalElapsedMs.add(Math.max(0, elapsedMs));
            totalRows.add(Math.max(0, rows));
            latencyWindow.addLast(Math.max(0, elapsedMs));
            if (latencyWindow.size() > LATENCY_WINDOW_SIZE) {
                latencyWindow.removeFirst();
            }
        }

        synchronized Map<String, Object> snapshot() {
            long calls = callCount.sum();
            long totalMs = totalElapsedMs.sum();
            long rows = totalRows.sum();
            List<Long> sortedLatency = new ArrayList<>(latencyWindow);
            sortedLatency.sort(Comparator.naturalOrder());
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("count", calls);
            payload.put("avgMs", calls == 0 ? 0.0 : round((double) totalMs / calls));
            payload.put("avgRows", calls == 0 ? 0.0 : round((double) rows / calls));
            payload.put("p95Ms", percentile(sortedLatency, 0.95));
            payload.put("p99Ms", percentile(sortedLatency, 0.99));
            payload.put("maxMs", sortedLatency.isEmpty() ? 0L : sortedLatency.get(sortedLatency.size() - 1));
            return payload;
        }

        private static long percentile(List<Long> sortedValues, double percentile) {
            if (sortedValues.isEmpty()) {
                return 0L;
            }
            int index = (int) Math.ceil(percentile * sortedValues.size()) - 1;
            int safeIndex = Math.max(0, Math.min(index, sortedValues.size() - 1));
            return sortedValues.get(safeIndex);
        }

        private static double round(double value) {
            return Math.round(value * 100.0) / 100.0;
        }
    }

    private static final class SnapshotMetrics {
        private final LongAdder hit = new LongAdder();
        private final LongAdder miss = new LongAdder();

        Map<String, Object> snapshot() {
            long hitCount = hit.sum();
            long missCount = miss.sum();
            long total = hitCount + missCount;
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("hit", hitCount);
            payload.put("miss", missCount);
            payload.put("hitRatePct", total == 0 ? 0.0 : Math.round((10000.0 * hitCount / total)) / 100.0);
            return payload;
        }
    }
}
