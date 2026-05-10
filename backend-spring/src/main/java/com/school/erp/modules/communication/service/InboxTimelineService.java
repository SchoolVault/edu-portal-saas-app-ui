package com.school.erp.modules.communication.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.modules.communication.dto.InboxTimelineDTOs;
import com.school.erp.modules.communication.entity.Announcement;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
import com.school.erp.modules.academic.repository.SectionRepository;
import com.school.erp.modules.communication.policy.InboxAudienceTokenPolicy;
import com.school.erp.modules.notification.entity.Notification;
import com.school.erp.modules.notification.service.NotificationService;
import com.school.erp.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Merges tenant-scoped announcements with the current user's notifications for a single inbox timeline.
 * Supports text search, feed kind, audience (announcement scope tokens only),
 * and calendar month ({@code yearMonth} as {@code yyyy-MM}). Request {@code audiences} are sanitized per
 * {@link com.school.erp.modules.communication.policy.InboxAudienceTokenPolicy} after {@link CommunicationService} visibility.
 */
@Service
public class InboxTimelineService {
    private final CommunicationService communicationService;
    private final NotificationService notificationService;
    private final SchoolClassRepository schoolClassRepository;
    private final SectionRepository sectionRepository;

    public InboxTimelineService(
            final CommunicationService communicationService,
            final NotificationService notificationService,
            final SchoolClassRepository schoolClassRepository,
            final SectionRepository sectionRepository) {
        this.communicationService = communicationService;
        this.notificationService = notificationService;
        this.schoolClassRepository = schoolClassRepository;
        this.sectionRepository = sectionRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<InboxTimelineDTOs.InboxItemResponse> getTimeline(
            final int page,
            final int size,
            final String q,
            final String feedKind,
            final String audiencesCsv,
            final String yearMonth) {
        String qq = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
        Set<String> audienceTokens =
                InboxAudienceTokenPolicy.sanitize(TenantContext.getUserRole(), parseAudienceCsv(audiencesCsv));
        YearMonth ym = parseYearMonth(yearMonth);
        String fk = feedKind == null ? "" : feedKind.trim().toUpperCase(Locale.ROOT);

        List<InboxTimelineDTOs.InboxItemResponse> rows = new ArrayList<>();
        if (!InboxTimelineDTOs.KIND_NOTIFICATION.equals(fk)) {
            for (Announcement a : communicationService.getAnnouncements()) {
                InboxTimelineDTOs.InboxItemResponse row = mapAnnouncement(a);
                if (matches(row, qq) && passesAudienceFilter(row, audienceTokens) && passesYearMonth(row, ym)) {
                    rows.add(row);
                }
            }
        }
        if (!InboxTimelineDTOs.KIND_ANNOUNCEMENT.equals(fk)) {
            for (Notification n : notificationService.getUserNotifications()) {
                if (isAnnouncementMirrorNotification(n)) {
                    continue;
                }
                InboxTimelineDTOs.InboxItemResponse row = mapNotification(n);
                if (matches(row, qq) && passesAudienceFilter(row, audienceTokens) && passesYearMonth(row, ym)) {
                    rows.add(row);
                }
            }
        }
        rows.sort(Comparator.comparing(
                (InboxTimelineDTOs.InboxItemResponse r) ->
                        Optional.ofNullable(parseCreatedAtStatic(r.getCreatedAt())).orElse(LocalDateTime.MIN))
                .reversed());
        long total = rows.size();
        int from = Math.max(0, page) * Math.max(1, size);
        if (from >= rows.size()) {
            return PageResponse.of(List.of(), page, size, total);
        }
        int to = Math.min(from + Math.max(1, size), rows.size());
        return PageResponse.of(rows.subList(from, to), page, size, total);
    }

    private static Set<String> parseAudienceCsv(final String audiencesCsv) {
        if (audiencesCsv == null || audiencesCsv.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(audiencesCsv.split(","))
                .map(s -> s.trim().toUpperCase(Locale.ROOT))
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private static YearMonth parseYearMonth(final String yearMonth) {
        if (yearMonth == null || yearMonth.isBlank()) {
            return null;
        }
        try {
            return YearMonth.parse(yearMonth.trim());
        } catch (Exception e) {
            return null;
        }
    }

    /** Empty {@code audienceTokens}: no audience-based filter. When set, only announcement scope rows are matched. */
    private static boolean passesAudienceFilter(
            final InboxTimelineDTOs.InboxItemResponse row,
            final Set<String> audienceTokens) {
        if (audienceTokens.isEmpty()) {
            return true;
        }
        if (InboxTimelineDTOs.KIND_NOTIFICATION.equals(row.getKind())) {
            return false;
        }
        Set<String> annTok = new LinkedHashSet<>(audienceTokens);
        if (annTok.isEmpty()) {
            return false;
        }
        String key = row.getAudienceKey() != null ? row.getAudienceKey().toUpperCase(Locale.ROOT) : "";
        if (annTok.contains(key)) {
            return true;
        }
        return ("CLASS".equals(key) && annTok.contains("CLASS")) || ("SECTION".equals(key) && annTok.contains("SECTION"));
    }

    private static boolean passesYearMonth(final InboxTimelineDTOs.InboxItemResponse row, final YearMonth ym) {
        if (ym == null) {
            return true;
        }
        LocalDateTime t = parseCreatedAtStatic(row.getCreatedAt());
        if (t == null) {
            return false;
        }
        return YearMonth.from(t).equals(ym);
    }

    private static LocalDateTime parseCreatedAtStatic(final String createdAt) {
        try {
            if (createdAt != null && !createdAt.isEmpty()) {
                return LocalDateTime.parse(createdAt);
            }
        } catch (Exception ignored) {
            /* fall through */
        }
        return null;
    }

    private static boolean matches(final InboxTimelineDTOs.InboxItemResponse row, final String qq) {
        if (qq.isEmpty()) {
            return true;
        }
        return contains(row.getTitle(), qq)
                || contains(row.getPreview(), qq)
                || contains(row.getAuthorLine(), qq);
    }

    private static boolean contains(final String s, final String qq) {
        return s != null && s.toLowerCase(Locale.ROOT).contains(qq);
    }

    private InboxTimelineDTOs.InboxItemResponse mapAnnouncement(final Announcement a) {
        InboxTimelineDTOs.InboxItemResponse r = new InboxTimelineDTOs.InboxItemResponse();
        r.setKind(InboxTimelineDTOs.KIND_ANNOUNCEMENT);
        r.setId(String.valueOf(a.getId()));
        r.setTitle(a.getTitle() != null ? a.getTitle() : "");
        r.setPreview(previewText(a.getContent()));
        r.setCreatedAt(a.getCreatedAt() != null ? a.getCreatedAt().toString() : null);
        if (a.getTargetAudience() != null) {
            r.setAudienceKey(a.getTargetAudience().name());
        }
        r.setTargetClassId(a.getTargetClassId());
        r.setTargetSectionId(a.getTargetSectionId());
        if (a.getTargetClassId() != null) {
            schoolClassRepository
                    .findByIdAndTenantIdAndIsDeletedFalse(a.getTargetClassId(), a.getTenantId())
                    .ifPresent(c -> r.setTargetClassName(c.getName()));
        }
        if (a.getTargetSectionId() != null) {
            sectionRepository
                    .findByIdAndTenantIdAndIsDeletedFalse(a.getTargetSectionId(), a.getTenantId())
                    .ifPresent(s -> r.setTargetSectionName(s.getName()));
        }
        String author = a.getAuthor() != null ? a.getAuthor() : "";
        String role = a.getAuthorRole() != null ? a.getAuthorRole() : "";
        if (!role.isEmpty()) {
            r.setAuthorLine(author + " (" + role + ")");
        } else {
            r.setAuthorLine(author);
        }
        r.setRead(Boolean.TRUE);
        return r;
    }

    private static InboxTimelineDTOs.InboxItemResponse mapNotification(final Notification n) {
        InboxTimelineDTOs.InboxItemResponse r = new InboxTimelineDTOs.InboxItemResponse();
        r.setKind(InboxTimelineDTOs.KIND_NOTIFICATION);
        r.setId(String.valueOf(n.getId()));
        r.setTitle(n.getTitle() != null ? n.getTitle() : "");
        r.setPreview(n.getMessage() != null ? previewText(n.getMessage()) : "");
        r.setCreatedAt(n.getCreatedAt() != null ? n.getCreatedAt().toString() : null);
        r.setAudienceKey(null);
        r.setAuthorLine(null);
        if (n.getType() != null) {
            r.setNotificationType(n.getType().name());
        }
        r.setRead(Boolean.TRUE.equals(n.getIsRead()));
        return r;
    }

    private static boolean isAnnouncementMirrorNotification(final Notification n) {
        String link = n.getLink();
        if (link == null) {
            return false;
        }
        String t = link.trim().toLowerCase(Locale.ROOT);
        return t.startsWith("/app/announcement/");
    }

    private static String previewText(final String content) {
        if (content == null) {
            return "";
        }
        String t = content.replaceAll("\\s+", " ").trim();
        if (t.length() <= 220) {
            return t;
        }
        return t.substring(0, 217) + "…";
    }
}
