package com.school.erp.modules.communication.service;

import com.school.erp.modules.communication.dto.CommunicationDTOs;
import com.school.erp.modules.communication.dto.AnnouncementDTOs;
import com.school.erp.modules.communication.entity.*;
import com.school.erp.modules.communication.repository.*;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.tenant.TenantContext;
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
    private final StudentRepository studentRepository;

    // ========== ANNOUNCEMENTS ==========
    @Transactional(readOnly = true)
    public List<Announcement> getAnnouncements() {
        String role = TenantContext.getUserRole() != null ? TenantContext.getUserRole().trim().toUpperCase(Locale.ROOT) : "";
        // Admins/teachers can browse all; parents/students get filtered announcements
        if ("ADMIN".equals(role) || "TEACHER".equals(role) || "SUPER_ADMIN".equals(role)) {
            return annRepo.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(TenantContext.getTenantId());
        }
        return getAnnouncementsForMe();
    }

    @Transactional(readOnly = true)
    public List<Announcement> getAnnouncementsForMe() {
        String tenantId = TenantContext.getTenantId();
        String role = TenantContext.getUserRole() != null ? TenantContext.getUserRole().trim().toUpperCase(Locale.ROOT) : "";

        List<Long> classIds = new ArrayList<>();
        List<Long> sectionIds = new ArrayList<>();

        if ("PARENT".equals(role) || "ADMIN".equals(role)) {
            // Parent scope: all of their children
            Long parentId = TenantContext.getUserId();
            for (var s : studentRepository.findByTenantIdAndParentIdAndIsDeletedFalse(tenantId, parentId)) {
                if (s.getClassId() != null) classIds.add(s.getClassId());
                if (s.getSectionId() != null) sectionIds.add(s.getSectionId());
            }
        }

        if ("STUDENT".equals(role)) {
            // Student scope: find student by current user id is not modeled; fallback to only ALL + role-based.
            // This is intentionally conservative until we add a proper student-user mapping.
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
        return annRepo.save(ann);
    }

    @Transactional
    public Announcement updateAnnouncement(Long id, Announcement update) {
        Announcement ann = annRepo.findById(id).orElseThrow(() -> new com.school.erp.common.exception.ResourceNotFoundException("Announcement", id));
        if (update.getTitle() != null) ann.setTitle(update.getTitle());
        if (update.getContent() != null) ann.setContent(update.getContent());
        if (update.getTargetAudience() != null) ann.setTargetAudience(update.getTargetAudience());
        return annRepo.save(ann);
    }

    @Transactional
    public void deleteAnnouncement(Long id) {
        annRepo.findById(id).ifPresent(a -> {
            a.setIsDeleted(true);
            annRepo.save(a);
        });
    }

    // ========== MESSAGING (Teacher-Parent Chat) ==========
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
        String t = TenantContext.getTenantId();
        Message msg = Message.builder().senderId(TenantContext.getUserId()).senderName(req.getSenderName()).senderRole(TenantContext.getUserRole()).receiverId(req.getReceiverId()).receiverName(req.getReceiverName()).content(req.getContent()).isRead(false).build();
        msg.setTenantId(t);
        msgRepo.save(msg);
        log.info("Message sent from {} to {}", msg.getSenderId(), msg.getReceiverId());
        return toMsgResponse(msg);
    }

    @Transactional
    public void markMessageRead(Long messageId) {
        msgRepo.findById(messageId).ifPresent(m -> {
            m.setIsRead(true);
            msgRepo.save(m);
        });
    }

    @Transactional(readOnly = true)
    public long getUnreadMessageCount() {
        return msgRepo.countByTenantIdAndReceiverIdAndIsReadFalse(TenantContext.getTenantId(), TenantContext.getUserId());
    }

    private CommunicationDTOs.MessageResponse toMsgResponse(Message m) {
        return CommunicationDTOs.MessageResponse.builder().id(m.getId()).senderId(m.getSenderId()).senderName(m.getSenderName()).senderRole(m.getSenderRole()).receiverId(m.getReceiverId()).receiverName(m.getReceiverName()).content(m.getContent()).isRead(m.getIsRead()).timestamp(m.getCreatedAt() != null ? m.getCreatedAt().toString() : null).build();
    }

    public CommunicationService(final AnnouncementRepository annRepo, final MessageRepository msgRepo, final StudentRepository studentRepository) {
        this.annRepo = annRepo;
        this.msgRepo = msgRepo;
        this.studentRepository = studentRepository;
    }
}
