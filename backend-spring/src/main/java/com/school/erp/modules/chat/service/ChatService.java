package com.school.erp.modules.chat.service;

import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.exception.UnauthorizedException;
import com.school.erp.modules.chat.dto.ChatDTOs;
import com.school.erp.modules.chat.entity.ChatConversation;
import com.school.erp.modules.chat.entity.ChatMessage;
import com.school.erp.modules.chat.entity.ChatParticipant;
import com.school.erp.modules.chat.repository.ChatConversationRepository;
import com.school.erp.modules.chat.repository.ChatMessageRepository;
import com.school.erp.modules.chat.repository.ChatParticipantRepository;
import com.school.erp.tenant.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ChatService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ChatService.class);
    private final ChatConversationRepository conversationRepo;
    private final ChatParticipantRepository participantRepo;
    private final ChatMessageRepository messageRepo;
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatPolicyService policy = new ChatPolicyService();

    @Transactional(readOnly = true)
    public List<ChatDTOs.InboxConversationResponse> inbox() {
        String tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();

        List<ChatConversation> conversations = conversationRepo.findInbox(tenantId, userId);
        log.debug("Chat inbox load tenantId={} userId={} conversationCount={}", tenantId, userId, conversations.size());
        Map<Long, List<ChatParticipant>> participantsByConversation = participantRepo.findByUser(tenantId, userId).stream()
                .map(p -> p.getConversationId())
                .distinct()
                .collect(Collectors.toMap(
                        id -> id,
                        id -> participantRepo.findByTenantIdAndConversationIdAndIsDeletedFalse(tenantId, id)
                ));

        List<ChatDTOs.InboxConversationResponse> rows = conversations.stream().map(c -> toInboxResponse(tenantId, userId, c, participantsByConversation.getOrDefault(c.getId(), List.of()))).collect(Collectors.toList());
        log.info("Chat inbox returned {} conversation(s)", rows.size());
        return rows;
    }

    @Transactional
    public ChatDTOs.InboxConversationResponse createConversation(ChatDTOs.CreateConversationRequest request) {
        String tenantId = TenantContext.getTenantId();
        Long initiatorId = TenantContext.getUserId();
        String initiatorRole = TenantContext.getUserRole();
        log.info("Creating chat conversation type={} participantCount={}", request.getType(), request.getParticipants() != null ? request.getParticipants().size() : 0);

        String type = normLower(request.getType());
        if (!"direct".equals(type) && !"group".equals(type)) {
            log.warn("Unsupported chat type {}", request.getType());
            throw new BusinessException("Unsupported conversation type: " + request.getType());
        }
        if ("direct".equals(type) && request.getParticipants().size() != 2) {
            log.warn("Direct chat requires 2 participants, got {}", request.getParticipants().size());
            throw new BusinessException("Direct conversation must have exactly 2 participants");
        }

        boolean initiatorIncluded = request.getParticipants().stream().anyMatch(p -> p.getUserId().equals(initiatorId));
        if (!initiatorIncluded) {
            log.warn("Initiator {} not in participant list", initiatorId);
            throw new BusinessException("Initiator must be included as a participant");
        }

        // Policy check for direct chats: initiator must be allowed to start chat with the other role.
        if ("direct".equals(type)) {
            ChatDTOs.CreateParticipant other = request.getParticipants().stream()
                    .filter(p -> !p.getUserId().equals(initiatorId))
                    .findFirst()
                    .orElseThrow(() -> new BusinessException("Missing other participant"));
            if (!policy.canStartConversation(initiatorRole, other.getUserRole())) {
                log.warn("Chat policy denied initiatorRole={} targetRole={}", initiatorRole, other.getUserRole());
                throw new UnauthorizedException("You are not allowed to start a conversation with this role");
            }
        }

        ChatConversation conv = new ChatConversation();
        conv.setTenantId(tenantId);
        conv.setType(type);
        conv.setSubject(request.getSubject());
        conv.setContextType(request.getContextType());
        conv.setContextId(request.getContextId());
        conv.setIsActive(true);
        conv.setIsDeleted(false);
        conversationRepo.save(conv);

        List<ChatParticipant> participants = request.getParticipants().stream().map(p -> {
            ChatParticipant cp = new ChatParticipant();
            cp.setTenantId(tenantId);
            cp.setConversationId(conv.getId());
            cp.setUserId(p.getUserId());
            cp.setUserRole(p.getUserRole().trim().toUpperCase(Locale.ROOT));
            cp.setDisplayName(p.getDisplayName());
            cp.setMuted(false);
            cp.setIsActive(true);
            cp.setIsDeleted(false);
            return cp;
        }).collect(Collectors.toList());
        participantRepo.saveAll(participants);

        ChatDTOs.InboxConversationResponse response = toInboxResponse(tenantId, initiatorId, conv, participants);
        log.info("Chat conversation created id={} type={} participants={}", conv.getId(), type, participants.size());
        // notify participants they have a new conversation
        broadcastInboxUpdate(conv.getId(), participants);
        return response;
    }

    @Transactional(readOnly = true)
    public Page<ChatDTOs.MessageResponse> getMessages(Long conversationId, int page, int size) {
        String tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();
        log.debug("Loading chat messages conversationId={} page={} size={}", conversationId, page, size);
        assertParticipant(tenantId, conversationId, userId);

        Page<ChatMessage> messages = messageRepo.findByTenantIdAndConversationIdAndIsDeletedFalseOrderByIdDesc(
                tenantId, conversationId, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 200))
        );
        log.info("Chat messages page conversationId={} returned={} total={}", conversationId, messages.getNumberOfElements(), messages.getTotalElements());
        return messages.map(this::toMessageResponse);
    }

    @Transactional
    public ChatDTOs.MessageResponse sendMessage(ChatDTOs.SendMessageRequest request) {
        String tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();
        String role = TenantContext.getUserRole();
        log.debug("Sending chat message conversationId={} userId={}", request.getConversationId(), userId);
        assertParticipant(tenantId, request.getConversationId(), userId);

        ChatConversation conv = conversationRepo.findByIdAndTenantIdAndIsDeletedFalse(request.getConversationId(), tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", request.getConversationId()));

        ChatMessage msg = new ChatMessage();
        msg.setTenantId(tenantId);
        msg.setConversationId(conv.getId());
        msg.setSenderUserId(userId);
        msg.setSenderRole(role != null ? role.trim().toUpperCase(Locale.ROOT) : "UNKNOWN");
        msg.setSenderName(null);
        msg.setBody(request.getBody());
        msg.setBodyType("text");
        msg.setClientMessageId(request.getClientMessageId());
        msg.setIsActive(true);
        msg.setIsDeleted(false);
        messageRepo.save(msg);

        conv.setLastMessageAt(LocalDateTime.now());
        conv.setLastMessagePreview(compactPreview(request.getBody()));
        conversationRepo.save(conv);

        ChatDTOs.MessageResponse response = toMessageResponse(msg);
        messagingTemplate.convertAndSend("/topic/chat.conversation." + conv.getId(), response);

        List<ChatParticipant> participants = participantRepo.findByTenantIdAndConversationIdAndIsDeletedFalse(tenantId, conv.getId());
        broadcastInboxUpdate(conv.getId(), participants);

        log.info("Chat message sent id={} conversationId={}", msg.getId(), conv.getId());
        return response;
    }

    @Transactional
    public void markRead(ChatDTOs.MarkReadRequest request) {
        String tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();
        log.debug("Mark chat read conversationId={} userId={} upToMessageId={}", request.getConversationId(), userId, request.getLastReadMessageId());
        ChatParticipant p = participantRepo.findByTenantIdAndConversationIdAndUserIdAndIsDeletedFalse(tenantId, request.getConversationId(), userId)
                .orElseThrow(() -> new UnauthorizedException("Not a participant"));
        p.setLastReadMessageId(request.getLastReadMessageId());
        p.setLastReadAt(LocalDateTime.now());
        participantRepo.save(p);

        // inbox update is enough; clients compute badges
        List<ChatParticipant> participants = participantRepo.findByTenantIdAndConversationIdAndIsDeletedFalse(tenantId, request.getConversationId());
        broadcastInboxUpdate(request.getConversationId(), participants);
        log.info("Chat read marked conversationId={} userId={}", request.getConversationId(), userId);
    }

    private void assertParticipant(String tenantId, Long conversationId, Long userId) {
        participantRepo.findByTenantIdAndConversationIdAndUserIdAndIsDeletedFalse(tenantId, conversationId, userId)
                .orElseThrow(() -> {
                    log.warn("Chat access denied: not a participant conversationId={} userId={}", conversationId, userId);
                    return new UnauthorizedException("You are not allowed to access this conversation");
                });
    }

    private ChatDTOs.InboxConversationResponse toInboxResponse(String tenantId, Long currentUserId, ChatConversation c, List<ChatParticipant> participants) {
        ChatDTOs.InboxConversationResponse r = new ChatDTOs.InboxConversationResponse();
        r.setConversationId(c.getId());
        r.setType(c.getType());
        r.setSubject(c.getSubject());
        r.setContextType(c.getContextType());
        r.setContextId(c.getContextId());
        r.setLastMessageAt(c.getLastMessageAt());
        r.setLastMessagePreview(c.getLastMessagePreview());
        r.setParticipants(participants.stream()
                .sorted(Comparator.comparing(ChatParticipant::getUserId))
                .map(p -> new ChatDTOs.ParticipantSummary(p.getUserId(), p.getUserRole(), p.getDisplayName()))
                .collect(Collectors.toList()));

        // MVP unread: compute from lastReadMessageId vs last message id is non-trivial without joins; keep 0 for now.
        // Frontend will still display last message and will get realtime push. We can extend this with efficient count queries later.
        r.setUnreadCount(0);
        return r;
    }

    private ChatDTOs.MessageResponse toMessageResponse(ChatMessage m) {
        ChatDTOs.MessageResponse r = new ChatDTOs.MessageResponse();
        r.setId(m.getId());
        r.setConversationId(m.getConversationId());
        r.setSenderUserId(m.getSenderUserId());
        r.setSenderRole(m.getSenderRole());
        r.setSenderName(m.getSenderName());
        r.setBody(m.getBody());
        r.setBodyType(m.getBodyType());
        r.setClientMessageId(m.getClientMessageId());
        r.setCreatedAt(m.getCreatedAt());
        return r;
    }

    private void broadcastInboxUpdate(Long conversationId, List<ChatParticipant> participants) {
        String tenantId = TenantContext.getTenantId();
        ChatConversation conv = conversationRepo.findByIdAndTenantIdAndIsDeletedFalse(conversationId, tenantId)
                .orElse(null);
        if (conv == null) return;

        for (ChatParticipant p : participants) {
            try {
                ChatDTOs.InboxConversationResponse payload = toInboxResponse(tenantId, p.getUserId(), conv, participants);
                messagingTemplate.convertAndSendToUser(String.valueOf(p.getUserId()), "/queue/chat.inbox", payload);
            } catch (Exception e) {
                log.warn("Failed to push inbox update conv={} user={}", conversationId, p.getUserId(), e);
            }
        }
    }

    private String compactPreview(String text) {
        if (text == null) return null;
        String s = text.replaceAll("\\s+", " ").trim();
        if (s.length() <= 160) return s;
        return s.substring(0, 157) + "...";
    }

    private String normLower(String v) {
        return v == null ? "" : v.trim().toLowerCase(Locale.ROOT);
    }

    public ChatService(ChatConversationRepository conversationRepo,
                       ChatParticipantRepository participantRepo,
                       ChatMessageRepository messageRepo,
                       SimpMessagingTemplate messagingTemplate) {
        this.conversationRepo = conversationRepo;
        this.participantRepo = participantRepo;
        this.messageRepo = messageRepo;
        this.messagingTemplate = messagingTemplate;
    }
}

