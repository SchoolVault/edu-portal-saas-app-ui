package com.school.erp.modules.exams.job;

import com.school.erp.modules.exams.service.ExamService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ExamNotificationJobWorker {
    private static final Logger log = LoggerFactory.getLogger(ExamNotificationJobWorker.class);
    private final ExamService examService;

    @Value("${app.exams.notification-jobs.batch-size:25}")
    private int batchSize;

    public ExamNotificationJobWorker(ExamService examService) {
        this.examService = examService;
    }

    @Scheduled(fixedDelayString = "${app.exams.notification-jobs.poll-ms:45000}")
    public void processPendingExamNotificationJobs() {
        int processed = examService.processPendingNotificationJobs(batchSize);
        if (processed > 0) {
            log.debug("Exam notification worker processed {} job(s)", processed);
        }
    }
}
