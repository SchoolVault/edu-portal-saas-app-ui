package com.school.erp.modules.notification.sms.impl;

import com.school.erp.modules.notification.sms.BulkSmsRequest;
import com.school.erp.modules.notification.sms.BulkSmsResponse;
import com.school.erp.modules.notification.sms.SmsRequest;
import com.school.erp.modules.notification.sms.SmsResponse;
import com.school.erp.modules.notification.sms.SmsService;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@Primary
public class RoutingSmsService implements SmsService {
    private static final Logger log = LoggerFactory.getLogger(RoutingSmsService.class);
    private static final String ROUTING_PROVIDER = "ROUTING";
    private final ObjectProvider<List<SmsService>> smsServicesProvider;

    @Value("${app.sms.routing.enabled:false}")
    private boolean routingEnabled;
    @Value("${app.sms.routing.priority:MSG91,TWILIO,AWS_SNS,MOCK}")
    private String routingPriority;
    @Value("${app.sms.routing.skip-unhealthy:true}")
    private boolean skipUnhealthy;

    public RoutingSmsService(ObjectProvider<List<SmsService>> smsServicesProvider) {
        this.smsServicesProvider = smsServicesProvider;
    }

    @Override
    public SmsResponse sendSms(SmsRequest request) {
        List<SmsService> providers = orderedProviders();
        if (providers.isEmpty()) {
            return SmsResponse.builder()
                    .success(false)
                    .providerName(ROUTING_PROVIDER)
                    .providerStatus("NO_PROVIDER")
                    .errorMessage("No SMS provider is enabled")
                    .build();
        }
        List<String> tried = new ArrayList<>();
        for (SmsService provider : providers) {
            String name = normalizeName(provider.getProviderName());
            if (skipUnhealthy && !provider.isHealthy()) {
                tried.add(name + "(unhealthy)");
                continue;
            }
            tried.add(name);
            SmsResponse response = provider.sendSms(request);
            if (response != null && response.isSuccess()) {
                return response;
            }
            if (response != null && isPermanentFailure(response.getProviderStatus())) {
                return response;
            }
        }
        return SmsResponse.builder()
                .success(false)
                .providerName(ROUTING_PROVIDER)
                .providerStatus("FAILOVER_EXHAUSTED")
                .errorMessage("All providers exhausted: " + String.join(",", tried))
                .build();
    }

    @Override
    public BulkSmsResponse sendBulkSms(BulkSmsRequest request) {
        SmsResponse[] responses = new SmsResponse[request.getRecipients().length];
        int success = 0;
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
                success++;
            }
        }
        return BulkSmsResponse.builder()
                .totalSent(request.getRecipients().length)
                .successCount(success)
                .failedCount(request.getRecipients().length - success)
                .responses(responses)
                .build();
    }

    @Override
    public String getProviderName() {
        return ROUTING_PROVIDER;
    }

    @Override
    public boolean isHealthy() {
        return !orderedProviders().isEmpty();
    }

    public Map<String, Boolean> providerHealthSnapshot() {
        Map<String, Boolean> out = new LinkedHashMap<>();
        for (SmsService provider : orderedProviders()) {
            out.put(normalizeName(provider.getProviderName()), provider.isHealthy());
        }
        return out;
    }

    private List<SmsService> orderedProviders() {
        List<SmsService> beans = smsServicesProvider.getIfAvailable(ArrayList::new);
        List<SmsService> delegates = beans.stream()
                .filter(s -> !ROUTING_PROVIDER.equalsIgnoreCase(normalizeName(s.getProviderName())))
                .collect(Collectors.toList());
        if (delegates.isEmpty()) {
            return delegates;
        }
        if (!routingEnabled) {
            return List.of(delegates.get(0));
        }
        List<String> priority = Arrays.stream(routingPriority.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .map(this::normalizeName)
                .toList();
        Map<String, SmsService> byName = new LinkedHashMap<>();
        for (SmsService s : delegates) {
            byName.put(normalizeName(s.getProviderName()), s);
        }
        List<SmsService> ordered = new ArrayList<>();
        for (String p : priority) {
            SmsService hit = byName.remove(p);
            if (hit != null) {
                ordered.add(hit);
            }
        }
        ordered.addAll(byName.values());
        log.debug("SMS routing order={}", ordered.stream().map(s -> s.getProviderName()).toList());
        return ordered;
    }

    private boolean isPermanentFailure(String status) {
        if (status == null) {
            return false;
        }
        String normalized = status.trim().toUpperCase(Locale.ROOT);
        return "INVALID_PHONE".equals(normalized)
                || "INVALID_MESSAGE".equals(normalized)
                || "REJECTED".equals(normalized)
                || "CONFIG_ERROR".equals(normalized);
    }

    private String normalizeName(String providerName) {
        return providerName == null ? "" : providerName.trim().toUpperCase(Locale.ROOT);
    }
}
