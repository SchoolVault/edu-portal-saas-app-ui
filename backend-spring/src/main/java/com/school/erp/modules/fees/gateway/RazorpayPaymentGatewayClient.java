package com.school.erp.modules.fees.gateway;

import com.school.erp.common.exception.BusinessException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import com.school.erp.modules.finance.domain.FeeSettlementMode;
import com.school.erp.modules.finance.entity.TenantFinanceProfile;
import com.school.erp.modules.finance.repository.TenantFinanceProfileRepository;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Razorpay-like adapter:
 * - createSession returns providerOrderId + checkoutToken
 * - confirmPayment verifies signature if provided (when secret configured)
 *
 * This keeps the gateway integration behind {@link PaymentGatewayClient} so it can be swapped
 * without touching fee domain logic.
 */
@Component
public class RazorpayPaymentGatewayClient {

    private final TenantFinanceProfileRepository tenantFinanceProfileRepository;

    public RazorpayPaymentGatewayClient(TenantFinanceProfileRepository tenantFinanceProfileRepository) {
        this.tenantFinanceProfileRepository = tenantFinanceProfileRepository;
    }
    /** Razorpay Orders API: {@code receipt} max length 40. */
    private static final int RAZORPAY_RECEIPT_MAX_LEN = 40;
    private static final Logger log = LoggerFactory.getLogger(RazorpayPaymentGatewayClient.class);
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.payments.razorpay.api-base:https://api.razorpay.com}")
    private String apiBase;
    @Value("${app.payments.razorpay.key:}")
    private String key;
    @Value("${app.payments.razorpay.secret:}")
    private String secret;
    /**
     * When true and key/secret are missing, returns a synthetic order (Checkout.js will 400 — dev only).
     * Production must keep this false and set {@code RAZORPAY_KEY} / {@code RAZORPAY_SECRET}.
     */
    @Value("${app.payments.razorpay.fallback-without-credentials:false}")
    private boolean fallbackWithoutCredentials;

