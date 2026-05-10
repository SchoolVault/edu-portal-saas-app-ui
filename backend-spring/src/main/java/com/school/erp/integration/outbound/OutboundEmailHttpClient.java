package com.school.erp.integration.outbound;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Optional HTTP trigger to an email/SMS worker (SendGrid, SES, internal queue bridge). Empty URL = no-op.
 */
@Component
public class OutboundEmailHttpClient {

    private static final Logger log = LoggerFactory.getLogger(OutboundEmailHttpClient.class);

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.integration.email.trigger-url:}")
    private String triggerUrl;

    /** True when {@link #postTriggerPayload} will perform an HTTP POST (worker / SendGrid bridge). */
    public boolean isTriggerConfigured() {
        return StringUtils.hasText(triggerUrl);
    }

    @CircuitBreaker(name = "emailProvider")
    @Retry(name = "emailProvider")
    public void postTriggerPayload(String eventType, String tenantId, Map<String, Object> attributes) {
        if (!StringUtils.hasText(triggerUrl)) {
            return;
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("eventType", eventType);
        body.put("tenantId", tenantId);
        body.put("attributes", attributes);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        try {
            restTemplate.postForEntity(triggerUrl.trim(), new HttpEntity<>(body, headers), Void.class);
        } catch (RestClientException ex) {
            log.warn("email_trigger delivery failed eventType={} tenant={}: {}", eventType, tenantId, ex.getMessage());
            throw ex;
        }
    }
}
