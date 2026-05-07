package com.school.erp.modules.communication.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.exception.UnauthorizedException;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
import com.school.erp.modules.academic.repository.SectionRepository;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.chat.service.ChatDirectoryService;
import com.school.erp.modules.communication.dto.CommunicationDTOs;
import com.school.erp.modules.communication.dto.AnnouncementDTOs;
import com.school.erp.modules.communication.dto.CommunicationEventDTOs;
import com.school.erp.modules.communication.domain.CommunicationEventStatus;
import com.school.erp.modules.communication.entity.*;
import com.school.erp.modules.communication.repository.*;
import com.school.erp.modules.guardian.service.GuardianService;
import com.school.erp.modules.notification.service.AnnouncementNotificationFanoutService;
import com.school.erp.modules.student.service.TeacherRosterScopeService;
import com.school.erp.config.CacheConfig;
import com.school.erp.tenant.TenantContext;
import com.school.erp.tenant.TenantQueryPolicy;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Service
public class CommunicationService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(CommunicationService.class);
    private final AnnouncementRepository annRepo;
    private final MessageRepository msgRepo;
    private final GuardianService guardianService;
    private final AnnouncementNotificationFanoutService announcementFanout;
    private final UserRepository userRepository;
    private final ChatDirectoryService chatDirectoryService;
    private final TeacherRosterScopeService teacherRosterScopeService;
    private final SchoolClassRepository schoolClassRepository;
    private final SectionRepository sectionRepository;
    private final CommunicationEventRepository eventRepo;

    private record AudienceLists(List<Long> classIds, List<Long> sectionIds) {}

    @Transactional(readOnly = true)
    public List<Announcement> getAnnouncements() {
        String role = normalizedRole();
        if (seesFullSchoolAnnouncementBoard(role)) {
            return annRepo.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(TenantContext.getTenantId());
        }
        return getAnnouncementsForMe();
    }

    @Transactional(readOnly = true)
    public PageResponse<Announcement> getAnnouncementsPaged(int page, int size, String q) {
        String role = normalizedRole();
        String tenantId = TenantContext.getTenantId();
        String qq = q == null ? "" : q.trim();
        /* Custom @Query already orders by createdAt; avoid duplicate ORDER BY with Pageable Sort (driver-specific issues). */
        Pageable p = PageRequest.of(page, size);
        if (seesFullSchoolAnnouncementBoard(role)) {
            Page<Announcement> pg = annRepo.pageTenantSearch(tenantId, qq, p);
            return PageResponse.fromSpringPage(pg);
        }
        AudienceLists lists = resolveAnnouncementAudienceLists();
        Page<Announcement> pg = annRepo.findForAudiencePaged(tenantId, role, lists.classIds(), lists.sectionIds(), qq, p);
        return PageResponse.fromSpringPage(pg);
    }

    @Cacheable(cacheNames = CacheConfig.ANNOUNCEMENT_PREVIEWS, keyGenerator = "tenantUserRoleKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public List<AnnouncementDTOs.AnnouncementPreviewResponse> getAnnouncementPreviews() {
        return getAnnouncements().stream().map(a -> {
            AnnouncementDTOs.AnnouncementPreviewResponse p = new AnnouncementDTOs.AnnouncementPreviewResponse();
            p.setId(a.getId());
            p.setTitle(a.getTitle());
            p.setPreview(previewText(a.getContent()));
            p.setCreatedAt(a.getCreatedAt() != null ? a.getCreatedAt().toString() : null);
            if (a.getTargetAudience() != null) {
                p.setTargetAudience(a.getTargetAudience().name());
            }
            p.setTargetClassId(a.getTargetClassId());
            p.setTargetSectionId(a.getTargetSectionId());
            if (a.getTargetClassId() != null) {
                schoolClassRepository.findByIdAndTenantIdAndIsDeletedFalse(a.getTargetClassId(), a.getTenantId())
                        .ifPresent(c -> p.setTargetClassName(c.getName()));
            }
            if (a.getTargetSectionId() != null) {
                sectionRepository.findByIdAndTenantIdAndIsDeletedFalse(a.getTargetSectionId(), a.getTenantId())
                        .ifPresent(s -> p.setTargetSectionName(s.getName()));
            }
            return p;
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Announcement getAnnouncement(Long id) {
        Announcement a = annRepo.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Announcement", id));
        assertCurrentUserMayViewAnnouncement(a);
        return a;
    }

    @Transactional(readOnly = true)
    public List<Announcement> getAnnouncementsForMe() {
        String tenantId = TenantContext.getTenantId();
        String role = normalizedRole();
        AudienceLists lists = resolveAnnouncementAudienceLists();
        return annRepo.findForAudience(tenantId, role, lists.classIds(), lists.sectionIds());
    }

    private AudienceLists resolveAnnouncementAudienceLists() {
        String tenantId = TenantContext.getTenantId();
        String role = normalizedRole();
        List<Long> classIds = new ArrayList<>();
        List<Long> sectionIds = new ArrayList<>();

        if ("PARENT".equals(role)) {
            Long parentId = TenantContext.getUserId();
            for (var s : guardianService.findStudentsForParentUser(tenantId, parentId)) {
                if (s.getClassId() != null) {
                    classIds.add(s.getClassId());
                }
                if (s.getSectionId() != null) {
                    sectionIds.add(s.getSectionId());
                }
            }
        } else if ("TEACHER".equals(role)) {
            teacherRosterScopeService.homeroomAnnouncementScopeForCurrentUser().ifPresent(scope -> {
                classIds.addAll(scope.classIds());
                sectionIds.addAll(scope.sectionIds());
            });
        }

        if ("STUDENT".equals(role)) {
            // Conservative until student-user mapping exists
        }

        if (classIds.isEmpty()) {
            classIds.add(-1L);
        }
        if (sectionIds.isEmpty()) {
            sectionIds.add(-1L);
        }
        return new AudienceLists(classIds, sectionIds);
    }

    private void assertCurrentUserMayViewAnnouncement(Announcement a) {
        String role = normalizedRole();
        if (seesFullSchoolAnnouncementBoard(role)) {
            return;
        }
        List<Announcement> allowed = getAnnouncementsForMe();
        boolean ok = allowed.stream().anyMatch(x -> x.getId().equals(a.getId()));
        if (!ok) {
            throw new ResourceNotFoundException("Announcement", a.getId());
        }
    }

    @CacheEvict(cacheNames = CacheConfig.ANNOUNCEMENT_PREVIEWS, allEntries = true)
    @Transactional
    public Announcement createAnnouncement(AnnouncementDTOs.CreateAnnouncementRequest req) {
        validateAnnouncementRequest(req);
        Announcement ann = new Announcement();
        ann.setTenantId(TenantContext.getTenantId());
        ann.setTitle(req.getTitle().trim());
        ann.setContent(req.getContent() != null ? req.getContent().trim() : null);
        ann.setAuthor(null);
        ann.setAuthorRole(TenantContext.getUserRole());
        ann.setTargetAudience(req.getTargetAudience());
        ann.setTargetClassId(req.getTargetClassId());
        ann.setTargetSectionId(req.getTargetSectionId());
        Announcement saved = annRepo.save(ann);
        try {
            announcementFanout.onAnnouncementCreated(saved);
        } catch (Exception e) {
            log.warn("Announcement fan-out failed id={}: {}", saved.getId(), e.getMessage());
        }
        return saved;
    }

    @Transactional
    public CommunicationEventDTOs.EventResponse createEvent(CommunicationEventDTOs.CreateEventRequest req) {
        validateEventRequest(req);
        CommunicationEvent event = new CommunicationEvent();
        event.setTenantId(TenantContext.getTenantId());
        event.setTitle(req.getTitle().trim());
        event.setDescription(req.getDescription() != null ? req.getDescription().trim() : null);
        event.setEventType(req.getEventType());
        event.setAudienceScope(req.getAudienceScope());
        event.setTargetClassId(req.getTargetClassId());
        event.setTargetSectionId(req.getTargetSectionId());
        event.setPublishAt(req.getPublishAt());
        event.setEventStartAt(req.getEventStartAt());
        event.setEventEndAt(req.getEventEndAt());
        event.setTimezone(req.getTimezone().trim());
        event.setLocation(req.getLocation() != null ? req.getLocation().trim() : null);
        event.setLocaleCode(req.getLocale() == null || req.getLocale().isBlank() ? "en" : req.getLocale().trim().toLowerCase(Locale.ROOT));
        if (req.getPublishAt() != null) {
            event.setStatus(CommunicationEventStatus.SCHEDULED);
        } else {
            event.setStatus(CommunicationEventStatus.PUBLISHED);
            event.setPublishedAt(LocalDateTime.now());
        }
        return toEventResponse(eventRepo.save(event));
    }

    @Transactional(readOnly = true)
    public PageResponse<CommunicationEventDTOs.EventResponse> getEventsPaged(int page, int size, boolean upcomingOnly) {
        Pageable pageable = PageRequest.of(page, size);
        Page<CommunicationEvent> pg = upcomingOnly
                ? eventRepo.pageUpcoming(TenantContext.getTenantId(), LocalDateTime.now(), pageable)
                : eventRepo.pageForTenant(TenantContext.getTenantId(), pageable);
        return PageResponse.fromSpringPage(pg.map(this::toEventResponse));
    }

    @Transactional(readOnly = true)
    public PageResponse<CommunicationEventDTOs.EventResponse> getEventsForMePaged(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        String role = normalizedRole();
        if (seesFullSchoolAnnouncementBoard(role)) {
            return getEventsPaged(page, size, false);
        }
        AudienceLists lists = resolveAnnouncementAudienceLists();
        Page<CommunicationEvent> pg = eventRepo.pageForAudience(
                TenantContext.getTenantId(),
                role,
                lists.classIds(),
                lists.sectionIds(),
                pageable);
        return PageResponse.fromSpringPage(pg.map(this::toEventResponse));
    }

    private void validateAnnouncementRequest(AnnouncementDTOs.CreateAnnouncementRequest req) {
        if (req == null) {
            throw new BusinessException("Announcement request is required.");
        }
        final String tenantId = TenantContext.getTenantId();
        final String title = req.getTitle() != null ? req.getTitle().trim() : "";
        if (title.isEmpty()) {
            throw new BusinessException("Announcement title is required.");
        }
        if (req.getTargetAudience() == null) {
            throw new BusinessException("Target audience is required.");
        }
        final Enums.TargetAudience aud = req.getTargetAudience();
        final Long targetClassId = req.getTargetClassId();
        final Long targetSectionId = req.getTargetSectionId();
        switch (aud) {
            case CLASS -> {
                if (targetClassId == null) {
                    throw new BusinessException("Class is required for class-targeted announcements.");
                }
                if (targetSectionId != null) {
                    throw new BusinessException("Section must be empty for class-targeted announcements.");
                }
            }
            case SECTION -> {
                if (targetClassId == null || targetSectionId == null) {
                    throw new BusinessException("Both class and section are required for section-targeted announcements.");
                }
            }
            default -> {
                if (targetClassId != null || targetSectionId != null) {
                    throw new BusinessException("Class or section is not allowed for this audience.");
                }
            }
        }
        if (targetClassId != null && schoolClassRepository.findByIdAndTenantIdAndIsDeletedFalse(targetClassId, tenantId).isEmpty()) {
            throw new BusinessException("Selected class does not belong to this school.");
        }
        if (targetSectionId != null) {
            var section = sectionRepository.findByIdAndTenantIdAndIsDeletedFalse(targetSectionId, tenantId)
                    .orElseThrow(() -> new BusinessException("Selected section does not belong to this school."));
            if (targetClassId != null && !targetClassId.equals(section.getClassId())) {
                throw new BusinessException("Selected section does not belong to the chosen class.");
            }
        }
        boolean duplicateRecent = annRepo
                .existsByTenantIdAndIsDeletedFalseAndTitleIgnoreCaseAndTargetAudienceAndTargetClassIdAndTargetSectionIdAndCreatedAtAfter(
                        tenantId,
                        title,
                        aud,
                        targetClassId,
                        targetSectionId,
                        LocalDateTime.now().minusMinutes(5));
        if (duplicateRecent) {
            throw new BusinessException("A similar announcement was published recently. Please edit and retry.");
        }
    }

    private void validateEventRequest(CommunicationEventDTOs.CreateEventRequest req) {
        if (req == null) {
            throw new BusinessException("Event request is required.");
        }
        if (req.getTitle() == null || req.getTitle().trim().isEmpty()) {
            throw new BusinessException("Event title is required.");
        }
        if (req.getAudienceScope() == null) {
            throw new BusinessException("Audience is required.");
        }
        if (req.getEventStartAt() == null) {
            throw new BusinessException("Event start date/time is required.");
        }
        if (req.getEventEndAt() != null && req.getEventEndAt().isBefore(req.getEventStartAt())) {
            throw new BusinessException("Event end date/time cannot be before start date/time.");
        }
        if (req.getPublishAt() != null && req.getPublishAt().isAfter(req.getEventStartAt())) {
            throw new BusinessException("Publish date/time cannot be after event start date/time.");
        }
        String tenantId = TenantContext.getTenantId();
        Enums.TargetAudience aud = req.getAudienceScope();
        Long targetClassId = req.getTargetClassId();
        Long targetSectionId = req.getTargetSectionId();
        switch (aud) {
            case CLASS -> {
                if (targetClassId == null) {
                    throw new BusinessException("Class is required for class-targeted events.");
                }
                if (targetSectionId != null) {
                    throw new BusinessException("Section must be empty for class-targeted events.");
                }
            }
            case SECTION -> {
                if (targetClassId == null || targetSectionId == null) {
                    throw new BusinessException("Both class and section are required for section-targeted events.");
                }
            }
            default -> {
                if (targetClassId != null || targetSectionId != null) {
                    throw new BusinessException("Class or section is not allowed for this audience.");
                }
            }
        }
        if (targetClassId != null && schoolClassRepository.findByIdAndTenantIdAndIsDeletedFalse(targetClassId, tenantId).isEmpty()) {
            throw new BusinessException("Selected class does not belong to this school.");
        }
        if (targetSectionId != null) {
            var section = sectionRepository.findByIdAndTenantIdAndIsDeletedFalse(targetSectionId, tenantId)
                    .orElseThrow(() -> new BusinessException("Selected section does not belong to this school."));
            if (targetClassId != null && !targetClassId.equals(section.getClassId())) {
                throw new BusinessException("Selected section does not belong to the chosen class.");
            }
        }
    }

    private CommunicationEventDTOs.EventResponse toEventResponse(CommunicationEvent event) {
        CommunicationEventDTOs.EventResponse response = new CommunicationEventDTOs.EventResponse();
        response.setId(event.getId());
        response.setTitle(event.getTitle());
        response.setDescription(event.getDescription());
        response.setEventType(event.getEventType());
        response.setAudienceScope(event.getAudienceScope());
        response.setTargetClassId(event.getTargetClassId());
        response.setTargetSectionId(event.getTargetSectionId());
        response.setPublishAt(event.getPublishAt());
        response.setEventStartAt(event.getEventStartAt());
        response.setEventEndAt(event.getEventEndAt());
        response.setTimezone(event.getTimezone());
        response.setLocale(event.getLocaleCode());
        response.setLocation(event.getLocation());
        response.setStatus(event.getStatus());
        response.setCreatedAt(event.getCreatedAt());
        response.setPublishedCampaignId(event.getPublishedCampaignId());
        response.setReminder1dCampaignId(event.getReminder1dCampaignId());
        response.setReminder1hCampaignId(event.getReminder1hCampaignId());
        return response;
    }

    @CacheEvict(cacheNames = CacheConfig.ANNOUNCEMENT_PREVIEWS, allEntries = true)
    @Transactional
    public Announcement updateAnnouncement(Long id, Announcement update) {
        Announcement ann = annRepo.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Announcement", id));
        if (update.getTitle() != null) ann.setTitle(update.getTitle());
        if (update.getContent() != null) ann.setContent(update.getContent());
        if (update.getTargetAudience() != null) ann.setTargetAudience(update.getTargetAudience());
        return annRepo.save(ann);
    }

    @CacheEvict(cacheNames = CacheConfig.ANNOUNCEMENT_PREVIEWS, allEntries = true)
    @Transactional
    public void deleteAnnouncement(Long id) {
        Announcement a = annRepo.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Announcement", id));
        a.setIsDeleted(true);
        annRepo.save(a);
    }

    @Transactional(readOnly = true)
    public List<CommunicationDTOs.MessageResponse> getMyMessages() {
        String t = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();
        return msgRepo.findUserMessages(t, userId).stream().map(this::toMsgResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CommunicationDTOs.MessageResponse> getConversation(Long otherUserId) {
        String t = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();
        return msgRepo.findConversation(t, userId, otherUserId).stream().map(this::toMsgResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<CommunicationDTOs.MessageResponse> getMyMessagesPaged(int page, int size) {
        String t = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(1, Math.min(size, 100)), Sort.by(Sort.Direction.DESC, "createdAt"));
        return PageResponse.fromSpringPage(msgRepo.findUserMessagesPage(t, userId, pageable).map(this::toMsgResponse));
    }

    @Transactional(readOnly = true)
    public PageResponse<CommunicationDTOs.MessageResponse> getConversationPaged(Long otherUserId, int page, int size) {
        String t = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(1, Math.min(size, 100)), Sort.by(Sort.Direction.ASC, "createdAt"));
        return PageResponse.fromSpringPage(msgRepo.findConversationPage(t, userId, otherUserId, pageable).map(this::toMsgResponse));
    }

    @Transactional
    public CommunicationDTOs.MessageResponse sendMessage(CommunicationDTOs.SendMessageRequest req) {
        assertMaySendDirectMessage(req.getReceiverId());
        String t = TenantContext.getTenantId();
        Message msg = Message.builder().senderId(TenantContext.getUserId()).senderName(req.getSenderName()).senderRole(TenantContext.getUserRole()).receiverId(req.getReceiverId()).receiverName(req.getReceiverName()).content(req.getContent()).isRead(false).build();
        msg.setTenantId(t);
        msgRepo.save(msg);
        log.info("Message sent from {} to {}", msg.getSenderId(), msg.getReceiverId());
        return toMsgResponse(msg);
    }

    @Transactional
    public void markMessageRead(Long messageId) {
        Long userId = TenantContext.getUserId();
        Message m;
        if (TenantQueryPolicy.isPlatformSuperAdmin()) {
            m = msgRepo.findById(messageId).filter(x -> !Boolean.TRUE.equals(x.getIsDeleted())).orElseThrow(() -> new ResourceNotFoundException("Message", messageId));
        } else {
            m = msgRepo.findByIdAndTenantIdAndIsDeletedFalse(messageId, TenantContext.getTenantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Message", messageId));
            if (userId == null || !userId.equals(m.getReceiverId())) {
                throw new UnauthorizedException("Not allowed to update this message");
            }
        }
        m.setIsRead(true);
        msgRepo.save(m);
    }

    @Transactional(readOnly = true)
    public long getUnreadMessageCount() {
        return msgRepo.countByTenantIdAndReceiverIdAndIsReadFalse(TenantContext.getTenantId(), TenantContext.getUserId());
    }

    private void assertMaySendDirectMessage(Long receiverId) {
        if (receiverId == null) {
            throw new BusinessException("Receiver is required");
        }
        Long senderId = TenantContext.getUserId();
        if (senderId != null && senderId.equals(receiverId)) {
            throw new BusinessException("Cannot message yourself");
        }
        String t = TenantContext.getTenantId();
        String sr = TenantContext.getUserRole() != null ? TenantContext.getUserRole().trim().toUpperCase(Locale.ROOT) : "";
        User receiver = userRepository.findByIdAndTenantIdAndIsDeletedFalse(receiverId, t)
                .orElseThrow(() -> new ResourceNotFoundException("User", receiverId));
        String rr = receiver.getRole() != null ? receiver.getRole().name().trim().toUpperCase(Locale.ROOT) : "";
        if (TenantQueryPolicy.isPlatformSuperAdmin()) {
            return;
        }
        if ("ADMIN".equals(sr) || "SUPER_ADMIN".equals(sr)) {
            return;
        }
        if ("PARENT".equals(sr) && "TEACHER".equals(rr)) {
            if (!chatDirectoryService.parentMayMessageTeacherUser(senderId, receiverId)) {
                throw new UnauthorizedException("You may only message your child's class teachers.");
            }
            return;
        }
        if ("TEACHER".equals(sr) && "PARENT".equals(rr)) {
            if (!chatDirectoryService.teacherMayMessageParentUser(senderId, receiverId)) {
                throw new UnauthorizedException("You may only message parents in your class rosters.");
            }
            return;
        }
        if ("TEACHER".equals(sr) && "TEACHER".equals(rr)) {
            return;
        }
        throw new UnauthorizedException("Direct messaging is not enabled for this recipient.");
    }

    /** Spring Security uses {@code ROLE_ADMIN}; JWT / legacy callers may omit the prefix — normalize for announcement visibility. */
    private static String normalizedRole() {
        String raw = TenantContext.getUserRole();
        if (raw == null) {
            return "";
        }
        String r = raw.trim().toUpperCase(Locale.ROOT);
        if (r.startsWith("ROLE_")) {
            r = r.substring(5);
        }
        return r;
    }

    /**
     * Teachers use audience-scoped queries (same JPQL as parents) so parent-only bulletins never appear on the staff board.
     */
    private static boolean seesFullSchoolAnnouncementBoard(String roleNorm) {
        return "ADMIN".equals(roleNorm)
                || "SUPER_ADMIN".equals(roleNorm)
                || "LIBRARY_STAFF".equals(roleNorm)
                || "SCHOOL_STAFF".equals(roleNorm);
    }

    private static String previewText(String content) {
        if (content == null) return "";
        String t = content.replaceAll("\\s+", " ").trim();
        if (t.length() <= 160) return t;
        return t.substring(0, 157) + "…";
    }

    private CommunicationDTOs.MessageResponse toMsgResponse(Message m) {
        return CommunicationDTOs.MessageResponse.builder().id(m.getId()).senderId(m.getSenderId()).senderName(m.getSenderName()).senderRole(m.getSenderRole()).receiverId(m.getReceiverId()).receiverName(m.getReceiverName()).content(m.getContent()).isRead(m.getIsRead()).timestamp(m.getCreatedAt() != null ? m.getCreatedAt().toString() : null).build();
    }

    public CommunicationService(
            final AnnouncementRepository annRepo,
            final MessageRepository msgRepo,
            final GuardianService guardianService,
            final AnnouncementNotificationFanoutService announcementFanout,
            final UserRepository userRepository,
            final ChatDirectoryService chatDirectoryService,
            final TeacherRosterScopeService teacherRosterScopeService,
            final SchoolClassRepository schoolClassRepository,
            final SectionRepository sectionRepository,
            final CommunicationEventRepository eventRepo) {
        this.annRepo = annRepo;
        this.msgRepo = msgRepo;
        this.guardianService = guardianService;
        this.announcementFanout = announcementFanout;
        this.userRepository = userRepository;
        this.chatDirectoryService = chatDirectoryService;
        this.teacherRosterScopeService = teacherRosterScopeService;
        this.schoolClassRepository = schoolClassRepository;
        this.sectionRepository = sectionRepository;
        this.eventRepo = eventRepo;
    }
}
