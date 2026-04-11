package com.school.erp.modules.notification.job;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.fees.entity.FeePayment;
import com.school.erp.modules.fees.repository.FeePaymentRepository;
import com.school.erp.modules.notification.service.NotificationOutboxService;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.repository.StudentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Scheduled fee reminders: enqueue SMS/WhatsApp outbox rows (mock delivery) for upcoming/overdue balances.
 */
@Component
public class FeeReminderOutboxJob {
    private static final Logger log = LoggerFactory.getLogger(FeeReminderOutboxJob.class);
    private final FeePaymentRepository feePaymentRepository;
    private final StudentRepository studentRepository;
    private final NotificationOutboxService outboxService;

    public FeeReminderOutboxJob(
            FeePaymentRepository feePaymentRepository,
            StudentRepository studentRepository,
            NotificationOutboxService outboxService) {
        this.feePaymentRepository = feePaymentRepository;
        this.studentRepository = studentRepository;
        this.outboxService = outboxService;
    }

    @Scheduled(cron = "${app.jobs.fee-reminder-cron:0 15 8 * * *}")
    @Transactional
    public void enqueueReminders() {
        LocalDate today = LocalDate.now();
        LocalDate horizon = today.plusDays(7);
        List<String> tenants = feePaymentRepository.findDistinctTenantIds();
        int queued = 0;
        for (String tenantId : tenants) {
            List<FeePayment> slice = feePaymentRepository.findDueForReminders(
                    tenantId,
                    today,
                    horizon,
                    List.of(Enums.FeeStatus.UNPAID, Enums.FeeStatus.PARTIAL, Enums.FeeStatus.OVERDUE),
                    Enums.FeeStatus.OVERDUE);
            for (FeePayment p : slice) {
                Student st = studentRepository.findByIdAndTenantIdAndIsDeletedFalse(p.getStudentId(), tenantId).orElse(null);
                if (st == null || st.getParentId() == null) {
                    continue;
                }
                String dedupe = "FEE_REMINDER:" + p.getId() + ":D:" + today;
                String body = "Fee reminder: " + (p.getStudentName() != null ? p.getStudentName() : "Student")
                        + " balance " + p.getDueAmount()
                        + (p.getDueDate() != null ? ". Due " + p.getDueDate() + "." : ".");
                outboxService.enqueue(
                        tenantId,
                        "FEE_REMINDER",
                        "SMS",
                        st.getParentId(),
                        null,
                        "Fee reminder",
                        body,
                        dedupe,
                        "fee-job");
                outboxService.enqueue(
                        tenantId,
                        "FEE_REMINDER",
                        "WHATSAPP",
                        st.getParentId(),
                        null,
                        "Fee reminder",
                        body,
                        dedupe + ":WA",
                        "fee-job");
                queued += 2;
            }
        }
        if (queued > 0) {
            log.info("Fee reminder job enqueued {} outbox row(s) across {} tenant(s)", queued, tenants.size());
        }
    }
}
