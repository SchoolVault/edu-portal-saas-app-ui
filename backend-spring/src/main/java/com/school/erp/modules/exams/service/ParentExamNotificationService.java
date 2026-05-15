package com.school.erp.modules.exams.service;

import com.school.erp.modules.exams.dto.ParentExamNotificationDTOs;
import com.school.erp.modules.exams.entity.ParentExamNotificationPreference;
import com.school.erp.modules.exams.entity.ParentExamNotificationState;
import com.school.erp.modules.exams.repository.ParentExamNotificationPreferenceRepository;
import com.school.erp.modules.exams.repository.ParentExamNotificationStateRepository;
import com.school.erp.tenant.TenantContext;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ParentExamNotificationService {
    private final ParentExamNotificationStateRepository stateRepository;
    private final ParentExamNotificationPreferenceRepository preferenceRepository;

    public ParentExamNotificationService(
            ParentExamNotificationStateRepository stateRepository,
            ParentExamNotificationPreferenceRepository preferenceRepository) {
        this.stateRepository = stateRepository;
        this.preferenceRepository = preferenceRepository;
    }

    @Transactional
    public void markNotified(String tenantId, Long userId, Long examId, String eventType) {
        if (tenantId == null || tenantId.isBlank() || userId == null || examId == null || eventType == null || eventType.isBlank()) {
            return;
        }
        String normalizedEvent = eventType.trim().toUpperCase(Locale.ROOT);
        ParentExamNotificationState row = stateRepository
                .findByTenantIdAndUserIdAndExamIdAndEventTypeAndIsDeletedFalse(tenantId, userId, examId, normalizedEvent)
                .orElseGet(ParentExamNotificationState::new);
        row.setTenantId(tenantId);
        row.setUserId(userId);
        row.setExamId(examId);
        row.setEventType(normalizedEvent);
        row.setLastNotifiedAt(LocalDateTime.now());
        stateRepository.save(row);
    }

    @Transactional(readOnly = true)
    public long unreadCountForCurrentParent() {
        return stateRepository.countByTenantIdAndUserIdAndIsDeletedFalseAndLastReadAtIsNull(
                TenantContext.getTenantId(), TenantContext.getUserId());
    }

    @Transactional
    public void acknowledgeForCurrentParent(Long examId, List<String> eventTypes) {
        String tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();
        List<ParentExamNotificationState> rows =
                stateRepository.findByTenantIdAndUserIdAndIsDeletedFalseOrderByUpdatedAtDesc(tenantId, userId);
        Set<String> eventTypeFilter = eventTypes == null
                ? Set.of()
                : eventTypes.stream()
                .filter(x -> x != null && !x.isBlank())
                .map(x -> x.trim().toUpperCase(Locale.ROOT))
                .collect(Collectors.toSet());
        LocalDateTime now = LocalDateTime.now();
        for (ParentExamNotificationState row : rows) {
            if (examId != null && !examId.equals(row.getExamId())) {
                continue;
            }
            if (!eventTypeFilter.isEmpty() && !eventTypeFilter.contains(row.getEventType())) {
                continue;
            }
            row.setLastReadAt(now);
        }
        stateRepository.saveAll(rows);
    }

    @Transactional(readOnly = true)
    public ParentExamNotificationDTOs.NotificationPreferenceResponse getPreferenceForCurrentParent() {
        String tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();
        ParentExamNotificationPreference pref = preferenceRepository
                .findByTenantIdAndUserIdAndIsDeletedFalse(tenantId, userId)
                .orElseGet(() -> defaultPreference(tenantId, userId));
        return toPreferenceResponse(pref);
    }

    @Transactional
    public ParentExamNotificationDTOs.NotificationPreferenceResponse upsertPreferenceForCurrentParent(
            ParentExamNotificationDTOs.UpdateNotificationPreferenceRequest req) {
        String tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();
        ParentExamNotificationPreference pref = preferenceRepository
                .findByTenantIdAndUserIdAndIsDeletedFalse(tenantId, userId)
                .orElseGet(() -> defaultPreference(tenantId, userId));
        if (req.getInAppEnabled() != null) pref.setInAppEnabled(req.getInAppEnabled());
        if (req.getSmsEnabled() != null) pref.setSmsEnabled(req.getSmsEnabled());
        if (req.getEmailEnabled() != null) pref.setEmailEnabled(req.getEmailEnabled());
        if (req.getDigestEnabled() != null) pref.setDigestEnabled(req.getDigestEnabled());
        if (req.getQuietHoursStart() != null) pref.setQuietHoursStart(req.getQuietHoursStart().trim());
        if (req.getQuietHoursEnd() != null) pref.setQuietHoursEnd(req.getQuietHoursEnd().trim());
        preferenceRepository.save(pref);
        return toPreferenceResponse(pref);
    }

    @Transactional(readOnly = true)
    public List<String> filterChannelsByPreference(String tenantId, Long userId, List<String> channels) {
        if (channels == null || channels.isEmpty()) {
            return List.of();
        }
        ParentExamNotificationPreference pref = preferenceRepository
                .findByTenantIdAndUserIdAndIsDeletedFalse(tenantId, userId)
                .orElse(null);
        if (pref == null) {
            return channels;
        }
        return channels.stream().filter(ch -> {
            String c = ch == null ? "" : ch.trim().toUpperCase(Locale.ROOT);
            return switch (c) {
                case "SMS" -> Boolean.TRUE.equals(pref.getSmsEnabled());
                case "EMAIL" -> Boolean.TRUE.equals(pref.getEmailEnabled());
                case "IN_APP" -> Boolean.TRUE.equals(pref.getInAppEnabled());
                default -> true;
            };
        }).collect(Collectors.toList());
    }

    private ParentExamNotificationPreference defaultPreference(String tenantId, Long userId) {
        ParentExamNotificationPreference pref = new ParentExamNotificationPreference();
        pref.setTenantId(tenantId);
        pref.setUserId(userId);
        return preferenceRepository.save(pref);
    }

    private ParentExamNotificationDTOs.NotificationPreferenceResponse toPreferenceResponse(ParentExamNotificationPreference pref) {
        ParentExamNotificationDTOs.NotificationPreferenceResponse out = new ParentExamNotificationDTOs.NotificationPreferenceResponse();
        out.setInAppEnabled(Boolean.TRUE.equals(pref.getInAppEnabled()));
        out.setSmsEnabled(Boolean.TRUE.equals(pref.getSmsEnabled()));
        out.setEmailEnabled(Boolean.TRUE.equals(pref.getEmailEnabled()));
        out.setDigestEnabled(Boolean.TRUE.equals(pref.getDigestEnabled()));
        out.setQuietHoursStart(pref.getQuietHoursStart());
        out.setQuietHoursEnd(pref.getQuietHoursEnd());
        return out;
    }
}
