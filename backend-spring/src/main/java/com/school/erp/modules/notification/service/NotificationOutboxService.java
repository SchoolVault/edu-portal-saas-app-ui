package com.school.erp.modules.notification.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.notification.config.NotificationDeliveryProperties;
import com.school.erp.modules.notification.entity.Notification;
import com.school.erp.modules.notification.entity.NotificationOutbox;
import com.school.erp.modules.notification.repository.NotificationOutboxRepository;
import com.school.erp.modules.notification.repository.NotificationRepository;
import com.school.erp.platform.port.NotificationDispatchPort;
import io.micrometer.core.instrument.MeterRegistry;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Transactional outbox for multi-channel notifications.
 * Includes retry/backoff, dead-lettering, and provider receipt reconciliation.
 */
@Service
public class NotificationOutboxService implements NotificationDispatchPort {
    private static final Logger log = LoggerFactory.getLogger(NotificationOutboxService.class);
    private final NotificationOutboxRepository repo;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationDeliveryProperties deliveryProperties;
    private final ObjectProvider<MeterRegistry> meterRegistryProvider;

    public NotificationOutboxService(
            NotificationOutboxRepository repo,
            UserRepository userRepository,
            NotificationRepository notificationRepository,
            NotificationDeliveryProperties deliveryProperties,
            ObjectProvider<MeterRegistry> meterRegistryProvider) {
        this.repo = repo;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.deliveryProperties = deliveryProperties;
        this.meterRegistryProvider = meterRegistryProvider;
    }

    @Override
    @Transactional
    public void enqueue(
            String tenantId,
            String eventType,
            String channel,
            Long recipientUserId,
            String phoneE164,
            String subject,
            String body,
            String dedupeKey,
            String correlationId) {
        String channelNorm = normalizeChannel(channel);
        String phone = phoneE164;
        if ((phone == null || phone.isBlank()) && recipientUserId != null) {
            phone = userRepository.findByIdAndTenantIdAndIsDeletedFalse(recipientUserId, tenantId)
                    .map(u -> u.getPhone() != null ? u.getPhone().trim() : "")
                    .orElse("");
        }
        boolean inApp = "IN_APP".equals(channelNorm);
        if ((phone == null || phone.isBlank()) && !inApp) {
            log.debug("Skip outbox enqueue (no phone) event={} userId={} channel={}", eventType, recipientUserId, channelNorm);
            return;
        }
        if (inApp && recipientUserId == null) {
            log.debug("Skip IN_APP outbox (no user) event={}", eventType);
            return;
        }
        if (recipientUserId != null) {
            long sentInLastHour = repo.countByTenantIdAndRecipientUserIdAndEventTypeAndCreatedAtAfterAndIsDeletedFalse(
                    tenantId, recipientUserId, eventType, LocalDateTime.now().minusHours(1));
            if (sentInLastHour >= deliveryProperties.getPerUserPerHourLimit()) {
                log.warn("Rate limit hit: tenant={} user={} event={} count={}", tenantId, recipientUserId, eventType, sentInLastHour);
                markMetric("throttled", channelNorm, eventType);
                return;
            }
        }
        int estimatedCostMinor = estimatedCostMinor(channelNorm);
        if (estimatedCostMinor > 0) {
            LocalDateTime dayStart = LocalDate.now().atStartOfDay();
            long usedBudgetMinor = repo.sumChannelCostMinorByTenantSince(tenantId, dayStart);
            if ((usedBudgetMinor + estimatedCostMinor) > deliveryProperties.getTenantDailyBudgetMinor()) {
                log.warn("Cost guardrail hit: tenant={} channel={} used={} estimate={} budget={}",
                        tenantId, channelNorm, usedBudgetMinor, estimatedCostMinor, deliveryProperties.getTenantDailyBudgetMinor());
                markMetric("budget_blocked", channelNorm, eventType);
                return;
            }
        }
        if (dedupeKey != null && !dedupeKey.isBlank() && repo.existsByTenantIdAndDedupeKeyAndIsDeletedFalse(tenantId, dedupeKey)) {
            log.debug("Skip duplicate outbox dedupeKey={}", dedupeKey);
            return;
        }
        NotificationOutbox row = new NotificationOutbox();
        row.setTenantId(tenantId);
        row.setEventType(eventType);
        row.setChannel(channelNorm);
        row.setRecipientUserId(recipientUserId);
        row.setRecipientPhoneE164(phone != null && !phone.isBlank() ? phone.trim() : null);
        row.setSubject(subject);
        row.setBodyText(body);
        row.setDedupeKey(dedupeKey);
        row.setStatus("PENDING");
        row.setProviderStatus("QUEUED");
        row.setCorrelationId(correlationId);
        row.setChannelCostMinor(estimatedCostMinor > 0 ? estimatedCostMinor : null);
        try {
            repo.save(row);
        } catch (DataIntegrityViolationException ex) {
            log.debug("Outbox dedupe race for key={}: {}", dedupeKey, ex.getMessage());
        }
    }

