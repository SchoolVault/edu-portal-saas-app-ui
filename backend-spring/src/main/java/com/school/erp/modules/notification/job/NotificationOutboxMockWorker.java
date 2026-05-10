package com.school.erp.modules.notification.job;

import com.school.erp.modules.notification.service.NotificationOutboxService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Notification delivery worker: drains notification outbox and dispatches by channel.
 */
@Component
@ConditionalOnProperty(name = "app.notification.outbox.enabled", havingValue = "true", matchIfMissing = true)
public class NotificationOutboxMockWorker {
    private static final Logger log = LoggerFactory.getLogger(NotificationOutboxMockWorker.class);
    private final NotificationOutboxService outboxService;

    @Value("${app.notification.outbox.batch-size:50}")
    private int batchSize;
    @Value("${app.notification.outbox.max-rounds-per-tick:5}")
    private int maxRoundsPerTick;

    public NotificationOutboxMockWorker(NotificationOutboxService outboxService) {
        this.outboxService = outboxService;
    }

    @Scheduled(fixedDelayString = "${app.notification.outbox.poll-ms:60000}")
    public void drainOutbox() {
        int rounds = Math.max(1, Math.min(maxRoundsPerTick, 20));
        int total = 0;
        for (int i = 0; i < rounds; i++) {
            int n = outboxService.processPendingBatch(batchSize);
            total += n;
            if (n < batchSize) {
                break;
            }
        }
        if (total > 0) {
            log.debug("Outbox worker processed {} row(s) in {} rounds", total, rounds);
        }
    }
}
