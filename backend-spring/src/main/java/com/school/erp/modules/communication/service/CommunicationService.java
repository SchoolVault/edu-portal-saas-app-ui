package com.school.erp.modules.communication.service;

import com.school.erp.modules.communication.dto.CommunicationDTOs;
import com.school.erp.modules.communication.entity.*;
import com.school.erp.modules.communication.repository.*;
import com.school.erp.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j @Service @RequiredArgsConstructor
public class CommunicationService {
    private final AnnouncementRepository annRepo;
    private final MessageRepository msgRepo;

    // ========== ANNOUNCEMENTS ==========
    @Transactional(readOnly = true)
    public List<Announcement> getAnnouncements() {
        return annRepo.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(TenantContext.getTenantId());
    }

    @Transactional
    public Announcement createAnnouncement(Announcement ann) {
        ann.setTenantId(TenantContext.getTenantId());
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
        annRepo.findById(id).ifPresent(a -> { a.setIsDeleted(true); annRepo.save(a); });
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
        Message msg = Message.builder()
                .senderId(TenantContext.getUserId()).senderName(req.getSenderName())
                .senderRole(TenantContext.getUserRole())
                .receiverId(req.getReceiverId()).receiverName(req.getReceiverName())
                .content(req.getContent()).isRead(false).build();
        msg.setTenantId(t);
        msgRepo.save(msg);
        log.info("Message sent from {} to {}", msg.getSenderId(), msg.getReceiverId());
        return toMsgResponse(msg);
    }

    @Transactional
    public void markMessageRead(Long messageId) {
        msgRepo.findById(messageId).ifPresent(m -> { m.setIsRead(true); msgRepo.save(m); });
    }

    @Transactional(readOnly = true)
    public long getUnreadMessageCount() {
        return msgRepo.countByTenantIdAndReceiverIdAndIsReadFalse(TenantContext.getTenantId(), TenantContext.getUserId());
    }

    private CommunicationDTOs.MessageResponse toMsgResponse(Message m) {
        return CommunicationDTOs.MessageResponse.builder()
                .id(m.getId()).senderId(m.getSenderId()).senderName(m.getSenderName()).senderRole(m.getSenderRole())
                .receiverId(m.getReceiverId()).receiverName(m.getReceiverName())
                .content(m.getContent()).isRead(m.getIsRead())
                .timestamp(m.getCreatedAt() != null ? m.getCreatedAt().toString() : null).build();
    }
}
