package com.school.erp.modules.fees.webhook;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.modules.fees.domain.FeeAttemptStatus;
import com.school.erp.modules.fees.entity.FeePaymentAttempt;
import com.school.erp.modules.fees.repository.FeePaymentAttemptRepository;
import com.school.erp.modules.fees.service.FeeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Maps Razorpay webhook JSON to fee ledger updates. Extensible: add order.paid, refunds, etc.
 */
@Service
public class FeeRazorpayWebhookProcessor {

    private static final Logger log = LoggerFactory.getLogger(FeeRazorpayWebhookProcessor.class);
    private static final String RAZORPAY = "razorpay";

    private final FeePaymentAttemptRepository attemptRepository;
    private final FeeService feeService;
    private final ObjectMapper objectMapper;

    public FeeRazorpayWebhookProcessor(
            FeePaymentAttemptRepository attemptRepository,
            FeeService feeService,
            ObjectMapper objectMapper) {
        this.attemptRepository = attemptRepository;
        this.feeService = feeService;
        this.objectMapper = objectMapper;
    }

    public record Outcome(Type type, String detail) {
        public enum Type {
            APPLIED,
            DUPLICATE,
            IGNORED,
            NO_MATCH,
            ERROR
        }
    }

    @Transactional
    public Outcome processEventJson(String rawJson) {
        try {
            JsonNode root = objectMapper.readTree(rawJson);
            String event = root.path("event").asText("").trim();
            if ("payment.captured".equals(event)) {
                return handlePaymentCaptured(root, rawJson);
            }
            if ("payment.failed".equals(event)) {
                return handlePaymentFailed(root, rawJson);
            }
            return new Outcome(Outcome.Type.IGNORED, "event:" + (event.isEmpty() ? "unknown" : event));
        } catch (BusinessException ex) {
            log.warn("Razorpay webhook business reject: {}", ex.getMessage());
            return new Outcome(Outcome.Type.ERROR, ex.getMessage());
        } catch (Exception ex) {
            log.error("Razorpay webhook processing failed: {}", ex.getMessage(), ex);
            return new Outcome(Outcome.Type.ERROR, ex.getClass().getSimpleName());
        }
    }

    private Outcome handlePaymentCaptured(JsonNode root, String rawJson) {
        JsonNode pay = root.path("payload").path("payment").path("entity");
        if (pay.isMissingNode() || pay.isNull()) {
            return new Outcome(Outcome.Type.NO_MATCH, "missing_payload.payment.entity");
        }
        String orderId = text(pay, "order_id");
        String paymentId = text(pay, "id");
        long amountPaise = pay.path("amount").asLong(0);
        String currency = text(pay, "currency");
        if (orderId == null || orderId.isBlank() || paymentId == null || paymentId.isBlank()) {
            return new Outcome(Outcome.Type.NO_MATCH, "missing_order_or_payment_id");
        }

        List<FeePaymentAttempt> byPay = attemptRepository.findByProviderAndProviderPaymentIdAndIsDeletedFalse(RAZORPAY, paymentId);
        if (byPay.size() == 1 && FeeAttemptStatus.RECONCILED.name().equalsIgnoreCase(byPay.get(0).getStatus())) {
            return new Outcome(Outcome.Type.DUPLICATE, "payment_id_already_applied");
        }

        List<FeePaymentAttempt> candidates = attemptRepository.findByProviderAndProviderOrderIdAndIsDeletedFalse(RAZORPAY, orderId);
        FeePaymentAttempt attempt = resolveAttempt(candidates, pay.path("notes"));
        if (attempt == null) {
            log.warn("No fee_payment_attempt for Razorpay order_id={}", orderId);
            return new Outcome(Outcome.Type.NO_MATCH, "unknown_order:" + orderId);
        }

        if (!RAZORPAY.equalsIgnoreCase(attempt.getProvider())) {
            return new Outcome(Outcome.Type.NO_MATCH, "provider_mismatch");
        }

        if (FeeAttemptStatus.RECONCILED.name().equalsIgnoreCase(attempt.getStatus()) && paymentId.equals(attempt.getProviderPaymentId())) {
            return new Outcome(Outcome.Type.DUPLICATE, "already_success");
        }

        boolean ok = feeService.reconcilePaymentCapturedFromWebhook(attempt, paymentId, amountPaise, currency, rawJson);
        return ok
                ? new Outcome(Outcome.Type.APPLIED, "captured:" + paymentId)
                : new Outcome(Outcome.Type.ERROR, "reconcile_rejected");
    }

    private Outcome handlePaymentFailed(JsonNode root, String rawJson) {
        JsonNode pay = root.path("payload").path("payment").path("entity");
        if (pay.isMissingNode() || pay.isNull()) {
            return new Outcome(Outcome.Type.IGNORED, "failed_missing_entity");
        }
        String orderId = text(pay, "order_id");
        if (orderId == null || orderId.isBlank()) {
            return new Outcome(Outcome.Type.NO_MATCH, "failed_missing_order");
        }
        List<FeePaymentAttempt> candidates = attemptRepository.findByProviderAndProviderOrderIdAndIsDeletedFalse(RAZORPAY, orderId);
        FeePaymentAttempt attempt = resolveAttempt(candidates, pay.path("notes"));
        if (attempt == null) {
            return new Outcome(Outcome.Type.NO_MATCH, "failed_unknown_order");
        }
        feeService.reconcilePaymentFailedFromWebhook(attempt, rawJson);
        return new Outcome(Outcome.Type.APPLIED, "marked_failed");
    }

    private FeePaymentAttempt resolveAttempt(List<FeePaymentAttempt> candidates, JsonNode notes) {
        if (candidates == null || candidates.isEmpty()) {
            return null;
        }
        if (candidates.size() == 1) {
            return candidates.get(0);
        }
        String tenantNote = text(notes, "tenant_id");
        String attemptNote = text(notes, "fee_payment_attempt_id");
        Long attemptId = parseLong(attemptNote);
        for (FeePaymentAttempt a : candidates) {
            if (attemptId != null && attemptId.equals(a.getId())) {
                return a;
            }
            if (tenantNote != null && tenantNote.equals(a.getTenantId())) {
                return a;
            }
        }
        log.warn("Ambiguous Razorpay order_id match count={} — set order notes tenant_id + fee_payment_attempt_id", candidates.size());
        return null;
    }

    private static String text(JsonNode parent, String field) {
        if (parent == null || !parent.has(field) || parent.get(field).isNull()) {
            return null;
        }
        JsonNode n = parent.get(field);
        if (n.isTextual()) {
            return n.asText();
        }
        if (n.isNumber()) {
            return n.asText();
        }
        return n.asText();
    }

    private static Long parseLong(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(raw.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
