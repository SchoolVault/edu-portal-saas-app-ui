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
 * Optional tenant/partner webhook delivery. Empty {@code app.integration.webhook.url} = no network I/O.
 * Resilience4j instance {@code partnerWebhook} limits blast radius when a subscriber endpoint is unhealthy.
 */
@Component
public class OutboundWebhookHttpClient {

    private static final Logger log = LoggerFactory.getLogger(OutboundWebhookHttpClient.class);

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.integration.webhook.url:}")
    private String webhookUrl;

    @CircuitBreaker(name = "partnerWebhook")
    @Retry(name = "partnerWebhook")
    public void postEventPayload(String eventType, String tenantId, Map<String, Object> attributes) {
        if (!StringUtils.hasText(webhookUrl)) {
            return;
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("eventType", eventType);
        body.put("tenantId", tenantId);
        body.put("attributes", attributes);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        try {
            restTemplate.postForEntity(webhookUrl.trim(), new HttpEntity<>(body, headers), Void.class);
        } catch (RestClientException ex) {
            log.warn("partner_webhook delivery failed eventType={} tenant={}: {}", eventType, tenantId, ex.getMessage());
            throw ex;
        }
    }
}
