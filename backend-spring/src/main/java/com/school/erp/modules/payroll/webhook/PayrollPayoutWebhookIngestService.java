package com.school.erp.modules.payroll.webhook;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.modules.payroll.entity.PayrollPayoutWebhookEvent;
import com.school.erp.modules.payroll.repository.PayrollPayoutWebhookEventRepository;
import com.school.erp.modules.payroll.service.PayrollService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PayrollPayoutWebhookIngestService {
    private static final Logger log = LoggerFactory.getLogger(PayrollPayoutWebhookIngestService.class);
    private static final String PROVIDER = "razorpayx";

    private final RazorpayXPayrollWebhookSignatureVerifier signatureVerifier;
    private final PayrollPayoutWebhookEventRepository webhookEventRepository;
    private final PayrollService payrollService;
    private final ObjectMapper objectMapper;

    public PayrollPayoutWebhookIngestService(
            RazorpayXPayrollWebhookSignatureVerifier signatureVerifier,
            PayrollPayoutWebhookEventRepository webhookEventRepository,
            PayrollService payrollService,
            ObjectMapper objectMapper) {
        this.signatureVerifier = signatureVerifier;
        this.webhookEventRepository = webhookEventRepository;
        this.payrollService = payrollService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public ResponseEntity<String> ingest(byte[] rawBody, String signatureHeader) {
        if (!signatureVerifier.isConfigured()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body("webhook_not_configured");
        }
        if (rawBody == null || rawBody.length == 0) {
            return ResponseEntity.badRequest().body("empty_body");
        }
        if (!signatureVerifier.verify(rawBody, signatureHeader)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("bad_signature");
        }
        String payloadHash = sha256Hex(rawBody);
        String externalEventId = parseExternalEventId(rawBody);
        if (externalEventId != null && webhookEventRepository.findByProviderAndExternalEventId(PROVIDER, externalEventId).isPresent()) {
            return ResponseEntity.ok("duplicate");
        }
        if (webhookEventRepository.findByProviderAndPayloadSha256(PROVIDER, payloadHash).isPresent()) {
            return ResponseEntity.ok("duplicate");
        }

        PayrollPayoutWebhookEvent row = new PayrollPayoutWebhookEvent();
        row.setProvider(PROVIDER);
        row.setPayloadSha256(payloadHash);
        row.setExternalEventId(externalEventId);
        row.setRawBody(new String(rawBody, StandardCharsets.UTF_8));
        row.setStatus("RECEIVED");
        parseMetadata(rawBody, row);
        try {
            webhookEventRepository.save(row);
        } catch (DataIntegrityViolationException ex) {
            return ResponseEntity.ok("duplicate");
        }

        String tenantHint = parseTenantIdFromPayoutWebhook(rawBody);
        boolean applied = payrollService.applyWebhookDisbursementStatus(
                row.getReferenceId(),
                parseProviderStatus(rawBody),
                row.getRawBody(),
                "PAYROLL_WEBHOOK_EVENT:" + (externalEventId != null ? externalEventId : payloadHash),
                tenantHint);
        row.setStatus(applied ? "PROCESSED_OK" : "NO_MATCH");
        row.setProcessedAt(Instant.now());
        webhookEventRepository.save(row);
        return ResponseEntity.ok(applied ? "ok" : "no_match");
    }

    private String parseExternalEventId(byte[] rawBody) {
        try {
            JsonNode root = objectMapper.readTree(rawBody);
            if (root.hasNonNull("id")) {
                return root.get("id").asText();
            }
            if (root.hasNonNull("event_id")) {
                return root.get("event_id").asText();
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    private String parseProviderStatus(byte[] rawBody) {
        try {
            JsonNode root = objectMapper.readTree(rawBody);
            String event = root.hasNonNull("event") ? root.get("event").asText("") : "";
            String status = root.path("payload").path("payout").path("entity").path("status").asText("");
            // Event matrix first, then entity status fallback.
            if (event.endsWith(".processed") || event.endsWith(".processed_by_payout")) return "PROCESSED";
            if (event.endsWith(".reversed") || event.endsWith(".rejected") || event.endsWith(".failed") || event.endsWith(".cancelled")) return "FAILED";
            if (event.endsWith(".queued") || event.endsWith(".pending") || event.endsWith(".initiated")) return "SUBMITTED";
            if ("processed".equalsIgnoreCase(status) || "completed".equalsIgnoreCase(status)) return "PROCESSED";
            if ("failed".equalsIgnoreCase(status) || "rejected".equalsIgnoreCase(status) || "reversed".equalsIgnoreCase(status) || "cancelled".equalsIgnoreCase(status)) return "FAILED";
            if ("queued".equalsIgnoreCase(status) || "pending".equalsIgnoreCase(status) || "processing".equalsIgnoreCase(status) || "initiated".equalsIgnoreCase(status)) return "SUBMITTED";
            return "SUBMITTED";
        } catch (Exception e) {
            return "SUBMITTED";
        }
    }

    private String parseTenantIdFromPayoutWebhook(byte[] rawBody) {
        try {
            JsonNode notes = objectMapper.readTree(rawBody).path("payload").path("payout").path("entity").path("notes");
            if (notes.hasNonNull("tenantId")) {
                return notes.get("tenantId").asText().trim();
            }
            if (notes.hasNonNull("tenant_id")) {
                return notes.get("tenant_id").asText().trim();
            }
        } catch (Exception e) {
            log.debug("Payroll webhook tenant parse skipped: {}", e.getMessage());
        }
        return null;
    }

    private void parseMetadata(byte[] rawBody, PayrollPayoutWebhookEvent row) {
        try {
            JsonNode root = objectMapper.readTree(rawBody);
            if (root.hasNonNull("event")) {
                row.setDetail(root.get("event").asText());
            }
            String referenceId = root.path("payload").path("payout").path("entity").path("reference_id").asText(null);
            if (referenceId == null || referenceId.isBlank()) {
                referenceId = root.path("payload").path("payout").path("entity").path("id").asText(null);
            }
            row.setReferenceId(referenceId);
            String providerStatus = root.path("payload").path("payout").path("entity").path("status").asText("");
            if (!providerStatus.isBlank()) {
                String current = row.getDetail() != null ? row.getDetail() : "";
                row.setDetail((current.isBlank() ? "" : current + " | ") + "status=" + providerStatus);
            }
        } catch (Exception e) {
            log.debug("Payroll webhook metadata parse skipped: {}", e.getMessage());
        }
    }

    private static String sha256Hex(byte[] body) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(body));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
