package com.school.erp.modules.chat.service;

import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.exception.UnauthorizedException;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.chat.ChatTenantConstants;
import com.school.erp.modules.chat.dto.ChatDTOs;
import com.school.erp.modules.chat.entity.ChatConversation;
import com.school.erp.modules.chat.entity.ChatMessage;
import com.school.erp.modules.chat.entity.ChatParticipant;
import com.school.erp.modules.chat.repository.ChatConversationRepository;
import com.school.erp.modules.chat.port.ChatMessageStorePort;
import com.school.erp.modules.chat.repository.ChatParticipantRepository;
import com.school.erp.common.enums.Enums;
import com.school.erp.tenant.TenantContext;
import com.school.erp.tenant.hibernate.TenantHibernateFilterSupport;
import com.school.erp.tenant.hibernate.TenantScopedFilter;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.hibernate.Session;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.function.Supplier;
import java.util.stream.Collectors;

@Service
public class ChatService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ChatService.class);
    private final ChatConversationRepository conversationRepo;
    private final ChatParticipantRepository participantRepo;
    private final ChatMessageStorePort chatMessageStore;
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatPolicyService policy = new ChatPolicyService();
    private final ChatDirectoryService chatDirectoryService;
    private final UserRepository userRepository;

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Super-admin ↔ campus threads use {@link ChatTenantConstants#PLATFORM_BRIDGE_TENANT}. Hibernate's tenant filter
     * otherwise hides those rows from school-scoped transactions, which breaks inbox, message paging, and participant checks.
     */
    private <T> T withCrossTenantChatVisibility(Supplier<T> action) {
        Session session = entityManager.unwrap(Session.class);
        boolean hadFilter = session.getEnabledFilter(TenantScopedFilter.NAME) != null;
        try {
            if (hadFilter) {
                session.disableFilter(TenantScopedFilter.NAME);
            }
            return action.get();
        } finally {
            if (hadFilter) {
                TenantHibernateFilterSupport.enableTenantFilterIfNeeded(session);
            }
        }
    }

    private void withCrossTenantChatVisibility(Runnable action) {
        withCrossTenantChatVisibility(() -> {
            action.run();
            return null;
        });
    }

    @Transactional(readOnly = true)
    public List<ChatDTOs.InboxConversationResponse> inbox() {
        return withCrossTenantChatVisibility(() -> {
            String tenantId = TenantContext.getTenantId();
            Long userId = TenantContext.getUserId();
            String role = TenantContext.getUserRole() != null ? TenantContext.getUserRole().trim().toUpperCase(Locale.ROOT) : "";

            LinkedHashMap<Long, ChatConversation> byId = new LinkedHashMap<>();

            if (Enums.Role.SUPER_ADMIN.name().equals(role)) {
                for (ChatConversation c : conversationRepo.findInbox(ChatTenantConstants.PLATFORM_BRIDGE_TENANT, userId)) {
                    byId.putIfAbsent(c.getId(), c);
                }
            } else {
                for (ChatConversation c : conversationRepo.findInbox(tenantId, userId)) {
                    byId.putIfAbsent(c.getId(), c);
                }
                for (ChatConversation c : conversationRepo.findInbox(ChatTenantConstants.PLATFORM_BRIDGE_TENANT, userId)) {
                    byId.putIfAbsent(c.getId(), c);
                }
            }

            List<ChatConversation> conversations = byId.values().stream()
                    .sorted(Comparator
                            .comparing((ChatConversation c) -> c.getLastMessageAt(), Comparator.nullsLast(Comparator.naturalOrder()))
                            .reversed()
                            .thenComparing(ChatConversation::getId, Comparator.reverseOrder()))
                    .collect(Collectors.toList());

            List<ChatDTOs.InboxConversationResponse> rows = new ArrayList<>();
            for (ChatConversation c : conversations) {
                String convTenant = c.getTenantId();
                List<ChatParticipant> parts = participantRepo.findByTenantIdAndConversationIdAndIsDeletedFalse(convTenant, c.getId());
                rows.add(toInboxResponse(convTenant, userId, c, parts));
            }
            log.info("Chat inbox returned {} conversation(s)", rows.size());
            return rows;
        });
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

        String convTenant = tenantId;

        if ("direct".equals(type)) {
            ChatDTOs.CreateParticipant other = request.getParticipants().stream()
                    .filter(p -> !p.getUserId().equals(initiatorId))
                    .findFirst()
                    .orElseThrow(() -> new BusinessException("Missing other participant"));
            if (!policy.canStartConversation(initiatorRole, other.getUserRole())) {
                log.warn("Chat policy denied initiatorRole={} targetRole={}", initiatorRole, other.getUserRole());
                throw new UnauthorizedException("You are not allowed to start a conversation with this role");
            }
            String iRole = initiatorRole != null ? initiatorRole.trim().toUpperCase(Locale.ROOT) : "";
            String oRole = other.getUserRole() != null ? other.getUserRole().trim().toUpperCase(Locale.ROOT) : "";
            if (Enums.Role.PARENT.name().equals(iRole) && Enums.Role.TEACHER.name().equals(oRole)) {
                if (!chatDirectoryService.parentMayMessageTeacherUser(initiatorId, other.getUserId())) {
                    log.warn("Parent {} attempted chat with teacher {} not linked to their children", initiatorId, other.getUserId());
                    throw new UnauthorizedException("You can only message your children's class teachers.");
                }
            }
            if (isPlatformAdminBridge(iRole, oRole)) {
                validatePlatformBridgePair(initiatorId, other.getUserId());
                convTenant = ChatTenantConstants.PLATFORM_BRIDGE_TENANT;
            }

            final String reuseTenantId = convTenant;
            Optional<ChatConversation> reuse = ChatTenantConstants.PLATFORM_BRIDGE_TENANT.equals(reuseTenantId)
                    ? withCrossTenantChatVisibility(() -> findReusableDirectConversation(reuseTenantId, initiatorId, other.getUserId()))
                    : findReusableDirectConversation(reuseTenantId, initiatorId, other.getUserId());
            if (reuse.isPresent()) {
                ChatConversation existing = reuse.get();
                List<ChatParticipant> existingParts = ChatTenantConstants.PLATFORM_BRIDGE_TENANT.equals(reuseTenantId)
                        ? withCrossTenantChatVisibility(() ->
                        participantRepo.findByTenantIdAndConversationIdAndIsDeletedFalse(reuseTenantId, existing.getId()))
                        : participantRepo.findByTenantIdAndConversationIdAndIsDeletedFalse(reuseTenantId, existing.getId());
                log.info("Reusing existing direct conversation id={} tenant={}", existing.getId(), reuseTenantId);
                return toInboxResponse(reuseTenantId, initiatorId, existing, existingParts);
            }
        }

        ChatConversation conv = new ChatConversation();
        conv.setTenantId(convTenant);
        conv.setType(type);
        conv.setSubject(request.getSubject());
        conv.setContextType(request.getContextType());
        conv.setContextId(request.getContextId());
        conv.setIsActive(true);
        conv.setIsDeleted(false);
        conversationRepo.save(conv);

        final String participantTenant = convTenant;
        List<ChatParticipant> participants = request.getParticipants().stream().map(p -> {
            ChatParticipant cp = new ChatParticipant();
            cp.setTenantId(participantTenant);
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

        ChatDTOs.InboxConversationResponse response = toInboxResponse(convTenant, initiatorId, conv, participants);
        log.info("Chat conversation created id={} tenant={} type={} participants={}", conv.getId(), convTenant, type, participants.size());
        broadcastInboxUpdate(conv.getId(), participants);
        return response;
    }

    @Transactional(readOnly = true)
    public Page<ChatDTOs.MessageResponse> getMessages(Long conversationId, int page, int size) {
        Long userId = TenantContext.getUserId();
        log.debug("Loading chat messages conversationId={} page={} size={}", conversationId, page, size);
        return withCrossTenantChatVisibility(() -> {
            ChatConversation conv = conversationRepo.findByIdAndIsDeletedFalse(conversationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Conversation", conversationId));
            assertParticipant(conv.getTenantId(), conversationId, userId);

            Page<ChatMessage> messages = chatMessageStore.pageByConversation(
                    conv.getTenantId(), conversationId, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 200))
            );
            log.info("Chat messages page conversationId={} returned={} total={}", conversationId, messages.getNumberOfElements(), messages.getTotalElements());
            return messages.map(this::toMessageResponse);
        });
    }

    @Transactional
    public ChatDTOs.MessageResponse sendMessage(ChatDTOs.SendMessageRequest request) {
        Long userId = TenantContext.getUserId();
        String role = TenantContext.getUserRole();
        log.debug("Sending chat message conversationId={} userId={}", request.getConversationId(), userId);

        return withCrossTenantChatVisibility(() -> {
            ChatConversation conv = conversationRepo.findByIdAndIsDeletedFalse(request.getConversationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Conversation", request.getConversationId()));
            String convTenant = conv.getTenantId();
            assertParticipant(convTenant, request.getConversationId(), userId);

            ChatMessage msg = new ChatMessage();
            msg.setTenantId(convTenant);
            msg.setConversationId(conv.getId());
            msg.setSenderUserId(userId);
            msg.setSenderRole(role != null ? role.trim().toUpperCase(Locale.ROOT) : "UNKNOWN");
            String senderLabel = userRepository.findByIdAndIsDeletedFalse(userId)
                    .map(User::getName)
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .orElse(null);
            msg.setSenderName(senderLabel);
            msg.setBody(request.getBody());
            msg.setBodyType("text");
            msg.setClientMessageId(request.getClientMessageId());
            msg.setIsActive(true);
            msg.setIsDeleted(false);
            chatMessageStore.save(msg);

            conv.setLastMessageAt(LocalDateTime.now());
            conv.setLastMessagePreview(compactPreview(request.getBody()));
            conversationRepo.save(conv);

            ChatDTOs.MessageResponse response = toMessageResponse(msg);
            messagingTemplate.convertAndSend("/topic/chat.conversation." + conv.getId(), response);

            List<ChatParticipant> participants = participantRepo.findByTenantIdAndConversationIdAndIsDeletedFalse(convTenant, conv.getId());
            broadcastInboxUpdate(conv.getId(), participants);

            log.info("Chat message sent id={} conversationId={}", msg.getId(), conv.getId());
            return response;
        });
    }

    @Transactional
    public void markRead(ChatDTOs.MarkReadRequest request) {
        Long userId = TenantContext.getUserId();
        log.debug("Mark chat read conversationId={} userId={} upToMessageId={}", request.getConversationId(), userId, request.getLastReadMessageId());
        withCrossTenantChatVisibility(() -> {
            ChatConversation conv = conversationRepo.findByIdAndIsDeletedFalse(request.getConversationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Conversation", request.getConversationId()));
            String convTenant = conv.getTenantId();
            ChatParticipant p = participantRepo.findByTenantIdAndConversationIdAndUserIdAndIsDeletedFalse(convTenant, request.getConversationId(), userId)
                    .orElseThrow(() -> new UnauthorizedException("Not a participant"));
            p.setLastReadMessageId(request.getLastReadMessageId());
            p.setLastReadAt(LocalDateTime.now());
            participantRepo.save(p);

            List<ChatParticipant> participants = participantRepo.findByTenantIdAndConversationIdAndIsDeletedFalse(convTenant, request.getConversationId());
            broadcastInboxUpdate(request.getConversationId(), participants);
            log.info("Chat read marked conversationId={} userId={}", request.getConversationId(), userId);
        });
    }

    private static boolean isPlatformAdminBridge(String roleA, String roleB) {
        return (Enums.Role.SUPER_ADMIN.name().equals(roleA) && Enums.Role.ADMIN.name().equals(roleB))
                || (Enums.Role.ADMIN.name().equals(roleA) && Enums.Role.SUPER_ADMIN.name().equals(roleB));
    }

    private void validatePlatformBridgePair(Long userIdA, Long userIdB) {
        User ua = userRepository.findByIdAndIsDeletedFalse(userIdA)
                .orElseThrow(() -> new BusinessException("Unknown chat participant"));
        User ub = userRepository.findByIdAndIsDeletedFalse(userIdB)
                .orElseThrow(() -> new BusinessException("Unknown chat participant"));
        if (ua.getRole() == null || ub.getRole() == null || !isPlatformAdminBridge(ua.getRole().name(), ub.getRole().name())) {
            throw new UnauthorizedException("Platform inbox allows only super-admin ↔ school-admin chats");
        }
    }

    private Optional<ChatConversation> findReusableDirectConversation(String convTenant, Long userIdA, Long userIdB) {
        List<ChatConversation> candidates = conversationRepo.findDirectConversationsForUserPair(convTenant, userIdA, userIdB);
        for (ChatConversation c : candidates) {
            List<ChatParticipant> parts = participantRepo.findByTenantIdAndConversationIdAndIsDeletedFalse(convTenant, c.getId());
            if (parts.size() == 2) {
                return Optional.of(c);
            }
        }
        return Optional.empty();
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
                .map(p -> {
                    String displayName = p.getDisplayName();
                    if (displayName == null || displayName.isBlank()) {
                        displayName = userRepository.findByIdAndIsDeletedFalse(p.getUserId())
                                .map(User::getName)
                                .map(String::trim)
                                .filter(s -> !s.isEmpty())
                                .orElse(null);
                    }
                    return new ChatDTOs.ParticipantSummary(p.getUserId(), p.getUserRole(), displayName, null);
                })
                .collect(Collectors.toList()));

        long afterId = 0L;
        ChatParticipant me = participants.stream().filter(x -> x.getUserId().equals(currentUserId)).findFirst().orElse(null);
        if (me != null && me.getLastReadMessageId() != null) {
            afterId = me.getLastReadMessageId();
        }
        long unread = chatMessageStore.countUnreadAfter(tenantId, c.getId(), afterId, currentUserId);
        r.setUnreadCount(unread);
        return r;
    }

    private ChatDTOs.MessageResponse toMessageResponse(ChatMessage m) {
        ChatDTOs.MessageResponse r = new ChatDTOs.MessageResponse();
        r.setId(m.getId());
        r.setConversationId(m.getConversationId());
        r.setSenderUserId(m.getSenderUserId());
        r.setSenderRole(m.getSenderRole());
        String senderName = m.getSenderName();
        if (senderName == null || senderName.isBlank()) {
            senderName = userRepository.findByIdAndIsDeletedFalse(m.getSenderUserId())
                    .map(User::getName)
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .orElse(null);
        }
        r.setSenderName(senderName);
        r.setSenderJobTitle(null);
        r.setBody(m.getBody());
        r.setBodyType(m.getBodyType());
        r.setClientMessageId(m.getClientMessageId());
        r.setCreatedAt(m.getCreatedAt());
        return r;
    }

    private void broadcastInboxUpdate(Long conversationId, List<ChatParticipant> participants) {
        withCrossTenantChatVisibility(() -> {
            ChatConversation conv = conversationRepo.findByIdAndIsDeletedFalse(conversationId).orElse(null);
            if (conv == null) {
                return;
            }
            String convTenant = conv.getTenantId();

            for (ChatParticipant p : participants) {
                try {
                    ChatDTOs.InboxConversationResponse payload = toInboxResponse(convTenant, p.getUserId(), conv, participants);
                    messagingTemplate.convertAndSendToUser(String.valueOf(p.getUserId()), "/queue/chat.inbox", payload);
                } catch (Exception e) {
                    log.warn("Failed to push inbox update conv={} user={}", conversationId, p.getUserId(), e);
                }
            }
        });
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
                       ChatMessageStorePort chatMessageStore,
                       SimpMessagingTemplate messagingTemplate,
                       ChatDirectoryService chatDirectoryService,
                       UserRepository userRepository) {
        this.conversationRepo = conversationRepo;
        this.participantRepo = participantRepo;
        this.chatMessageStore = chatMessageStore;
        this.messagingTemplate = messagingTemplate;
        this.chatDirectoryService = chatDirectoryService;
        this.userRepository = userRepository;
    }
}
