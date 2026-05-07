package com.school.erp.modules.leave.job;

import com.school.erp.modules.leave.service.LeaveService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "app.leave.workflow.escalation", name = "enabled", havingValue = "true", matchIfMissing = true)
public class LeaveWorkflowEscalationJob {

    private static final Logger log = LoggerFactory.getLogger(LeaveWorkflowEscalationJob.class);
    private final LeaveService leaveService;

    public LeaveWorkflowEscalationJob(LeaveService leaveService) {
        this.leaveService = leaveService;
    }

    @Scheduled(cron = "${app.leave.workflow.escalation.cron:0 */15 * * * *}")
    public void escalatePendingSlaBreaches() {
        int escalated = leaveService.escalateOverduePendingRequests();
        if (escalated > 0) {
            log.info("Leave workflow escalation job raised {} pending requests", escalated);
        }
    }
}
