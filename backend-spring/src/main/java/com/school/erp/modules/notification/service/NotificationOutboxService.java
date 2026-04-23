package com.school.erp.modules.notification.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.util.InternationalPhone;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.notification.config.NotificationDeliveryProperties;
import com.school.erp.modules.notification.dto.NotificationOpsDTOs;
import com.school.erp.modules.notification.entity.Notification;
import com.school.erp.modules.notification.entity.NotificationOutbox;
import com.school.erp.modules.notification.repository.NotificationOutboxRepository;
import com.school.erp.modules.notification.repository.NotificationRepository;
import com.school.erp.modules.notification.sms.SmsRequest;
import com.school.erp.modules.notification.sms.SmsResponse;
import com.school.erp.modules.notification.sms.SmsService;
import com.school.erp.platform.port.NotificationDispatchPort;
import io.micrometer.core.instrument.MeterRegistry;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.tenant.TenantContext;

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
    private final SmsService smsService;
    private final NotificationDeliveryProperties deliveryProperties;
    private final ObjectProvider<MeterRegistry> meterRegistryProvider;

    public NotificationOutboxService(
            NotificationOutboxRepository repo,
            UserRepository userRepository,
            NotificationRepository notificationRepository,
            SmsService smsService,
            NotificationDeliveryProperties deliveryProperties,
            ObjectProvider<MeterRegistry> meterRegistryProvider) {
        this.repo = repo;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.smsService = smsService;
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

    @Override
    @Transactional
    public void enqueueScheduled(
            String tenantId,
            String eventType,
            String channel,
            Long recipientUserId,
            String phoneE164,
            String subject,
            String body,
            String dedupeKey,
            String correlationId,
            LocalDateTime scheduledAt) {
        enqueue(tenantId, eventType, channel, recipientUserId, phoneE164, subject, body, dedupeKey, correlationId);
        if (scheduledAt == null || !scheduledAt.isAfter(LocalDateTime.now())) {
            return;
        }
        repo.findByTenantIdAndCorrelationIdAndIsDeletedFalse(tenantId, correlationId).ifPresent(row -> {
            row.setStatus("RETRY");
            row.setNextRetryAt(scheduledAt);
            row.setProviderStatus("SCHEDULED");
            repo.save(row);
        });
    }

    @Transactional
    public int processPendingBatch(int maxRows) {
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
            int claimed = repo.claimForProcessing(row.getId(), "PROCESSING", List.of("PENDING", "RETRY"), now);
            if (claimed == 0) {
                continue;
            }
            n++;
            try {
                deliver(row);
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
                if (row.getProviderStatus() == null || row.getProviderStatus().isBlank()) {
                    row.setProviderStatus("FAILED");
                }
                if (row.getProviderErrorCode() == null || row.getProviderErrorCode().isBlank()) {
                    row.setProviderErrorCode("DELIVERY_ERROR");
                }
                row.setLastError(trimError(ex.getMessage()));
                if (isPermanentProviderFailure(row.getProviderStatus()) || nextAttempt >= maxAttemptsForChannel(row.getChannel())) {
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
                log.warn("Outbox delivery failed correlationId={} status={} attempts={} error={}",
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

    @Transactional
    public boolean applyProviderReceiptByProviderMessageId(
            String tenantId,
            String providerMessageId,
            String providerStatus,
            String providerErrorCode,
            String providerErrorMessage) {
        if (tenantId == null || tenantId.isBlank() || providerMessageId == null || providerMessageId.isBlank()) {
            return false;
        }
        Optional<NotificationOutbox> maybeRow = repo.findByTenantIdAndProviderMessageIdAndIsDeletedFalse(
                tenantId, providerMessageId.trim());
        if (maybeRow.isEmpty()) {
            return false;
        }
        NotificationOutbox row = maybeRow.get();
        return applyProviderReceipt(
                tenantId,
                row.getCorrelationId(),
                providerMessageId,
                providerStatus,
                providerErrorCode,
                providerErrorMessage);
    }

    public boolean isWebhookSecretValid(String providedSecret) {
        String configured = deliveryProperties.getWebhookSecret();
        if (configured == null || configured.isBlank()) {
            return true;
        }
        return configured.equals(providedSecret);
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationOpsDTOs.DeadLetterItem> deadLetterPage(int page, int size) {
        String tenantId = TenantContext.getTenantId();
        Page<NotificationOutbox> rows = repo.findByTenantIdAndStatusAndIsDeletedFalseOrderByDeadLetteredAtDesc(
                tenantId,
                "DEAD_LETTER",
                PageRequest.of(Math.max(page, 0), Math.max(1, Math.min(size, 100))));
        return PageResponse.fromSpringPage(rows.map(this::toDeadLetterItem));
    }

    @Transactional
    public NotificationOpsDTOs.ReplayResult replayDeadLetter(Long outboxId) {
        String tenantId = TenantContext.getTenantId();
        NotificationOpsDTOs.ReplayResult out = new NotificationOpsDTOs.ReplayResult();
        Optional<NotificationOutbox> maybe = repo.findByIdAndTenantIdAndIsDeletedFalse(outboxId, tenantId);
        if (maybe.isEmpty()) {
            out.setSkipped(1);
            return out;
        }
        NotificationOutbox row = maybe.get();
        if (!"DEAD_LETTER".equals(row.getStatus())) {
            out.setSkipped(1);
            return out;
        }
        row.setStatus("RETRY");
        row.setNextRetryAt(LocalDateTime.now());
        row.setLastError(null);
        row.setProviderStatus("REPLAY_QUEUED");
        row.setProviderErrorCode(null);
        repo.save(row);
        out.setReplayed(1);
        out.setSkipped(0);
        return out;
    }

    @Transactional
    public NotificationOpsDTOs.ReplayResult replayCampaignDeadLetters(String campaignId, int limit) {
        String tenantId = TenantContext.getTenantId();
        List<NotificationOutbox> rows = repo.findRecentByCampaign(
                tenantId,
                campaignId,
                PageRequest.of(0, Math.max(1, Math.min(limit, 500))));
        int replayed = 0;
        int skipped = 0;
        for (NotificationOutbox row : rows) {
            if (!"DEAD_LETTER".equals(row.getStatus())) {
                skipped++;
                continue;
            }
            row.setStatus("RETRY");
            row.setNextRetryAt(LocalDateTime.now());
            row.setLastError(null);
            row.setProviderStatus("REPLAY_QUEUED");
            row.setProviderErrorCode(null);
            replayed++;
        }
        repo.saveAll(rows);
        NotificationOpsDTOs.ReplayResult out = new NotificationOpsDTOs.ReplayResult();
        out.setReplayed(replayed);
        out.setSkipped(skipped);
        return out;
    }

    private void deliver(NotificationOutbox row) {
        String channel = normalizeChannel(row.getChannel());
        if ("IN_APP".equals(channel) && row.getRecipientUserId() != null) {
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
            return;
        }
        if ("SMS".equals(channel) || "WHATSAPP".equals(channel)) {
            String canonical = InternationalPhone.canonical(row.getRecipientPhoneE164());
            if (canonical == null) {
                row.setProviderStatus("FAILED");
                row.setProviderErrorCode("INVALID_PHONE");
                throw new IllegalArgumentException("Recipient phone is not valid canonical E.164 format");
            }
            SmsRequest smsRequest = SmsRequest.builder()
                    .to(InternationalPhone.toSmsAddress(canonical))
                    .message(row.getBodyText())
                    .tenantId(row.getTenantId())
                    .correlationId(row.getCorrelationId())
                    .build();
            SmsResponse smsResponse = smsService.sendSms(smsRequest);
            row.setProviderMessageId(trimToLen(smsResponse.getMessageId(), 120));
            row.setProviderStatus(trimToLen(smsResponse.getProviderStatus(), 40));
            if (!smsResponse.isSuccess()) {
                row.setProviderErrorCode(trimToLen(
                        smsResponse.getProviderStatus() != null ? smsResponse.getProviderStatus() : "SMS_PROVIDER_ERROR",
                        80));
                throw new IllegalStateException(smsResponse.getErrorMessage() != null
                        ? smsResponse.getErrorMessage()
                        : "SMS provider delivery failed");
            }
            return;
        }
        throw new IllegalStateException("Unsupported notification channel for outbox delivery: " + channel);
    }

    private String normalizeChannel(String channel) {
        return channel == null ? "SMS" : channel.trim().toUpperCase(Locale.ROOT);
    }

    private NotificationOpsDTOs.DeadLetterItem toDeadLetterItem(NotificationOutbox row) {
        NotificationOpsDTOs.DeadLetterItem out = new NotificationOpsDTOs.DeadLetterItem();
        out.setId(row.getId());
        out.setEventType(row.getEventType());
        out.setChannel(normalizeChannel(row.getChannel()));
        out.setCorrelationId(row.getCorrelationId());
        out.setLastError(row.getLastError());
        out.setAttempts(row.getAttempts());
        out.setDeadLetteredAt(row.getDeadLetteredAt() != null ? row.getDeadLetteredAt().toString() : null);
        return out;
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

    private boolean isPermanentProviderFailure(String providerStatus) {
        if (providerStatus == null) {
            return false;
        }
        String normalized = providerStatus.trim().toUpperCase(Locale.ROOT);
        return "INVALID_PHONE".equals(normalized)
                || "REJECTED".equals(normalized)
                || "INVALID_MESSAGE".equals(normalized)
                || "CONFIG_ERROR".equals(normalized);
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
