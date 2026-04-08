package com.school.erp.modules.communication.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

public class CommunicationDTOs {
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SendMessageRequest {
        @NotNull private Long receiverId;
        private String receiverName;
        private String senderName;
        @NotBlank private String content;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MessageResponse {
        private Long id; private Long senderId; private String senderName; private String senderRole;
        private Long receiverId; private String receiverName;
        private String content; private Boolean isRead; private String timestamp;
    }
}
