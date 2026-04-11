package com.school.erp.modules.notification.job;

import com.school.erp.modules.notification.service.NotificationOutboxService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Mock PSP worker: drains {@code notification_outbox} PENDING rows and marks them SENT.
 */
@Component
public class NotificationOutboxMockWorker {
    private static final Logger log = LoggerFactory.getLogger(NotificationOutboxMockWorker.class);
    private final NotificationOutboxService outboxService;

    @Value("${app.notification.outbox.batch-size:50}")
    private int batchSize;

    public NotificationOutboxMockWorker(NotificationOutboxService outboxService) {
        this.outboxService = outboxService;
    }

    @Scheduled(fixedDelayString = "${app.notification.outbox.poll-ms:60000}")
    public void drainOutbox() {
        int n = outboxService.processPendingBatchMock(batchSize);
        if (n > 0) {
            log.debug("Outbox mock worker processed {} row(s)", n);
        }
    }
}
