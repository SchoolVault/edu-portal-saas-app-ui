package com.school.erp.events.listener;

import com.school.erp.events.domain.FeePaymentRecordedEvent;
import com.school.erp.events.domain.StudentAdmittedEvent;
import com.school.erp.events.domain.StudentEnrollmentChangedEvent;
import com.school.erp.integration.outbound.OutboundEmailHttpClient;
import com.school.erp.integration.outbound.OutboundWebhookHttpClient;
import com.school.erp.common.logging.MdcKeys;
import com.school.erp.platform.port.AnalyticsEventPort;
import com.school.erp.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Hooks that run only after successful commit: analytics, outbound webhooks, optional email API.
 * Replace no-op ports with Kafka/outbox when you scale out horizontally.
 */
@Component
public class DomainEventAfterCommitListener {

    private static final Logger log = LoggerFactory.getLogger(DomainEventAfterCommitListener.class);

    private final AnalyticsEventPort analyticsEventPort;
    private final OutboundWebhookHttpClient outboundWebhookHttpClient;
    private final OutboundEmailHttpClient outboundEmailHttpClient;

    public DomainEventAfterCommitListener(
            AnalyticsEventPort analyticsEventPort,
            OutboundWebhookHttpClient outboundWebhookHttpClient,
            OutboundEmailHttpClient outboundEmailHttpClient) {
        this.analyticsEventPort = analyticsEventPort;
        this.outboundWebhookHttpClient = outboundWebhookHttpClient;
        this.outboundEmailHttpClient = outboundEmailHttpClient;
    }

    private void withTenantContext(String tenantId, Runnable runnable) {
        try {
            if (tenantId != null && !tenantId.isBlank()) {
                TenantContext.setTenantId(tenantId);
                MDC.put(MdcKeys.TENANT_ID, tenantId);
            }
            runnable.run();
        } finally {
            TenantContext.clear();
            MdcKeys.clearTenantUser();
        }
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onFeePaymentRecorded(FeePaymentRecordedEvent event) {
        withTenantContext(event.tenantId(), () -> {
            log.info("domain_event fee_payment_recorded tenant={} paymentId={} studentId={} status={}",
                    event.tenantId(), event.paymentId(), event.studentId(), event.feeStatus());
            Map<String, Object> attrs = new LinkedHashMap<>();
            attrs.put("paymentId", event.paymentId());
            attrs.put("studentId", event.studentId());
            attrs.put("feeStatus", event.feeStatus());
            attrs.put("amountApplied", event.amountApplied() != null ? event.amountApplied().toPlainString() : null);
            analyticsEventPort.publish("fee_payment_recorded", attrs);
            outboundWebhookHttpClient.postEventPayload("fee_payment_recorded", event.tenantId(), attrs);
            outboundEmailHttpClient.postTriggerPayload("fee_payment_recorded", event.tenantId(), attrs);
        });
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onStudentEnrollmentChanged(StudentEnrollmentChangedEvent event) {
        withTenantContext(event.tenantId(), () -> {
            log.info("domain_event student_enrollment_changed tenant={} studentId={} class {}→{} section {}→{}",
                    event.tenantId(), event.studentId(),
                    event.priorClassId(), event.newClassId(),
                    event.priorSectionId(), event.newSectionId());
            Map<String, Object> attrs = new LinkedHashMap<>();
            attrs.put("studentId", event.studentId());
            attrs.put("priorClassId", event.priorClassId());
            attrs.put("newClassId", event.newClassId());
            attrs.put("priorSectionId", event.priorSectionId());
            attrs.put("newSectionId", event.newSectionId());
            analyticsEventPort.publish("student_enrollment_changed", attrs);
            outboundWebhookHttpClient.postEventPayload("student_enrollment_changed", event.tenantId(), attrs);
            outboundEmailHttpClient.postTriggerPayload("student_enrollment_changed", event.tenantId(), attrs);
        });
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onStudentAdmitted(StudentAdmittedEvent event) {
        withTenantContext(event.tenantId(), () -> {
            log.info("domain_event student_admitted tenant={} studentId={} classId={} admission={}",
                    event.tenantId(), event.studentId(), event.classId(), event.admissionNumber());
            Map<String, Object> attrs = new LinkedHashMap<>();
            attrs.put("studentId", event.studentId());
            attrs.put("classId", event.classId());
            attrs.put("sectionId", event.sectionId());
            attrs.put("admissionNumber", event.admissionNumber());
            analyticsEventPort.publish("student_admitted", attrs);
            outboundWebhookHttpClient.postEventPayload("student_admitted", event.tenantId(), attrs);
            outboundEmailHttpClient.postTriggerPayload("student_admitted", event.tenantId(), attrs);
        });
    }
}