    @Transactional
    public int processPendingBatchMock(int maxRows) {
        LocalDateTime now = LocalDateTime.now();
        List<NotificationOutbox> batch = new ArrayList<>();
        batch.addAll(repo.findTop100ByStatusInAndIsDeletedFalseAndNextRetryAtIsNullOrderByCreatedAtAsc(List.of("PENDING", "RETRY")));
        batch.addAll(repo.findTop100ByStatusInAndIsDeletedFalseAndNextRetryAtLessThanEqualOrderByNextRetryAtAscCreatedAtAsc(
                List.of("PENDING", "RETRY"), now));
        int n = 0;
        for (NotificationOutbox row : batch) {
            if (n >= maxRows) {
                break;
            }
            if ("SENT".equals(row.getStatus()) || "DEAD_LETTER".equals(row.getStatus())) {
                continue;
            }
            n++;
            try {
                deliverMock(row);
                row.setStatus("SENT");
                row.setProviderStatus("SENT");
                row.setProcessedAt(LocalDateTime.now());
                row.setNextRetryAt(null);
                row.setLastError(null);
                row.setAttempts(row.getAttempts() + 1);
                repo.save(row);
                markMetric("sent", row.getChannel(), row.getEventType());
            } catch (Exception ex) {
                int nextAttempt = row.getAttempts() + 1;
                row.setAttempts(nextAttempt);
                row.setProviderStatus("FAILED");
                row.setProviderErrorCode("MOCK_DELIVERY_ERROR");
                row.setLastError(trimError(ex.getMessage()));
                if (nextAttempt >= maxAttemptsForChannel(row.getChannel())) {
                    row.setStatus("DEAD_LETTER");
                    row.setDeadLetteredAt(LocalDateTime.now());
                    row.setNextRetryAt(null);
                    markMetric("dead_letter", row.getChannel(), row.getEventType());
                } else {
                    row.setStatus("RETRY");
                    row.setNextRetryAt(LocalDateTime.now().plusSeconds(backoffSeconds(row.getChannel(), nextAttempt)));
                    markMetric("retry", row.getChannel(), row.getEventType());
                }
                repo.save(row);
                log.warn("Mock delivery failed correlationId={} status={} attempts={} error={}",
                        row.getCorrelationId(), row.getStatus(), row.getAttempts(), row.getLastError());
            }
        }
        return n;
    }

    @Transactional
    public boolean applyProviderReceipt(
            String tenantId,
            String correlationId,
            String providerMessageId,
            String providerStatus,
            String providerErrorCode,
            String providerErrorMessage) {
        if (tenantId == null || tenantId.isBlank() || correlationId == null || correlationId.isBlank()) {
            return false;
        }
        Optional<NotificationOutbox> maybeRow = repo.findByTenantIdAndCorrelationIdAndIsDeletedFalse(tenantId, correlationId);
        if (maybeRow.isEmpty()) {
            return false;
        }
        NotificationOutbox row = maybeRow.get();
        row.setProviderMessageId(trimToLen(providerMessageId, 120));
        row.setProviderStatus(trimToLen(providerStatus, 40));
        row.setProviderErrorCode(trimToLen(providerErrorCode, 80));
        row.setLastError(trimError(providerErrorMessage));

        String mappedStatus = mapProviderStatus(providerStatus, providerErrorCode);
        if ("SENT".equals(mappedStatus)) {
            row.setStatus("SENT");
            row.setProcessedAt(LocalDateTime.now());
            row.setNextRetryAt(null);
            markMetric("provider_sent", row.getChannel(), row.getEventType());
        } else if ("RETRY".equals(mappedStatus)) {
            int nextAttempt = row.getAttempts() + 1;
            row.setAttempts(nextAttempt);
            if (nextAttempt >= maxAttemptsForChannel(row.getChannel())) {
                row.setStatus("DEAD_LETTER");
                row.setDeadLetteredAt(LocalDateTime.now());
                row.setNextRetryAt(null);
                markMetric("provider_dead_letter", row.getChannel(), row.getEventType());
            } else {
                row.setStatus("RETRY");
                row.setNextRetryAt(LocalDateTime.now().plusSeconds(backoffSeconds(row.getChannel(), nextAttempt)));
                markMetric("provider_retry", row.getChannel(), row.getEventType());
            }
        } else {
            row.setStatus("DEAD_LETTER");
            row.setDeadLetteredAt(LocalDateTime.now());
            row.setNextRetryAt(null);
            markMetric("provider_failed", row.getChannel(), row.getEventType());
        }
        repo.save(row);
        return true;
    }

