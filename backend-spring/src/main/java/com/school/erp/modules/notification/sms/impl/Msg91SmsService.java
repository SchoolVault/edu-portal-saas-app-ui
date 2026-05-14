package com.school.erp.modules.notification.sms.impl;

import com.school.erp.modules.notification.sms.BulkSmsRequest;
import com.school.erp.modules.notification.sms.BulkSmsResponse;
import com.school.erp.modules.notification.sms.SmsRequest;
import com.school.erp.modules.notification.sms.SmsResponse;
import com.school.erp.modules.notification.sms.SmsService;
import com.school.erp.modules.notification.sms.SmsTemplate;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * MSG91 (India) SMS adapter — configure credentials and HTTP call when moving beyond mock.
 * Enabled when {@code app.sms.provider=MSG91}.
 */
@Service
@ConditionalOnExpression(
    "'${app.sms.provider:MOCK}'.equalsIgnoreCase('MSG91') " +
            "|| '${app.sms.providers.msg91.enabled:false}'.equalsIgnoreCase('true')")
@Slf4j
public class Msg91SmsService implements SmsService {
    private static final String PROVIDER_NAME = "MSG91";
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.sms.msg91.auth-key:}")
    private String authKey;

    @Value("${app.sms.msg91.sender-id:}")
    private String senderId;

    @Value("${app.sms.msg91.base-url:https://control.msg91.com}")
    private String baseUrl;

    @Value("${app.sms.msg91.route:4}")
    private String route;

    @Value("${app.sms.msg91.country:91}")
    private String country;

    @Value("${app.sms.msg91.flow-path:/api/v5/flow}")
    private String flowPath;

    @Value("${app.sms.msg91.pe-id:}")
    private String peId;

    @Value("${app.sms.msg91.connect-timeout-ms:5000}")
    private int connectTimeoutMs;

    @Value("${app.sms.msg91.read-timeout-ms:10000}")
    private int readTimeoutMs;

    @Value("${app.sms.msg91.healthcheck-enabled:}")
    private boolean healthcheckEnabled;

    @Value("${app.sms.msg91.healthcheck-path:/api/balance.php}")
    private String healthcheckPath;

    @PostConstruct
    void configureHttpClientTimeouts() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Math.max(connectTimeoutMs, 1000));
        requestFactory.setReadTimeout(Math.max(readTimeoutMs, 1000));
        restTemplate.setRequestFactory(requestFactory);
    }

    @Override
    @CircuitBreaker(name = "smsProvider")
    @Retry(name = "smsProvider")
    public SmsResponse sendSms(SmsRequest request) {
        if (!StringUtils.hasText(authKey)) {
            return SmsResponse.builder()
                    .success(false)
                    .providerStatus("CONFIG_ERROR")
                    .providerName(PROVIDER_NAME)
                    .errorMessage("MSG91 not configured: set APP_SMS_MSG91_AUTH_KEY")
                    .build();
        }
        String to = normalizePhoneForMsg91(request.getTo());
        if (!StringUtils.hasText(to)) {
            return SmsResponse.builder()
                    .success(false)
                    .providerStatus("INVALID_PHONE")
                    .providerName(PROVIDER_NAME)
                    .errorMessage("Recipient phone is empty or invalid")
                    .build();
        }
        String message = request.getMessage() == null ? "" : request.getMessage().trim();
        SmsTemplate template = request.getTemplate();
        if (template == null && message.isEmpty()) {
            return SmsResponse.builder()
                    .success(false)
                    .providerStatus("INVALID_MESSAGE")
                    .providerName(PROVIDER_NAME)
                    .errorMessage("SMS message cannot be empty")
                    .build();
        }
        if (template != null) {
            return sendTemplateSms(template, to);
        }
        return sendPlainSms(message, to);
    }

    private SmsResponse sendPlainSms(String message, String to) {
        if (!StringUtils.hasText(senderId)) {
            return SmsResponse.builder()
                    .success(false)
                    .providerStatus("CONFIG_ERROR")
                    .providerName(PROVIDER_NAME)
                    .errorMessage("MSG91 sender_id is missing for plain SMS")
                    .build();
        }
        String url = normalizedBaseUrl() + "/api/v2/sendsms";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("authkey", authKey.trim());
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sender", senderId.trim());
        payload.put("route", StringUtils.hasText(route) ? route.trim() : "4");
        payload.put("country", StringUtils.hasText(country) ? country.trim() : "91");
        List<Map<String, Object>> sms = new ArrayList<>();
        Map<String, Object> messageObject = new LinkedHashMap<>();
        messageObject.put("message", message);
        messageObject.put("to", List.of(to));
        sms.add(messageObject);
        payload.put("sms", sms);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, new HttpEntity<>(payload, headers), Map.class);
            return parseResponse(response);
        } catch (HttpStatusCodeException ex) {
            String snippet = ex.getResponseBodyAsString();
            if (snippet != null && snippet.length() > 300) {
                snippet = snippet.substring(0, 300) + "...";
            }
            log.warn("MSG91 send rejected status={} body={}", ex.getStatusCode(), snippet);
            return SmsResponse.builder()
                    .success(false)
                    .providerStatus(mapHttpFailureStatus(ex.getStatusCode().value()))
                    .providerName(PROVIDER_NAME)
                    .errorMessage("MSG91 HTTP " + ex.getStatusCode().value() + ": " + snippet)
                    .build();
        } catch (RestClientException ex) {
            log.warn("MSG91 send failed: {}", ex.getMessage());
            return SmsResponse.builder()
                    .success(false)
                    .providerStatus("NETWORK_ERROR")
                    .providerName(PROVIDER_NAME)
                    .errorMessage(ex.getMessage())
                    .build();
        }
    }

    private SmsResponse sendTemplateSms(SmsTemplate template, String to) {
        if (!StringUtils.hasText(template.getTemplateId())) {
            return SmsResponse.builder()
                    .success(false)
                    .providerStatus("CONFIG_ERROR")
                    .providerName(PROVIDER_NAME)
                    .errorMessage("MSG91 template_id is missing")
                    .build();
        }
        String url = normalizedBaseUrl() + normalizedPath(flowPath);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("authkey", authKey.trim());
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        Map<String, Object> recipient = new LinkedHashMap<>();
        recipient.put("mobiles", countryPrefixMobile(to));
        if (template.getVariables() != null) {
            for (Map.Entry<String, String> entry : template.getVariables().entrySet()) {
                if (StringUtils.hasText(entry.getKey()) && entry.getValue() != null) {
                    recipient.put(entry.getKey(), entry.getValue());
                }
            }
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("template_id", template.getTemplateId().trim());
        payload.put("short_url", "0");
        if (StringUtils.hasText(peId)) {
            payload.put("PE_ID", peId.trim());
        }
        payload.put("recipients", List.of(recipient));

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, new HttpEntity<>(payload, headers), Map.class);
            return parseResponse(response);
        } catch (HttpStatusCodeException ex) {
            String snippet = ex.getResponseBodyAsString();
            if (snippet != null && snippet.length() > 300) {
                snippet = snippet.substring(0, 300) + "...";
            }
            log.warn("MSG91 flow send rejected status={} body={}", ex.getStatusCode(), snippet);
            return SmsResponse.builder()
                    .success(false)
                    .providerStatus(mapHttpFailureStatus(ex.getStatusCode().value()))
                    .providerName(PROVIDER_NAME)
                    .errorMessage("MSG91 HTTP " + ex.getStatusCode().value() + ": " + snippet)
                    .build();
        } catch (RestClientException ex) {
            log.warn("MSG91 flow send failed: {}", ex.getMessage());
            return SmsResponse.builder()
                    .success(false)
                    .providerStatus("NETWORK_ERROR")
                    .providerName(PROVIDER_NAME)
                    .errorMessage(ex.getMessage())
                    .build();
        }
    }

    @Override
    public BulkSmsResponse sendBulkSms(BulkSmsRequest request) {
        SmsResponse[] responses = new SmsResponse[request.getRecipients().length];
        for (int i = 0; i < request.getRecipients().length; i++) {
            responses[i] = sendSms(SmsRequest.builder()
                    .to(request.getRecipients()[i])
                    .message(request.getMessage())
                    .from(request.getFrom())
                    .tenantId(request.getTenantId())
                    .correlationId(request.getCorrelationId())
                    .build());
        }
        int ok = 0;
        for (SmsResponse r : responses) {
            if (r.isSuccess()) {
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
        String url = normalizedBaseUrl() + healthcheckPath;
        HttpHeaders headers = new HttpHeaders();
        headers.set("authkey", authKey.trim());
        try {
            restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, new HttpEntity<>(headers), String.class);
            return true;
        } catch (Exception ex) {
            log.warn("MSG91 healthcheck failed: {}", ex.getMessage());
            return false;
        }
    }

    private SmsResponse parseResponse(Map<String, Object> response) {
        if (response == null) {
            return SmsResponse.builder()
                    .success(false)
                    .providerStatus("EMPTY_RESPONSE")
                    .providerName(PROVIDER_NAME)
                    .errorMessage("Empty response from MSG91")
                    .build();
        }
        String type = asString(response.get("type"));
        String msg = asString(response.get("message"));
        String requestId = asString(response.get("request_id"));
        boolean success = "success".equalsIgnoreCase(type);
        return SmsResponse.builder()
                .success(success)
                .messageId(requestId)
                .providerStatus(success ? "QUEUED" : "REJECTED")
                .providerName(PROVIDER_NAME)
                .errorMessage(success ? null : (msg != null ? msg : "MSG91 rejected request"))
                .build();
    }

    private boolean isConfigured() {
        return StringUtils.hasText(authKey);
    }

    private String normalizedBaseUrl() {
        return baseUrl == null ? "https://control.msg91.com" : baseUrl.replaceAll("/+$", "");
    }

    private static String normalizedPath(String path) {
        if (!StringUtils.hasText(path)) {
            return "/api/v5/flow";
        }
        String trimmed = path.trim();
        return trimmed.startsWith("/") ? trimmed : "/" + trimmed;
    }

    private static String normalizePhoneForMsg91(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        String digits = raw.replaceAll("\\D", "");
        if (digits.startsWith("91") && digits.length() == 12) {
            return digits.substring(2);
        }
        if (digits.length() == 10) {
            return digits;
        }
        return digits;
    }

    private String countryPrefixMobile(String tenDigitMobile) {
        String countryCode = StringUtils.hasText(country) ? country.trim() : "91";
        String number = tenDigitMobile == null ? "" : tenDigitMobile.trim();
        if (number.startsWith(countryCode)) {
            return number;
        }
        return countryCode + number;
    }

    private static String mapHttpFailureStatus(int code) {
        if (code == 408 || code == 429 || code >= 500) {
            return "TEMP_FAIL";
        }
        return "REJECTED";
    }

    private static String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }
}