    @CircuitBreaker(name = "paymentGateway")
    @Retry(name = "paymentGateway")
    public PaymentGatewayClient.GatewayCheckoutSession create(FeeGatewayOrderContext ctx) {
        String tenantId = ctx.tenantId();
        Long paymentId = ctx.feePaymentId();
        BigDecimal amount = ctx.amount();
        String currency = ctx.currency();
        String returnUrl = ctx.returnUrl();

        String normalizedCurrency = (currency == null || currency.isBlank()) ? "INR" : currency.trim().toUpperCase(Locale.ROOT);
        if (!"INR".equals(normalizedCurrency)) {
            throw new BusinessException("Razorpay adapter supports INR only");
        }

        boolean credsOk = key != null && !key.isBlank() && secret != null && !secret.isBlank();
        if (!credsOk) {
            if (fallbackWithoutCredentials) {
                return syntheticSession(ctx, "no_api_credentials");
            }
            throw new BusinessException(
                    "Razorpay is not configured: set RAZORPAY_KEY and RAZORPAY_SECRET on the server (same mode: test vs live as your publishable key).");
        }

        long amountPaise = amount.setScale(2, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).longValueExact();
        String receipt = buildRazorpayReceipt(tenantId, paymentId);
        log.info("Razorpay order create tenant={} paymentId={} attemptId={} receiptLen={} (max {})",
                tenantId, paymentId, ctx.feePaymentAttemptId(), receipt.length(), RAZORPAY_RECEIPT_MAX_LEN);

        Map<String, Object> notes = new LinkedHashMap<>();
        notes.put("tenant_id", tenantId);
        notes.put("fee_payment_id", String.valueOf(paymentId));
        notes.put("fee_payment_attempt_id", String.valueOf(ctx.feePaymentAttemptId()));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("amount", amountPaise);
        body.put("currency", normalizedCurrency);
        body.put("receipt", receipt);
        body.put("payment_capture", 1);
        body.put("notes", notes);

        TenantFinanceProfile profile = tenantFinanceProfileRepository.findByTenantIdAndIsDeletedFalse(tenantId).orElse(null);
        if (profile != null && FeeSettlementMode.ROUTE_LINKED_ACCOUNT.name().equals(profile.getFeeSettlementMode())) {
            String linked = profile.getRazorpayRouteLinkedAccountId();
            if (linked == null || linked.isBlank()) {
                throw new BusinessException("Route settlement is enabled but razorpayRouteLinkedAccountId is missing for this tenant");
            }
            int bps = Math.max(0, Math.min(10_000, profile.getPlatformCommissionBps()));
            if (bps >= 10_000) {
                throw new BusinessException("platformCommissionBps cannot be 10000 with Route transfers (no amount would reach the school account)");
            }
            long toSchoolPaise = amountPaise * (10_000L - bps) / 10_000L;
            if (toSchoolPaise <= 0) {
                throw new BusinessException("Computed Route transfer amount is zero; check order amount and commission bps");
            }
            if (bps > 0) {
                log.info("Razorpay Route order: tenant={} linkedAccount={} commissionBps={} schoolSharePaise={} of {}",
                        tenantId, linked, bps, toSchoolPaise, amountPaise);
            }
            Map<String, Object> transfer = new LinkedHashMap<>();
            transfer.put("account", linked.trim());
            transfer.put("amount", toSchoolPaise);
            transfer.put("currency", normalizedCurrency);
            List<Map<String, Object>> transfers = new ArrayList<>();
            transfers.add(transfer);
            body.put("transfers", transfers);
        }

        String url = apiBase.replaceAll("/+$", "") + "/v1/orders";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String basic = Base64.getEncoder().encodeToString((key.trim() + ":" + secret.trim()).getBytes(StandardCharsets.UTF_8));
        headers.set(HttpHeaders.AUTHORIZATION, "Basic " + basic);

        Map<?, ?> res;
        try {
            res = restTemplate.postForObject(url, new HttpEntity<>(body, headers), Map.class);
        } catch (HttpStatusCodeException ex) {
            String bodySnippet = ex.getResponseBodyAsString();
            if (bodySnippet != null && bodySnippet.length() > 500) {
                bodySnippet = bodySnippet.substring(0, 500) + "…";
            }
            log.error("Razorpay POST /v1/orders failed status={} body={}", ex.getStatusCode(), bodySnippet);
            throw new BusinessException("Razorpay rejected order creation (" + ex.getStatusCode().value()
                    + "). Check key/secret pair, test vs live mode, Route linked account, and that the key matches Checkout. Details: " + bodySnippet);
        } catch (RestClientException ex) {
            log.error("Razorpay order request failed: {}", ex.getMessage());
            throw new BusinessException("Could not reach Razorpay API to create order: " + ex.getMessage());
        }

        if (res == null || res.get("id") == null) {
            throw new BusinessException("Razorpay returned no order id; check API response and credentials.");
        }
        String orderId = String.valueOf(res.get("id"));
        if (!orderId.startsWith("order_")) {
            log.warn("Unexpected Razorpay order id shape: {}", orderId);
        }
        String token = "razorpay-token-" + UUID.randomUUID().toString().replace("-", "");
        String payload = String.valueOf(res);
        String checkoutUrl = (returnUrl != null && !returnUrl.isBlank()) ? returnUrl : null;
        return new PaymentGatewayClient.GatewayCheckoutSession("razorpay", orderId, token, checkoutUrl, payload);
    }

