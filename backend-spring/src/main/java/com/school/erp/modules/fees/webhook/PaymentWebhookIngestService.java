package com.school.erp.modules.fees.webhook;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.modules.fees.entity.PaymentWebhookEvent;
import com.school.erp.modules.fees.repository.PaymentWebhookEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;

/**
 * Receives signed provider callbacks, persists idempotently, and (later) drives ledger updates.
 * Business side-effects stay behind a single entry point so Razorpay can be swapped or augmented.
 */
@Service
public class PaymentWebhookIngestService {

    private static final Logger log = LoggerFactory.getLogger(PaymentWebhookIngestService.class);
    private static final String PROVIDER = "razorpay";

    private final RazorpayWebhookSignatureVerifier signatureVerifier;
    private final PaymentWebhookEventRepository webhookEventRepository;
    private final ObjectMapper objectMapper;
    private final FeeRazorpayWebhookProcessor feeRazorpayWebhookProcessor;

    public PaymentWebhookIngestService(
            RazorpayWebhookSignatureVerifier signatureVerifier,
            PaymentWebhookEventRepository webhookEventRepository,
            ObjectMapper objectMapper,
            FeeRazorpayWebhookProcessor feeRazorpayWebhookProcessor) {
        this.signatureVerifier = signatureVerifier;
        this.webhookEventRepository = webhookEventRepository;
        this.objectMapper = objectMapper;
        this.feeRazorpayWebhookProcessor = feeRazorpayWebhookProcessor;
    }

    @Transactional
    public ResponseEntity<String> ingestRazorpay(byte[] rawBody, String signatureHeader) {
        if (!signatureVerifier.isConfigured()) {
            log.warn("Razorpay webhook secret not configured — rejecting callback");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body("webhook_not_configured");
        }
        if (rawBody == null || rawBody.length == 0) {
            return ResponseEntity.badRequest().body("empty_body");
        }
        if (!signatureVerifier.verify(rawBody, signatureHeader)) {
            log.warn("Razorpay webhook signature verification failed");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("bad_signature");
        }
        String hash = sha256Hex(rawBody);
        Optional<PaymentWebhookEvent> dup = webhookEventRepository.findByProviderAndPayloadSha256(PROVIDER, hash);
        if (dup.isPresent()) {
            log.debug("Duplicate Razorpay webhook payload hash={}", hash);
            return ResponseEntity.ok("duplicate");
        }
        PaymentWebhookEvent row = new PaymentWebhookEvent();
        row.setProvider(PROVIDER);
        row.setPayloadSha256(hash);
        row.setRawBody(new String(rawBody, StandardCharsets.UTF_8));
        row.setStatus("RECEIVED");
        row.setHttpStatus(200);
        parseMetadata(rawBody, row);
        try {
            webhookEventRepository.save(row);
        } catch (DataIntegrityViolationException ex) {
            log.debug("Concurrent duplicate Razorpay webhook");
            return ResponseEntity.ok("duplicate");
        }
        FeeRazorpayWebhookProcessor.Outcome outcome = feeRazorpayWebhookProcessor.processEventJson(row.getRawBody());
        row.setStatus(switch (outcome.type()) {
            case APPLIED -> "PROCESSED_OK";
            case DUPLICATE -> "PROCESSED_DUPLICATE";
            case IGNORED -> "IGNORED";
            case NO_MATCH -> "NO_MATCH";
            case ERROR -> "ERROR";
        });
        row.setDetail(outcome.detail());
        row.setProcessedAt(Instant.now());
        webhookEventRepository.save(row);
        return ResponseEntity.ok(switch (outcome.type()) {
            case ERROR -> "error";
            case NO_MATCH -> "no_match";
            default -> "ok";
        });
    }

    private void parseMetadata(byte[] rawBody, PaymentWebhookEvent row) {
        try {
            JsonNode root = objectMapper.readTree(rawBody);
            if (root.hasNonNull("event")) {
                row.setDetail(root.get("event").asText());
            }
            if (root.hasNonNull("id")) {
                row.setExternalEventId(root.get("id").asText());
            }
        } catch (Exception e) {
            log.debug("Webhook JSON parse skipped: {}", e.getMessage());
        }
    }

    private static String sha256Hex(byte[] body) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(body));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
