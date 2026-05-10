package com.school.erp.modules.notification.sms.impl;

import com.school.erp.modules.notification.sms.BulkSmsRequest;
import com.school.erp.modules.notification.sms.BulkSmsResponse;
import com.school.erp.modules.notification.sms.SmsRequest;
import com.school.erp.modules.notification.sms.SmsResponse;
import com.school.erp.modules.notification.sms.SmsService;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * SpringEdge (HTTP JSON, Bearer API key). DLT/transactional SMS in India. Configure
 * {@code app.sms.provider=SPRING_EDGE} or {@code app.sms.providers.springedge.enabled=true} with routing
 * to combine with other {@link SmsService} beans.
 *
 * <p>API path defaults to {@code {baseUrl}/v1/sms/send}; set {@code app.sms.springedge.path} if the vendor changes.</p>
 */
@Service
@ConditionalOnExpression(
        "'${app.sms.provider:MOCK}'.equalsIgnoreCase('SPRING_EDGE') ||"
                + " '${app.sms.providers.springedge.enabled:false}'.equalsIgnoreCase('true')")
public class SpringedgeSmsService implements SmsService {

    public static final String PROVIDER_NAME = "SPRING_EDGE";
    private static final Logger log = LoggerFactory.getLogger(SpringedgeSmsService.class);
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.sms.springedge.api-key:}")
    private String apiKey;

    @Value("${app.sms.springedge.sender-id:}")
    private String senderId;

    @Value("${app.sms.springedge.base-url:https://api.springedge.com}")
    private String baseUrl;

    @Value("${app.sms.springedge.path:/v1/sms/send}")
    private String path;

    @Value("${app.sms.springedge.message-type:transactional}")
    private String messageType;

    @Value("${app.sms.springedge.healthcheck-enabled:false}")
    private boolean healthcheckEnabled;

    @Override
    @CircuitBreaker(name = "smsProvider")
    @Retry(name = "smsProvider")
    public SmsResponse sendSms(SmsRequest request) {
        if (!isConfigured()) {
            return SmsResponse.builder()
                    .success(false)
                    .providerName(PROVIDER_NAME)
                    .providerStatus("CONFIG_ERROR")
                    .errorMessage("SpringEdge: set APP_SMS_SPRINGEDGE_API_KEY and APP_SMS_SPRINGEDGE_SENDER_ID")
                    .build();
        }
        String to = normalizeTo(request.getTo());
        if (!StringUtils.hasText(to)) {
            return SmsResponse.builder()
                    .success(false)
                    .providerName(PROVIDER_NAME)
                    .providerStatus("INVALID_PHONE")
                    .errorMessage("Recipient phone is empty or invalid")
                    .build();
        }
        String message = request.getMessage() == null ? "" : request.getMessage().trim();
        if (message.isEmpty()) {
            return SmsResponse.builder()
                    .success(false)
                    .providerName(PROVIDER_NAME)
                    .providerStatus("INVALID_MESSAGE")
                    .errorMessage("SMS message cannot be empty")
                    .build();
        }
        String url = trimSlash(baseUrl) + (path.startsWith("/") ? path : "/" + path);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("to", to);
        body.put("sender_id", senderId.trim());
        body.put("message", message);
        if (StringUtils.hasText(messageType)) {
            body.put("type", messageType.trim());
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.setBearerAuth(apiKey.trim());
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> res = restTemplate
                    .exchange(
                            url, HttpMethod.POST, new HttpEntity<>(body, headers), Map.class)
                    .getBody();
            return parseResponse(res);
        } catch (HttpStatusCodeException ex) {
            String snippet = ex.getResponseBodyAsString();
            if (snippet != null && snippet.length() > 200) {
                snippet = snippet.substring(0, 200) + "...";
            }
            log.warn("SpringEdge HTTP status={} body={}", ex.getStatusCode(), snippet);
            return SmsResponse.builder()
                    .success(false)
                    .providerName(PROVIDER_NAME)
                    .providerStatus(ex.getStatusCode().is5xxServerError() ? "TEMP_FAIL" : "REJECTED")
                    .errorMessage("SpringEdge " + ex.getStatusCode() + (snippet != null ? ": " + snippet : ""))
                    .build();
        } catch (RestClientException ex) {
            log.warn("SpringEdge send failed: {}", ex.getMessage());
            return SmsResponse.builder()
                    .success(false)
                    .providerName(PROVIDER_NAME)
                    .providerStatus("NETWORK_ERROR")
                    .errorMessage(ex.getMessage())
                    .build();
        }
    }

    @Override
    public BulkSmsResponse sendBulkSms(BulkSmsRequest request) {
        SmsResponse[] responses = new SmsResponse[request.getRecipients().length];
        int ok = 0;
        for (int i = 0; i < request.getRecipients().length; i++) {
            SmsResponse one = sendSms(SmsRequest.builder()
                    .to(request.getRecipients()[i])
                    .message(request.getMessage())
                    .from(request.getFrom())
                    .tenantId(request.getTenantId())
                    .correlationId(request.getCorrelationId())
                    .build());
            responses[i] = one;
            if (one != null && one.isSuccess()) {
                ok++;
            }
        }
        return BulkSmsResponse.builder()
                .totalSent(request.getRecipients().length)
                .successCount(ok)
                .failedCount(request.getRecipients().length - ok)
                .responses(responses)
                .build();
    }

    @Override
    public String getProviderName() {
        return PROVIDER_NAME;
    }

    @Override
    public boolean isHealthy() {
        if (!isConfigured()) {
            return false;
        }
        if (!healthcheckEnabled) {
            return true;
        }
        // Optional: probe base URL; SpringEdge may not publish a public ping — keep disabled by default.
        return true;
    }

    private boolean isConfigured() {
        return StringUtils.hasText(apiKey) && StringUtils.hasText(senderId);
    }

    private static SmsResponse parseResponse(Map<String, Object> res) {
        if (res == null) {
            return SmsResponse.builder()
                    .success(false)
                    .providerName(PROVIDER_NAME)
                    .providerStatus("EMPTY_RESPONSE")
                    .errorMessage("Empty JSON from SpringEdge")
                    .build();
        }
        if (Boolean.FALSE.equals(res.get("success"))) {
            Object err = res.get("error") != null ? res.get("error") : res.get("message");
            return SmsResponse.builder()
                    .success(false)
                    .providerName(PROVIDER_NAME)
                    .providerStatus("REJECTED")
                    .errorMessage(err != null ? String.valueOf(err) : "Request rejected")
                    .build();
        }
        boolean ok = Boolean.TRUE.equals(res.get("success"))
                || "ok".equalsIgnoreCase(String.valueOf(res.get("status")))
                || "success".equalsIgnoreCase(String.valueOf(res.get("status")))
                || res.containsKey("id")
                || res.containsKey("message_id");
        Object err = res.get("error");
        String id = asString(res.get("id") != null ? res.get("id") : res.get("message_id"));
        if (ok && (err == null || String.valueOf(err).isBlank())) {
            return SmsResponse.builder()
                    .success(true)
                    .messageId(id)
                    .providerName(PROVIDER_NAME)
                    .providerStatus("QUEUED")
                    .build();
        }
        return SmsResponse.builder()
                .success(false)
                .providerName(PROVIDER_NAME)
                .providerStatus("REJECTED")
                .messageId(id)
                .errorMessage(err != null ? String.valueOf(err) : "Unexpected response from SpringEdge")
                .build();
    }

    private static String asString(Object o) {
        return o == null ? null : String.valueOf(o);
    }

    private static String trimSlash(String u) {
        if (u == null) {
            return "";
        }
        return u.replaceAll("/+$", "");
    }

    /**
     * Prefer E.164 (+country + national); minimal India 10-digit to +91.
     */
    private static String normalizeTo(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        String t = raw.trim();
        if (t.startsWith("+")) {
            return t;
        }
        String digits = t.replaceAll("\\D", "");
        if (digits.length() == 10) {
            return "+91" + digits;
        }
        if (digits.length() >= 11 && !t.contains("+")) {
            return "+" + digits;
        }
        return t.contains("+") ? t : ("+" + digits);
    }
}