    /**
     * Receipt must be ≤ 40 chars (Razorpay limit). Embed tenant + payment in the hash, UUID per attempt for uniqueness.
     * Correlate with server logs via {@code paymentId} / {@code tenantId} — Razorpay dashboard shows receipt only.
     */
    static String buildRazorpayReceipt(String tenantId, Long paymentId) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update((tenantId != null ? tenantId : "").getBytes(StandardCharsets.UTF_8));
            md.update((byte) '|');
            md.update(String.valueOf(paymentId).getBytes(StandardCharsets.UTF_8));
            md.update((byte) '|');
            md.update(UUID.randomUUID().toString().getBytes(StandardCharsets.UTF_8));
            byte[] digest = md.digest();
            StringBuilder sb = new StringBuilder(32);
            for (int i = 0; i < 16; i++) {
                sb.append(String.format("%02x", digest[i]));
            }
            String out = sb.toString();
            if (out.length() > RAZORPAY_RECEIPT_MAX_LEN) {
                throw new IllegalStateException("receipt length invariant broken");
            }
            return out;
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private PaymentGatewayClient.GatewayCheckoutSession syntheticSession(FeeGatewayOrderContext ctx, String reason) {
        String orderId = "RAZORPAY-ORDER-" + UUID.randomUUID().toString().substring(0, 10);
        String token = "razorpay-token-" + UUID.randomUUID().toString().replace("-", "");
        String payload = "{\"provider\":\"razorpay\",\"mode\":\"synthetic\",\"reason\":\"" + reason + "\",\"paymentId\":" + ctx.feePaymentId()
                + ",\"attemptId\":" + ctx.feePaymentAttemptId() + ",\"amount\":\"" + ctx.amount() + "\"}";
        log.warn("Razorpay synthetic checkout session ({}). Do not open real Checkout.js — set credentials or disable this path.", reason);
        return new PaymentGatewayClient.GatewayCheckoutSession("razorpay", orderId, token, ctx.returnUrl(), payload);
    }

    @CircuitBreaker(name = "paymentGateway")
    @Retry(name = "paymentGateway")
    public PaymentGatewayClient.GatewayPaymentConfirmation confirm(String checkoutToken, String providerOrderId, String providerPaymentId, String providerSignature) {
        if (providerPaymentId == null || providerPaymentId.isBlank()) {
            throw new BusinessException("providerPaymentId is required for Razorpay confirmation");
        }

        if (secret != null && !secret.isBlank()) {
            if (providerSignature == null || providerSignature.isBlank()) {
                throw new BusinessException("Razorpay signature is required");
            }
            String data = providerOrderId + "|" + providerPaymentId;
            String expected = hmacSha256Hex(secret, data);
            if (!expected.equals(providerSignature)) {
                throw new BusinessException("Invalid Razorpay signature");
            }
        }

        String payload = "{\"provider\":\"razorpay\",\"checkoutToken\":\"" + checkoutToken + "\",\"providerOrderId\":\"" + providerOrderId + "\",\"providerPaymentId\":\"" + providerPaymentId + "\"}";
        return new PaymentGatewayClient.GatewayPaymentConfirmation(providerPaymentId, "SUCCESS", payload);
    }

    @CircuitBreaker(name = "paymentGateway")
    @Retry(name = "paymentGateway")
    public PaymentGatewayClient.GatewayPaymentStatus fetchPaymentStatus(String providerOrderId, String providerPaymentId) {
        if (providerPaymentId == null || providerPaymentId.isBlank()) {
            return new PaymentGatewayClient.GatewayPaymentStatus(null, "PENDING", "{\"reason\":\"missing_provider_payment_id\"}");
        }
        boolean credsOk = key != null && !key.isBlank() && secret != null && !secret.isBlank();
        if (!credsOk) {
            return new PaymentGatewayClient.GatewayPaymentStatus(providerPaymentId, "PENDING", "{\"reason\":\"missing_credentials\"}");
        }
        String url = apiBase.replaceAll("/+$", "") + "/v1/payments/" + providerPaymentId.trim();
        HttpHeaders headers = new HttpHeaders();
        String basic = Base64.getEncoder().encodeToString((key.trim() + ":" + secret.trim()).getBytes(StandardCharsets.UTF_8));
        headers.set(HttpHeaders.AUTHORIZATION, "Basic " + basic);
        try {
            String raw = restTemplate.postForObject(url, new HttpEntity<>(null, headers), String.class);
            String status = "PENDING";
            try {
                String parsed = objectMapper.readTree(raw).path("status").asText("");
                status = mapRazorpayStatus(parsed);
            } catch (Exception ignored) {
                // Keep fallback value.
            }
            return new PaymentGatewayClient.GatewayPaymentStatus(providerPaymentId, status, raw);
        } catch (HttpStatusCodeException ex) {
            String bodySnippet = ex.getResponseBodyAsString();
            return new PaymentGatewayClient.GatewayPaymentStatus(providerPaymentId, "PENDING", bodySnippet);
        } catch (RestClientException ex) {
            return new PaymentGatewayClient.GatewayPaymentStatus(providerPaymentId, "PENDING", "{\"error\":\"" + ex.getMessage() + "\"}");
        }
    }

