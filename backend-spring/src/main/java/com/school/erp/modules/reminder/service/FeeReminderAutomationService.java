package com.school.erp.modules.reminder.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.academic.service.CurrentAcademicYearResolver;
import com.school.erp.modules.fees.entity.FeePayment;
import com.school.erp.modules.fees.repository.FeePaymentRepository;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.modules.settings.service.TenantFeatureFlagsService;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.port.StudentPersistencePort;
import com.school.erp.platform.port.NotificationDispatchPort;
import com.school.erp.platform.port.NotificationDispatchAttributes;
import com.school.erp.tenant.AcademicYearContext;
import com.school.erp.tenant.TenantScopedExecution;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Opinionated fee reminders: one notify on assign, then T−10/7/4/1/0 during working hours, then every 3rd day overdue.
 * Gated by tenant flag {@link TenantFeatureFlagsService#FEE_REMINDER_AUTOMATION}. Stops automatically when balance is cleared.
 */
@Service
public class FeeReminderAutomationService {
    private static final Logger log = LoggerFactory.getLogger(FeeReminderAutomationService.class);
    private static final LocalTime WORK_START = LocalTime.of(9, 0);
    private static final LocalTime WORK_END = LocalTime.of(18, 0);
    private static final int[] PRE_DUE_MARK_DAYS = {10, 7, 4, 1, 0};

    private final FeePaymentRepository feePaymentRepository;
    private final StudentPersistencePort studentPersistence;
    private final NotificationDispatchPort notificationDispatchPort;
    private final TenantFeatureFlagsService featureFlagsService;
    private final TenantConfigRepository tenantConfigRepository;
    private final CurrentAcademicYearResolver currentAcademicYearResolver;

    public FeeReminderAutomationService(
            FeePaymentRepository feePaymentRepository,
            StudentPersistencePort studentPersistence,
            NotificationDispatchPort notificationDispatchPort,
            TenantFeatureFlagsService featureFlagsService,
            TenantConfigRepository tenantConfigRepository,
            CurrentAcademicYearResolver currentAcademicYearResolver) {
        this.feePaymentRepository = feePaymentRepository;
        this.studentPersistence = studentPersistence;
        this.notificationDispatchPort = notificationDispatchPort;
        this.featureFlagsService = featureFlagsService;
        this.tenantConfigRepository = tenantConfigRepository;
        this.currentAcademicYearResolver = currentAcademicYearResolver;
    }

    /** Call after a new {@link FeePayment} row is persisted with outstanding balance. */
    public void onFeeAssigned(String tenantId, FeePayment payment) {
        if (!featureFlagsService.isFeeReminderAutomationEnabled(tenantId)) {
            return;
        }
        if (payment.getId() == null
                || payment.getDueAmount() == null
                || payment.getDueAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        Student st = studentPersistence
                .findByIdAndTenantIdAndIsDeletedFalse(payment.getStudentId(), tenantId)
                .orElse(null);
        if (st == null || st.getParentId() == null) {
            return;
        }
        Long parentId = st.getParentId();
        String name = payment.getStudentName() != null ? payment.getStudentName() : "your child";
        String dueBit = payment.getDueDate() != null ? " Due " + payment.getDueDate() + "." : ".";
        String subject = "New fee assigned";
        String body = "A fee was assigned for " + name + "." + dueBit + " Please open the parent portal to pay.";
        String baseDedupe = "FEE_ASN:" + tenantId + ":" + payment.getId();
        enqueueParentChannels(tenantId, parentId, "FEE_ASSIGNED", subject, body, baseDedupe, resolveEnqueueScope(tenantId));
        log.info("Fee assignment notification queued tenant={} paymentId={}", tenantId, payment.getId());
    }

    public int runScheduledRemindersForAllTenants() {
        List<String> tenants = tenantConfigRepository.findAllTenantIds();
        int total = 0;
        for (String tenantId : tenants) {
            if (tenantId == null || tenantId.isBlank()) {
                continue;
            }
            total += TenantScopedExecution.execute(tenantId, null, "SYSTEM", () -> {
                Long previousAcademicYearId = AcademicYearContext.getAcademicYearId();
                Long currentAcademicYearId = currentAcademicYearResolver.resolveCurrentAcademicYearId(tenantId);
                if (currentAcademicYearId == null) {
                    log.debug("Fee reminder scheduler skipped tenantId={} (no current academic year)", tenantId);
                    return 0;
                }
                AcademicYearContext.setAcademicYearId(currentAcademicYearId);
                try {
                    if (!featureFlagsService.isFeeReminderAutomationEnabled(tenantId)) {
                        return 0;
                    }
                    return runScheduledRemindersForTenant(tenantId);
                } finally {
                    if (previousAcademicYearId == null) {
                        AcademicYearContext.clear();
                    } else {
                        AcademicYearContext.setAcademicYearId(previousAcademicYearId);
                    }
                }
            });
        }
        if (total > 0) {
            log.info("Automated fee reminders enqueued {} channel row(s) across tenant batch", total);
        }
        return total;
    }

    public int runScheduledRemindersForTenant(String tenantId) {
        if (!featureFlagsService.isFeeReminderAutomationEnabled(tenantId)) {
            return 0;
        }
        if (!inWorkingHoursWeekday(LocalDate.now())) {
            return 0;
        }
        LocalDate today = LocalDate.now();
        int n = 0;
        for (FeePayment p : feePaymentRepository.findByTenantIdAndIsDeletedFalse(tenantId)) {
            if (!hasOutstanding(p)) {
                continue;
            }
            Student st = studentPersistence.findByIdAndTenantIdAndIsDeletedFalse(p.getStudentId(), tenantId).orElse(null);
            if (st == null || st.getParentId() == null) {
                continue;
            }
            String phase = resolveReminderPhase(p, today);
            if (phase == null) {
                continue;
            }
            Long parentId = st.getParentId();
            String subject = "Fee reminder";
            String body = buildReminderBody(p);
            String dedupe = "FEE_AUTO:" + tenantId + ":" + p.getId() + ":" + phase;
            n += enqueueParentChannels(tenantId, parentId, "FEE_REMINDER", subject, body, dedupe, resolveEnqueueScope(tenantId));
        }
        return n;
    }

    private static boolean hasOutstanding(FeePayment p) {
        if (p.getStatus() == Enums.FeeStatus.PAID) {
            return false;
        }
        BigDecimal due = p.getDueAmount() != null ? p.getDueAmount() : BigDecimal.ZERO;
        BigDecimal late = p.getLateFee() != null ? p.getLateFee() : BigDecimal.ZERO;
        return due.add(late).compareTo(BigDecimal.ZERO) > 0;
    }

    /**
     * @return dedupe segment e.g. {@code PRE:2026-04-20:D10} or {@code OD:2026-04-12} or null
     */
    private static String resolveReminderPhase(FeePayment p, LocalDate today) {
        LocalDate due = p.getDueDate();
        if (due == null) {
            return null;
        }
        if (!today.isAfter(due)) {
            long daysUntil = ChronoUnit.DAYS.between(today, due);
            if (daysUntil < 0 || daysUntil > 10) {
                return null;
            }
            for (int mark : PRE_DUE_MARK_DAYS) {
                if (daysUntil == mark) {
                    return "PRE:" + due + ":D" + mark;
                }
            }
            return null;
        }
        return overduePhase(due, today);
    }

    private static String overduePhase(LocalDate due, LocalDate today) {
        if (due == null) {
            return null;
        }
        long daysPast = ChronoUnit.DAYS.between(due, today);
        if (daysPast < 1) {
            return null;
        }
        if ((daysPast - 1) % 3 != 0) {
            return null;
        }
        return "OD:" + today;
    }

    private static String buildReminderBody(FeePayment p) {
        String name = p.getStudentName() != null ? p.getStudentName() : "Student";
        BigDecimal due = p.getDueAmount() != null ? p.getDueAmount() : BigDecimal.ZERO;
        BigDecimal late = p.getLateFee() != null ? p.getLateFee() : BigDecimal.ZERO;
        String dueBit = p.getDueDate() != null ? " Due date was " + p.getDueDate() + "." : ".";
        return "Fee reminder: " + name + " — outstanding " + due.add(late) + dueBit + " Pay from the parent portal.";
    }

    private NotificationDispatchAttributes resolveEnqueueScope(String tenantId) {
        Long ay = AcademicYearContext.getAcademicYearId();
        if (ay == null) {
            ay = currentAcademicYearResolver.resolveCurrentAcademicYearId(tenantId);
        }
        return NotificationDispatchAttributes.academicYearOrEmpty(ay);
    }

    private int enqueueParentChannels(
            String tenantId,
            Long parentUserId,
            String eventType,
            String subject,
            String body,
            String baseDedupe,
            NotificationDispatchAttributes dispatchAttributes) {
        int n = 0;
        notificationDispatchPort.enqueue(
                tenantId,
                eventType,
                "IN_APP",
                parentUserId,
                null,
                subject,
                body,
                baseDedupe + ":IN_APP",
                "fee-auto",
                dispatchAttributes);
        n++;
        notificationDispatchPort.enqueue(
                tenantId,
                eventType,
                "SMS",
                parentUserId,
                null,
                subject,
                body,
                baseDedupe + ":SMS",
                "fee-auto",
                dispatchAttributes);
        n++;
        return n;
    }

    static boolean inWorkingHoursWeekday(LocalDate today) {
        DayOfWeek dow = today.getDayOfWeek();
        if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
            return false;
        }
        LocalTime now = LocalTime.now();
        return !now.isBefore(WORK_START) && now.isBefore(WORK_END);
    }
}
