package com.school.erp.modules.payroll.payout;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * RazorpayX adapter placeholder.
 * Keeps production contract ready while mock mode remains active.
 */
@Component
@ConditionalOnProperty(prefix = "app.payroll.payout", name = "provider", havingValue = "razorpayx")
public class RazorpayXPayrollPayoutGatewayClient implements PayrollPayoutGatewayClient {
    private final PayrollPayoutRazorpayXProperties properties;
    private final ObjectMapper objectMapper;
    private final PayrollPayoutBeneficiaryService beneficiaryService;
    private final RestTemplate restTemplate = new RestTemplate();

    public RazorpayXPayrollPayoutGatewayClient(
            PayrollPayoutRazorpayXProperties properties,
            ObjectMapper objectMapper,
            PayrollPayoutBeneficiaryService beneficiaryService) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.beneficiaryService = beneficiaryService;
    }

    @Override
    @CircuitBreaker(name = "paymentGateway")
    @Retry(name = "paymentGateway")
    public PayoutInitiationResult initiate(PayoutInitiationRequest request) {
        String referenceId = payoutReferenceId(request);
        Map<String, Object> contractPayload = Map.of(
                "provider", "razorpayx",
                "mode", properties.isDryRun() ? "dry-run" : "live-contract",
                "auth", Map.of("keyId", maskedKeyId()),
                "contact", toContactPayload(request),
                "fundAccount", toFundAccountPayload(request),
                "payout", toPayoutPayload(request, referenceId, "fund_account_cached"));
        if (properties.isDryRun()) {
            return new PayoutInitiationResult("razorpayx", referenceId, "SUBMITTED", toJson(contractPayload));
        }
        ensureLiveCredentials();
        String endpoint = "https://api.razorpay.com/v1/payouts";
        HttpHeaders headers = authHeaders();
        BeneficiaryRef beneficiaryRef = resolveBeneficiary(request, headers);
        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(toPayoutPayload(request, referenceId, beneficiaryRef.fundAccountId()), headers);
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.exchange(endpoint, HttpMethod.POST, entity, Map.class).getBody();
            String providerRef = extractString(response, "reference_id", referenceId);
            String providerStatus = mapProviderStatus(extractString(response, "status", "queued"));
            return new PayoutInitiationResult("razorpayx", providerRef, providerStatus, toJson(response != null ? response : contractPayload));
        } catch (HttpStatusCodeException ex) {
            String errorBody = ex.getResponseBodyAsString();
            Map<String, Object> failurePayload = Map.of(
                    "provider", "razorpayx",
                    "status", ex.getStatusCode().value(),
                    "error", trimPayload(errorBody));
            return new PayoutInitiationResult("razorpayx", referenceId, "FAILED", toJson(failurePayload));
        } catch (RestClientException ex) {
            Map<String, Object> failurePayload = Map.of(
                    "provider", "razorpayx",
                    "error", ex.getMessage() != null ? ex.getMessage() : "request_failed");
            return new PayoutInitiationResult("razorpayx", referenceId, "FAILED", toJson(failurePayload));
        }
    }

    @Override
    @CircuitBreaker(name = "paymentGateway")
    @Retry(name = "paymentGateway")
    public PayoutStatusResult fetchStatus(String providerReferenceId) {
        if (properties.isDryRun()) {
            String payload = toJson(Map.of(
                    "provider", "razorpayx",
                    "mode", "dry-run",
                    "referenceId", providerReferenceId));
            return new PayoutStatusResult("razorpayx", providerReferenceId, "SUBMITTED", payload);
        }
        ensureLiveCredentials();
        String endpoint = "https://api.razorpay.com/v1/payouts?reference_id=" + providerReferenceId;
        try {
            HttpEntity<Void> entity = new HttpEntity<>(authHeaders());
            String raw = restTemplate.exchange(endpoint, HttpMethod.GET, entity, String.class).getBody();
            Map<String, Object> parsed = objectMapper.readValue(raw, new TypeReference<>() {});
            String providerStatus = extractNestedStatus(parsed);
            return new PayoutStatusResult("razorpayx", providerReferenceId, mapProviderStatus(providerStatus), raw);
        } catch (Exception ex) {
            String payload = toJson(Map.of("provider", "razorpayx", "referenceId", providerReferenceId, "error", ex.getMessage()));
            return new PayoutStatusResult("razorpayx", providerReferenceId, "SUBMITTED", payload);
        }
    }

    private String payoutReferenceId(PayoutInitiationRequest request) {
        String op = request.operationKey() != null ? request.operationKey().replaceAll("[^A-Za-z0-9]", "") : "PAYOUT";
        String tail = op.length() > 14 ? op.substring(op.length() - 14) : op;
        return "RZPX-" + tail.toUpperCase(Locale.ROOT);
    }

    private Map<String, Object> toContactPayload(PayoutInitiationRequest request) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("name", request.teacherName());
        out.put("reference_id", properties.getContactPrefix() + request.teacherId());
        out.put("type", "employee");
        return out;
    }

    private Map<String, Object> toFundAccountPayload(PayoutInitiationRequest request) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("account_type", "bank_account");
        out.put("bank_account", Map.of(
                "name", request.bankAccountHolder(),
                "ifsc", request.bankIfsc(),
                "account_number", request.bankAccountNumber()));
        return out;
    }

    private Map<String, Object> toPayoutPayload(PayoutInitiationRequest request, String referenceId, String fundAccountId) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("account_number", properties.getAccountNumber());
        out.put("amount", request.amount().movePointRight(2).longValue());
        out.put("currency", request.currency() != null ? request.currency() : "INR");
        out.put("mode", railToRazorpayMode(request.paymentMethod()));
        out.put("fund_account_id", fundAccountId);
        out.put("purpose", "salary");
        out.put("reference_id", referenceId);
        out.put("narration", "Salary payout");
        out.put("notes", Map.of(
                "operationKey", request.operationKey(),
                "tenantId", request.tenantId(),
                "teacherId", String.valueOf(request.teacherId())));
        return out;
    }

    private String extractNestedStatus(Map<String, Object> payload) {
        Object items = payload.get("items");
        if (items instanceof java.util.List<?> list && !list.isEmpty() && list.get(0) instanceof Map<?, ?> first) {
            Object raw = first.get("status");
            if (raw instanceof String str) {
                return str;
            }
        }
        return "queued";
    }

    private static String railToRazorpayMode(String paymentMethod) {
        String method = paymentMethod != null ? paymentMethod.trim().toUpperCase(Locale.ROOT) : "NEFT";
        return switch (method) {
            case "UPI" -> "UPI";
            case "IMPS" -> "IMPS";
            case "NETBANKING", "NEFT" -> "NEFT";
            default -> "NEFT";
        };
    }

    private HttpHeaders authHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBasicAuth(
                properties.getKeyId() != null ? properties.getKeyId() : "",
                properties.getKeySecret() != null ? properties.getKeySecret() : "");
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    private void ensureLiveCredentials() {
        if (isBlank(properties.getKeyId()) || isBlank(properties.getKeySecret()) || isBlank(properties.getAccountNumber())) {
            throw new IllegalStateException("RazorpayX live mode requires key-id, key-secret, and account-number.");
        }
    }

    private String maskedKeyId() {
        String keyId = properties.getKeyId();
        if (isBlank(keyId) || keyId.length() < 6) {
            return "not-configured";
        }
        return keyId.substring(0, 3) + "..." + keyId.substring(keyId.length() - 3);
    }

    private static String mapProviderStatus(String rawStatus) {
        String status = rawStatus != null ? rawStatus.trim().toLowerCase(Locale.ROOT) : "";
        return switch (status) {
            case "processed", "completed" -> "PROCESSED";
            case "failed", "rejected", "cancelled", "reversed" -> "FAILED";
            case "queued", "pending", "processing", "initiated" -> "SUBMITTED";
            default -> "SUBMITTED";
        };
    }

    private static String extractString(Map<String, Object> payload, String key, String fallback) {
        if (payload == null) return fallback;
        Object value = payload.get(key);
        return value instanceof String s && !s.isBlank() ? s : fallback;
    }

    private static String trimPayload(String payload) {
        if (payload == null) return "";
        return payload.length() > 700 ? payload.substring(0, 700) + "..." : payload;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private BeneficiaryRef resolveBeneficiary(PayoutInitiationRequest request, HttpHeaders headers) {
        var existing = beneficiaryService.findExisting(
                request.tenantId(),
                request.teacherId(),
                "razorpayx",
                request.bankAccountNumber(),
                request.bankIfsc());
        if (existing.isPresent()) {
            var row = existing.get();
            return new BeneficiaryRef(row.getContactId(), row.getFundAccountId());
        }
        String contactId = createContact(request, headers);
        String fundAccountId = createFundAccount(request, headers, contactId);
        beneficiaryService.saveOrReuse(
                request.tenantId(),
                request.teacherId(),
                "razorpayx",
                request.bankAccountNumber(),
                request.bankIfsc(),
                contactId,
                fundAccountId);
        return new BeneficiaryRef(contactId, fundAccountId);
    }

    private String createContact(PayoutInitiationRequest request, HttpHeaders headers) {
        String endpoint = "https://api.razorpay.com/v1/contacts";
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(toContactPayload(request), headers);
        @SuppressWarnings("unchecked")
        Map<String, Object> response = restTemplate.exchange(endpoint, HttpMethod.POST, entity, Map.class).getBody();
        return extractString(response, "id", "cont_" + UUID.randomUUID().toString().replace("-", ""));
    }

    private String createFundAccount(PayoutInitiationRequest request, HttpHeaders headers, String contactId) {
        String endpoint = "https://api.razorpay.com/v1/fund_accounts";
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("contact_id", contactId);
        payload.putAll(toFundAccountPayload(request));
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
        @SuppressWarnings("unchecked")
        Map<String, Object> response = restTemplate.exchange(endpoint, HttpMethod.POST, entity, Map.class).getBody();
        return extractString(response, "id", "fa_" + UUID.randomUUID().toString().replace("-", ""));
    }

    private String toJson(Object payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            return "{\"provider\":\"razorpayx\",\"serialization\":\"failed\"}";
        }
    }

    private record BeneficiaryRef(String contactId, String fundAccountId) {}
}
