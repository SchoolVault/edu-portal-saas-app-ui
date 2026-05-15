package com.school.erp.modules.exams.event;

import com.school.erp.modules.exams.service.ExamService;
import com.school.erp.tenant.TenantScopedExecution;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class ExamNotificationAfterCommitListener {
    private static final Logger log = LoggerFactory.getLogger(ExamNotificationAfterCommitListener.class);
    private final ExamService examService;

    public ExamNotificationAfterCommitListener(ExamService examService) {
        this.examService = examService;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onExamNotificationRequested(ExamNotificationRequestedEvent event) {
        TenantScopedExecution.run(event.tenantId(), null, "SYSTEM", () -> {
            try {
                examService.dispatchExamNotification(event.examId(), event.eventType());
            } catch (Exception ex) {
                log.warn(
                        "after_commit exam notification failed tenant={} examId={} event={} reason={}",
                        event.tenantId(),
                        event.examId(),
                        event.eventType(),
                        ex.toString());
            }
        });
    }
}