    private String hmacSha256Hex(String secret, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(raw.length * 2);
            for (byte b : raw) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new BusinessException("Failed to verify gateway signature");
        }
    }

    private static String mapRazorpayStatus(String raw) {
        String normalized = raw == null ? "" : raw.trim().toLowerCase(Locale.ROOT);
        if ("captured".equals(normalized)) return "CAPTURED";
        if ("failed".equals(normalized)) return "FAILED";
        return "PENDING";
    }

    /** Publishable key for Checkout.js (safe to return to authenticated parent/admin clients). */
    public String getPublishableKey() {
        return key != null ? key.trim() : "";
    }

    /**
     * Creates a Razorpay order for canonical fees-v2 online collection. Notes include {@code fees_v2=true}
     * so {@link com.school.erp.modules.fees.webhook.FeeRazorpayWebhookProcessor} can post {@code payment_v2}
     * without a legacy {@code fee_payment_attempt}.
     */
    @CircuitBreaker(name = "paymentGateway")
    @Retry(name = "paymentGateway")
    public PaymentGatewayClient.GatewayCheckoutSession createFeesV2Order(String tenantId, Long academicYearId, Long studentId, BigDecimal amount) {
        if (tenantId == null || tenantId.isBlank() || academicYearId == null || studentId == null || amount == null) {
            throw new BusinessException("tenantId, academicYearId, studentId, and amount are required");
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Amount must be positive");
        }
        boolean credsOk = key != null && !key.isBlank() && secret != null && !secret.isBlank();
        if (!credsOk) {
            if (fallbackWithoutCredentials) {
                String orderId = "RAZORPAY-V2-" + UUID.randomUUID().toString().substring(0, 10);
                String token = "razorpay-token-" + UUID.randomUUID().toString().replace("-", "");
                String payload = "{\"provider\":\"razorpay\",\"mode\":\"synthetic\",\"feesV2\":true}";
                log.warn("Razorpay fees-v2 synthetic order (no API credentials).");
                return new PaymentGatewayClient.GatewayCheckoutSession("razorpay", orderId, token, null, payload);
            }
            throw new BusinessException(
                    "Razorpay is not configured: set RAZORPAY_KEY and RAZORPAY_SECRET on the server.");
        }
        String normalizedCurrency = "INR";
        long amountPaise = amount.setScale(2, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).longValueExact();
        String receipt = buildRazorpayReceiptV2(tenantId, academicYearId, studentId);
        Map<String, Object> notes = new LinkedHashMap<>();
        notes.put("fees_v2", "true");
        notes.put("tenant_id", tenantId);
        notes.put("academic_year_id", String.valueOf(academicYearId));
        notes.put("student_id", String.valueOf(studentId));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("amount", amountPaise);
        body.put("currency", normalizedCurrency);
        body.put("receipt", receipt);
        body.put("payment_capture", 1);
        body.put("notes", notes);

        TenantFinanceProfile profile = tenantFinanceProfileRepository.findByTenantIdAndIsDeletedFalse(tenantId).orElse(null);
        if (profile != null && FeeSettlementMode.ROUTE_LINKED_ACCOUNT.name().equals(profile.getFeeSettlementMode())) {
            String linked = profile.getRazorpayRouteLinkedAccountId();
            if (linked == null || linked.isBlank()) {
                throw new BusinessException("Route settlement is enabled but razorpayRouteLinkedAccountId is missing for this tenant");
            }
            int bps = Math.max(0, Math.min(10_000, profile.getPlatformCommissionBps()));
            if (bps >= 10_000) {
                throw new BusinessException("platformCommissionBps cannot be 10000 with Route transfers");
            }
            long toSchoolPaise = amountPaise * (10_000L - bps) / 10_000L;
            if (toSchoolPaise <= 0) {
                throw new BusinessException("Computed Route transfer amount is zero");
            }
            if (bps > 0) {
                log.info("Razorpay Route fees-v2 order: tenant={} linkedAccount={} commissionBps={}", tenantId, linked, bps);
            }
            Map<String, Object> transfer = new LinkedHashMap<>();
            transfer.put("account", linked.trim());
            transfer.put("amount", toSchoolPaise);
            transfer.put("currency", normalizedCurrency);
            List<Map<String, Object>> transfers = new ArrayList<>();
            transfers.add(transfer);
            body.put("transfers", transfers);
        }

        String url = apiBase.replaceAll("/+$", "") + "/v1/orders";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String basic = Base64.getEncoder().encodeToString((key.trim() + ":" + secret.trim()).getBytes(StandardCharsets.UTF_8));
        headers.set(HttpHeaders.AUTHORIZATION, "Basic " + basic);
        Map<?, ?> res;
        try {
            res = restTemplate.postForObject(url, new HttpEntity<>(body, headers), Map.class);
        } catch (HttpStatusCodeException ex) {
            String bodySnippet = ex.getResponseBodyAsString();
            if (bodySnippet != null && bodySnippet.length() > 500) {
                bodySnippet = bodySnippet.substring(0, 500) + "…";
            }
            log.error("Razorpay POST /v1/orders (fees-v2) failed status={} body={}", ex.getStatusCode(), bodySnippet);
            throw new BusinessException("Razorpay rejected order creation (" + ex.getStatusCode().value() + "): " + bodySnippet);
        } catch (RestClientException ex) {
            throw new BusinessException("Could not reach Razorpay API: " + ex.getMessage());
        }
        if (res == null || res.get("id") == null) {
            throw new BusinessException("Razorpay returned no order id");
        }
        String orderId = String.valueOf(res.get("id"));
        String token = "razorpay-token-" + UUID.randomUUID().toString().replace("-", "");
        try {
            String rawPayload = objectMapper.writeValueAsString(res);
            return new PaymentGatewayClient.GatewayCheckoutSession("razorpay", orderId, token, null, rawPayload);
        } catch (Exception e) {
            return new PaymentGatewayClient.GatewayCheckoutSession("razorpay", orderId, token, null, String.valueOf(res));
        }
    }

    static String buildRazorpayReceiptV2(String tenantId, Long academicYearId, Long studentId) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update((tenantId != null ? tenantId : "").getBytes(StandardCharsets.UTF_8));
            md.update((byte) '|');
            md.update(String.valueOf(academicYearId).getBytes(StandardCharsets.UTF_8));
            md.update((byte) '|');
            md.update(String.valueOf(studentId).getBytes(StandardCharsets.UTF_8));
            md.update((byte) '|');
            md.update(UUID.randomUUID().toString().getBytes(StandardCharsets.UTF_8));
            byte[] digest = md.digest();
            StringBuilder sb = new StringBuilder(32);
            for (int i = 0; i < 16; i++) {
                sb.append(String.format("%02x", digest[i]));
            }
            String out = sb.toString();
            if (out.length() > RAZORPAY_RECEIPT_MAX_LEN) {
                throw new IllegalStateException("receipt length invariant broken");
            }
            return out;
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}

