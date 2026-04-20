package com.school.erp.modules.reports.job;

import com.school.erp.modules.reports.service.ReportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ReportJobWorker {
    private static final Logger log = LoggerFactory.getLogger(ReportJobWorker.class);
    private final ReportService reportService;

    @Value("${app.reports.jobs.batch-size:20}")
    private int jobBatchSize;

    @Value("${app.reports.dispatch.batch-size:50}")
    private int dispatchBatchSize;

    public ReportJobWorker(ReportService reportService) {
        this.reportService = reportService;
    }

    @Scheduled(fixedDelayString = "${app.reports.jobs.poll-ms:45000}")
    public void processDueJobs() {
        int jobs = reportService.processQueuedJobs(jobBatchSize);
        int dispatches = reportService.processDispatches(dispatchBatchSize);
        if (jobs > 0 || dispatches > 0) {
            log.debug("Processed report jobs={} dispatches={}", jobs, dispatches);
        }
    }
}
