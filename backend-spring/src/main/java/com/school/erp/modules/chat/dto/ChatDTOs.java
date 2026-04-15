package com.school.erp.modules.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

public class ChatDTOs {
    public static class InboxConversationResponse {
        private Long conversationId;
        private String type;
        private String subject;
        private String contextType;
        private Long contextId;
        private LocalDateTime lastMessageAt;
        private String lastMessagePreview;
        private List<ParticipantSummary> participants;
        private long unreadCount;
        /** Optional UI hint for the non-self participant (role + up to N linked students). Mirrors frontend {@code ChatCounterpartInsight}. */
        private CounterpartInsight counterpartInsight;

        public Long getConversationId() { return conversationId; }
        public void setConversationId(Long conversationId) { this.conversationId = conversationId; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        public String getContextType() { return contextType; }
        public void setContextType(String contextType) { this.contextType = contextType; }
        public Long getContextId() { return contextId; }
        public void setContextId(Long contextId) { this.contextId = contextId; }
        public LocalDateTime getLastMessageAt() { return lastMessageAt; }
        public void setLastMessageAt(LocalDateTime lastMessageAt) { this.lastMessageAt = lastMessageAt; }
        public String getLastMessagePreview() { return lastMessagePreview; }
        public void setLastMessagePreview(String lastMessagePreview) { this.lastMessagePreview = lastMessagePreview; }
        public List<ParticipantSummary> getParticipants() { return participants; }
        public void setParticipants(List<ParticipantSummary> participants) { this.participants = participants; }
        public long getUnreadCount() { return unreadCount; }
        public void setUnreadCount(long unreadCount) { this.unreadCount = unreadCount; }
        public CounterpartInsight getCounterpartInsight() { return counterpartInsight; }
        public void setCounterpartInsight(CounterpartInsight counterpartInsight) { this.counterpartInsight = counterpartInsight; }
    }

    public static class LinkedStudentBrief {
        private Long studentId;
        private String studentName;
        private String classShort;

        public Long getStudentId() { return studentId; }
        public void setStudentId(Long studentId) { this.studentId = studentId; }
        public String getStudentName() { return studentName; }
        public void setStudentName(String studentName) { this.studentName = studentName; }
        public String getClassShort() { return classShort; }
        public void setClassShort(String classShort) { this.classShort = classShort; }
    }

    public static class CounterpartInsight {
        private String roleCode;
        private List<LinkedStudentBrief> linkedStudents;
        private Integer linkedStudentTotal;

        public String getRoleCode() { return roleCode; }
        public void setRoleCode(String roleCode) { this.roleCode = roleCode; }
        public List<LinkedStudentBrief> getLinkedStudents() { return linkedStudents; }
        public void setLinkedStudents(List<LinkedStudentBrief> linkedStudents) { this.linkedStudents = linkedStudents; }
        public Integer getLinkedStudentTotal() { return linkedStudentTotal; }
        public void setLinkedStudentTotal(Integer linkedStudentTotal) { this.linkedStudentTotal = linkedStudentTotal; }
    }

    public static class ParticipantSummary {
        private Long userId;
        private String userRole;
        private String displayName;
        /** Optional professional caption (e.g. Principal) for inbox headings — may be null; UI can fall back to role. */
        private String jobTitle;

        public ParticipantSummary() {}
        public ParticipantSummary(Long userId, String userRole, String displayName) {
            this.userId = userId;
            this.userRole = userRole;
            this.displayName = displayName;
        }

        public ParticipantSummary(Long userId, String userRole, String displayName, String jobTitle) {
            this.userId = userId;
            this.userRole = userRole;
            this.displayName = displayName;
            this.jobTitle = jobTitle;
        }

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public String getUserRole() { return userRole; }
        public void setUserRole(String userRole) { this.userRole = userRole; }
        public String getDisplayName() { return displayName; }
        public void setDisplayName(String displayName) { this.displayName = displayName; }
        public String getJobTitle() { return jobTitle; }
        public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
    }

    public static class CreateConversationRequest {
        @NotBlank
        private String type; // direct | group
        private String subject;
        private String contextType;
        private Long contextId;
        @NotEmpty
        private List<CreateParticipant> participants;

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        public String getContextType() { return contextType; }
        public void setContextType(String contextType) { this.contextType = contextType; }
        public Long getContextId() { return contextId; }
        public void setContextId(Long contextId) { this.contextId = contextId; }
        public List<CreateParticipant> getParticipants() { return participants; }
        public void setParticipants(List<CreateParticipant> participants) { this.participants = participants; }
    }

    public static class CreateParticipant {
        @NotNull
        private Long userId;
        @NotBlank
        private String userRole;
        private String displayName;

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public String getUserRole() { return userRole; }
        public void setUserRole(String userRole) { this.userRole = userRole; }
        public String getDisplayName() { return displayName; }
        public void setDisplayName(String displayName) { this.displayName = displayName; }
    }

    public static class SendMessageRequest {
        @NotNull
        private Long conversationId;
        @NotBlank
        private String body;
        private String clientMessageId;

        public Long getConversationId() { return conversationId; }
        public void setConversationId(Long conversationId) { this.conversationId = conversationId; }
        public String getBody() { return body; }
        public void setBody(String body) { this.body = body; }
        public String getClientMessageId() { return clientMessageId; }
        public void setClientMessageId(String clientMessageId) { this.clientMessageId = clientMessageId; }
    }

    public static class MessageResponse {
        private Long id;
        private Long conversationId;
        private Long senderUserId;
        private String senderRole;
        private String senderName;
        /** Optional caption for message bubbles (e.g. job title); UI may derive from role when absent. */
        private String senderJobTitle;
        private String body;
        private String bodyType;
        private String clientMessageId;
        private LocalDateTime createdAt;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getConversationId() { return conversationId; }
        public void setConversationId(Long conversationId) { this.conversationId = conversationId; }
        public Long getSenderUserId() { return senderUserId; }
        public void setSenderUserId(Long senderUserId) { this.senderUserId = senderUserId; }
        public String getSenderRole() { return senderRole; }
        public void setSenderRole(String senderRole) { this.senderRole = senderRole; }
        public String getSenderName() { return senderName; }
        public void setSenderName(String senderName) { this.senderName = senderName; }
        public String getSenderJobTitle() { return senderJobTitle; }
        public void setSenderJobTitle(String senderJobTitle) { this.senderJobTitle = senderJobTitle; }
        public String getBody() { return body; }
        public void setBody(String body) { this.body = body; }
        public String getBodyType() { return bodyType; }
        public void setBodyType(String bodyType) { this.bodyType = bodyType; }
        public String getClientMessageId() { return clientMessageId; }
        public void setClientMessageId(String clientMessageId) { this.clientMessageId = clientMessageId; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    }

    public static class MarkReadRequest {
        @NotNull
        private Long conversationId;
        @NotNull
        private Long lastReadMessageId;

        public Long getConversationId() { return conversationId; }
        public void setConversationId(Long conversationId) { this.conversationId = conversationId; }
        public Long getLastReadMessageId() { return lastReadMessageId; }
        public void setLastReadMessageId(Long lastReadMessageId) { this.lastReadMessageId = lastReadMessageId; }
    }
}

