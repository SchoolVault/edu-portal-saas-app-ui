package com.school.erp.modules.notification.job;

import com.school.erp.modules.reminder.service.FeeReminderAutomationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Cron entry for automated fee reminders (feature-flag per tenant). Configure on Render via {@code APP_JOBS_FEE_REMINDER_CRON}.
 */
@Component
@ConditionalOnProperty(name = "app.jobs.reminders.enabled", havingValue = "true", matchIfMissing = true)
public class FeeReminderOutboxJob {
    private static final Logger log = LoggerFactory.getLogger(FeeReminderOutboxJob.class);
    private final FeeReminderAutomationService feeReminderAutomationService;

    @Value("${app.jobs.reminders.external-scheduler-only:false}")
    private boolean externalSchedulerOnly;

    public FeeReminderOutboxJob(FeeReminderAutomationService feeReminderAutomationService) {
        this.feeReminderAutomationService = feeReminderAutomationService;
    }

    @Scheduled(cron = "${app.jobs.fee-reminder-cron:0 15 8 * * *}")
    public void enqueueReminders() {
        if (externalSchedulerOnly) {
            return;
        }
        try {
            feeReminderAutomationService.runScheduledRemindersForAllTenants();
        } catch (Exception ex) {
            log.error("Fee reminder job failed: {}", ex.getMessage(), ex);
        }
    }
}
