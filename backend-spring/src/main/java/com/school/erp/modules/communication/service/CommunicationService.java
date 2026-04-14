package com.school.erp.modules.communication.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.exception.UnauthorizedException;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.chat.service.ChatDirectoryService;
import com.school.erp.modules.communication.dto.CommunicationDTOs;
import com.school.erp.modules.communication.dto.AnnouncementDTOs;
import com.school.erp.modules.communication.entity.*;
import com.school.erp.modules.communication.repository.*;
import com.school.erp.modules.guardian.service.GuardianService;
import com.school.erp.modules.notification.service.AnnouncementNotificationFanoutService;
import com.school.erp.config.CacheConfig;
import com.school.erp.tenant.TenantContext;
import com.school.erp.tenant.TenantQueryPolicy;
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

    @Transactional(readOnly = true)
    public List<Announcement> getAnnouncements() {
        String role = TenantContext.getUserRole() != null ? TenantContext.getUserRole().trim().toUpperCase(Locale.ROOT) : "";
        if ("ADMIN".equals(role) || "TEACHER".equals(role) || "SUPER_ADMIN".equals(role) || "LIBRARY_STAFF".equals(role)) {
            return annRepo.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(TenantContext.getTenantId());
        }
        return getAnnouncementsForMe();
    }

    @Transactional(readOnly = true)
    public PageResponse<Announcement> getAnnouncementsPaged(int page, int size, String q) {
        String role = TenantContext.getUserRole() != null ? TenantContext.getUserRole().trim().toUpperCase(Locale.ROOT) : "";
        String tenantId = TenantContext.getTenantId();
        String qq = q == null ? "" : q.trim();
        Pageable p = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        if ("ADMIN".equals(role) || "TEACHER".equals(role) || "SUPER_ADMIN".equals(role) || "LIBRARY_STAFF".equals(role)) {
            Page<Announcement> pg = annRepo.pageTenantSearch(tenantId, qq, p);
            return PageResponse.of(pg.getContent(), page, size, pg.getTotalElements());
        }
        List<Long> classIds = new ArrayList<>();
        List<Long> sectionIds = new ArrayList<>();
        if ("PARENT".equals(role) || "ADMIN".equals(role)) {
            Long parentId = TenantContext.getUserId();
            for (var s : guardianService.findStudentsForParentUser(tenantId, parentId)) {
                if (s.getClassId() != null) classIds.add(s.getClassId());
                if (s.getSectionId() != null) sectionIds.add(s.getSectionId());
            }
        }
        if (classIds.isEmpty()) classIds = List.of(-1L);
        if (sectionIds.isEmpty()) sectionIds = List.of(-1L);
        Page<Announcement> pg = annRepo.findForAudiencePaged(tenantId, role, classIds, sectionIds, qq, p);
        return PageResponse.of(pg.getContent(), page, size, pg.getTotalElements());
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
            return p;
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Announcement getAnnouncement(Long id) {
        return annRepo.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Announcement", id));
    }

    @Transactional(readOnly = true)
    public List<Announcement> getAnnouncementsForMe() {
        String tenantId = TenantContext.getTenantId();
        String role = TenantContext.getUserRole() != null ? TenantContext.getUserRole().trim().toUpperCase(Locale.ROOT) : "";

        List<Long> classIds = new ArrayList<>();
        List<Long> sectionIds = new ArrayList<>();

        if ("PARENT".equals(role) || "ADMIN".equals(role)) {
            Long parentId = TenantContext.getUserId();
            for (var s : guardianService.findStudentsForParentUser(tenantId, parentId)) {
                if (s.getClassId() != null) classIds.add(s.getClassId());
                if (s.getSectionId() != null) sectionIds.add(s.getSectionId());
            }
        }

        if ("STUDENT".equals(role)) {
            // Conservative until student-user mapping exists
        }

        if (classIds.isEmpty()) classIds = List.of(-1L);
        if (sectionIds.isEmpty()) sectionIds = List.of(-1L);

        return annRepo.findForAudience(tenantId, role, classIds, sectionIds);
    }

    @Transactional
    public Announcement createAnnouncement(AnnouncementDTOs.CreateAnnouncementRequest req) {
        Announcement ann = new Announcement();
        ann.setTenantId(TenantContext.getTenantId());
        ann.setTitle(req.getTitle());
        ann.setContent(req.getContent());
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
    public Announcement updateAnnouncement(Long id, Announcement update) {
        Announcement ann = annRepo.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Announcement", id));
        if (update.getTitle() != null) ann.setTitle(update.getTitle());
        if (update.getContent() != null) ann.setContent(update.getContent());
        if (update.getTargetAudience() != null) ann.setTargetAudience(update.getTargetAudience());
        return annRepo.save(ann);
    }

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
            final ChatDirectoryService chatDirectoryService) {
        this.annRepo = annRepo;
        this.msgRepo = msgRepo;
        this.guardianService = guardianService;
        this.announcementFanout = announcementFanout;
        this.userRepository = userRepository;
        this.chatDirectoryService = chatDirectoryService;
    }
}