    public boolean isWebhookSecretValid(String providedSecret) {
        String configured = deliveryProperties.getWebhookSecret();
        if (configured == null || configured.isBlank()) {
            return true;
        }
        return configured.equals(providedSecret);
    }

    private void deliverMock(NotificationOutbox row) {
        if ("IN_APP".equals(normalizeChannel(row.getChannel())) && row.getRecipientUserId() != null) {
            Enums.NotificationType type = "FEE_REMINDER".equals(row.getEventType())
                    ? Enums.NotificationType.WARNING
                    : Enums.NotificationType.INFO;
            String link = ("FEE_REMINDER".equals(row.getEventType()) || "FEE_ASSIGNED".equals(row.getEventType()))
                    ? "/app/parent/children"
                    : "/app/inbox";
            Notification inApp = Notification.builder()
                    .title(row.getSubject() != null ? row.getSubject() : "Notice")
                    .message(row.getBodyText())
                    .type(type)
                    .userId(row.getRecipientUserId())
                    .isRead(false)
                    .link(link)
                    .build();
            inApp.setTenantId(row.getTenantId());
            notificationRepository.save(inApp);
        }
        log.info("MOCK outbox delivery channel={} event={} tenant={} userId={} phone={}",
                row.getChannel(), row.getEventType(), row.getTenantId(), row.getRecipientUserId(), row.getRecipientPhoneE164());
    }

    private String normalizeChannel(String channel) {
        return channel == null ? "SMS" : channel.trim().toUpperCase(Locale.ROOT);
    }

    private int maxAttemptsForChannel(String channel) {
        String c = normalizeChannel(channel);
        return switch (c) {
            case "WHATSAPP" -> deliveryProperties.getWhatsappMaxAttempts();
            case "EMAIL" -> deliveryProperties.getEmailMaxAttempts();
            case "IN_APP" -> deliveryProperties.getInAppMaxAttempts();
            default -> deliveryProperties.getSmsMaxAttempts();
        };
    }

    private int estimatedCostMinor(String channel) {
        String c = normalizeChannel(channel);
        return switch (c) {
            case "WHATSAPP" -> deliveryProperties.getWhatsappEstimatedCostMinor();
            case "EMAIL" -> deliveryProperties.getEmailEstimatedCostMinor();
            case "IN_APP" -> 0;
            default -> deliveryProperties.getSmsEstimatedCostMinor();
        };
    }

    private long backoffSeconds(String channel, int attempt) {
        long base = switch (normalizeChannel(channel)) {
            case "WHATSAPP" -> 20L;
            case "EMAIL" -> 15L;
            case "IN_APP" -> 5L;
            default -> 30L;
        };
        long multiplier = 1L << Math.max(0, Math.min(attempt - 1, 6));
        return Math.min(base * multiplier, 3600L);
    }

    private String mapProviderStatus(String providerStatus, String providerErrorCode) {
        String s = providerStatus == null ? "" : providerStatus.trim().toUpperCase(Locale.ROOT);
        String code = providerErrorCode == null ? "" : providerErrorCode.trim().toUpperCase(Locale.ROOT);
        if ("SENT".equals(s) || "DELIVERED".equals(s)) {
            return "SENT";
        }
        if ("RETRY".equals(s) || "QUEUED".equals(s) || "THROTTLED".equals(s) || "TEMP_FAIL".equals(code)) {
            return "RETRY";
        }
        return "FAILED";
    }

    private String trimError(String message) {
        return trimToLen(message, 500);
    }

    private String trimToLen(String value, int maxLen) {
        if (value == null) {
            return null;
        }
        return value.length() <= maxLen ? value : value.substring(0, maxLen);
    }

    private void markMetric(String outcome, String channel, String eventType) {
        MeterRegistry registry = meterRegistryProvider.getIfAvailable();
        if (registry == null) {
            return;
        }
        registry.counter(
                "notification.delivery.total",
                "outcome", outcome,
                "channel", normalizeChannel(channel),
                "eventType", eventType == null ? "UNKNOWN" : eventType)
                .increment();
    }
}
