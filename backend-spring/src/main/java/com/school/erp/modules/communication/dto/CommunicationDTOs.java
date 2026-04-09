package com.school.erp.modules.communication.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CommunicationDTOs {

    public static class SendMessageRequest {
        @NotNull
        private Long receiverId;
        private String receiverName;
        private String senderName;
        @NotBlank
        private String content;


        public static class SendMessageRequestBuilder {
            private Long receiverId;
            private String receiverName;
            private String senderName;
            private String content;

            SendMessageRequestBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public CommunicationDTOs.SendMessageRequest.SendMessageRequestBuilder receiverId(final Long receiverId) {
                this.receiverId = receiverId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public CommunicationDTOs.SendMessageRequest.SendMessageRequestBuilder receiverName(final String receiverName) {
                this.receiverName = receiverName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public CommunicationDTOs.SendMessageRequest.SendMessageRequestBuilder senderName(final String senderName) {
                this.senderName = senderName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public CommunicationDTOs.SendMessageRequest.SendMessageRequestBuilder content(final String content) {
                this.content = content;
                return this;
            }

            public CommunicationDTOs.SendMessageRequest build() {
                return new CommunicationDTOs.SendMessageRequest(this.receiverId, this.receiverName, this.senderName, this.content);
            }

            @Override
            public String toString() {
                return "CommunicationDTOs.SendMessageRequest.SendMessageRequestBuilder(receiverId=" + this.receiverId + ", receiverName=" + this.receiverName + ", senderName=" + this.senderName + ", content=" + this.content + ")";
            }
        }

        public static CommunicationDTOs.SendMessageRequest.SendMessageRequestBuilder builder() {
            return new CommunicationDTOs.SendMessageRequest.SendMessageRequestBuilder();
        }

        public Long getReceiverId() {
            return this.receiverId;
        }

        public String getReceiverName() {
            return this.receiverName;
        }

        public String getSenderName() {
            return this.senderName;
        }

        public String getContent() {
            return this.content;
        }

        public void setReceiverId(final Long receiverId) {
            this.receiverId = receiverId;
        }

        public void setReceiverName(final String receiverName) {
            this.receiverName = receiverName;
        }

        public void setSenderName(final String senderName) {
            this.senderName = senderName;
        }

        public void setContent(final String content) {
            this.content = content;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof CommunicationDTOs.SendMessageRequest)) return false;
            final CommunicationDTOs.SendMessageRequest other = (CommunicationDTOs.SendMessageRequest) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$receiverId = this.getReceiverId();
            final Object other$receiverId = other.getReceiverId();
            if (this$receiverId == null ? other$receiverId != null : !this$receiverId.equals(other$receiverId)) return false;
            final Object this$receiverName = this.getReceiverName();
            final Object other$receiverName = other.getReceiverName();
            if (this$receiverName == null ? other$receiverName != null : !this$receiverName.equals(other$receiverName)) return false;
            final Object this$senderName = this.getSenderName();
            final Object other$senderName = other.getSenderName();
            if (this$senderName == null ? other$senderName != null : !this$senderName.equals(other$senderName)) return false;
            final Object this$content = this.getContent();
            final Object other$content = other.getContent();
            if (this$content == null ? other$content != null : !this$content.equals(other$content)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof CommunicationDTOs.SendMessageRequest;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $receiverId = this.getReceiverId();
            result = result * PRIME + ($receiverId == null ? 43 : $receiverId.hashCode());
            final Object $receiverName = this.getReceiverName();
            result = result * PRIME + ($receiverName == null ? 43 : $receiverName.hashCode());
            final Object $senderName = this.getSenderName();
            result = result * PRIME + ($senderName == null ? 43 : $senderName.hashCode());
            final Object $content = this.getContent();
            result = result * PRIME + ($content == null ? 43 : $content.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "CommunicationDTOs.SendMessageRequest(receiverId=" + this.getReceiverId() + ", receiverName=" + this.getReceiverName() + ", senderName=" + this.getSenderName() + ", content=" + this.getContent() + ")";
        }

        public SendMessageRequest() {
        }

        public SendMessageRequest(final Long receiverId, final String receiverName, final String senderName, final String content) {
            this.receiverId = receiverId;
            this.receiverName = receiverName;
            this.senderName = senderName;
            this.content = content;
        }
    }


    public static class MessageResponse {
        private Long id;
        private Long senderId;
        private String senderName;
        private String senderRole;
        private Long receiverId;
        private String receiverName;
        private String content;
        private Boolean isRead;
        private String timestamp;


        public static class MessageResponseBuilder {
            private Long id;
            private Long senderId;
            private String senderName;
            private String senderRole;
            private Long receiverId;
            private String receiverName;
            private String content;
            private Boolean isRead;
            private String timestamp;

            MessageResponseBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public CommunicationDTOs.MessageResponse.MessageResponseBuilder id(final Long id) {
                this.id = id;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public CommunicationDTOs.MessageResponse.MessageResponseBuilder senderId(final Long senderId) {
                this.senderId = senderId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public CommunicationDTOs.MessageResponse.MessageResponseBuilder senderName(final String senderName) {
                this.senderName = senderName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public CommunicationDTOs.MessageResponse.MessageResponseBuilder senderRole(final String senderRole) {
                this.senderRole = senderRole;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public CommunicationDTOs.MessageResponse.MessageResponseBuilder receiverId(final Long receiverId) {
                this.receiverId = receiverId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public CommunicationDTOs.MessageResponse.MessageResponseBuilder receiverName(final String receiverName) {
                this.receiverName = receiverName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public CommunicationDTOs.MessageResponse.MessageResponseBuilder content(final String content) {
                this.content = content;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public CommunicationDTOs.MessageResponse.MessageResponseBuilder isRead(final Boolean isRead) {
                this.isRead = isRead;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public CommunicationDTOs.MessageResponse.MessageResponseBuilder timestamp(final String timestamp) {
                this.timestamp = timestamp;
                return this;
            }

            public CommunicationDTOs.MessageResponse build() {
                return new CommunicationDTOs.MessageResponse(this.id, this.senderId, this.senderName, this.senderRole, this.receiverId, this.receiverName, this.content, this.isRead, this.timestamp);
            }

            @Override
            public String toString() {
                return "CommunicationDTOs.MessageResponse.MessageResponseBuilder(id=" + this.id + ", senderId=" + this.senderId + ", senderName=" + this.senderName + ", senderRole=" + this.senderRole + ", receiverId=" + this.receiverId + ", receiverName=" + this.receiverName + ", content=" + this.content + ", isRead=" + this.isRead + ", timestamp=" + this.timestamp + ")";
            }
        }

        public static CommunicationDTOs.MessageResponse.MessageResponseBuilder builder() {
            return new CommunicationDTOs.MessageResponse.MessageResponseBuilder();
        }

        public Long getId() {
            return this.id;
        }

        public Long getSenderId() {
            return this.senderId;
        }

        public String getSenderName() {
            return this.senderName;
        }

        public String getSenderRole() {
            return this.senderRole;
        }

        public Long getReceiverId() {
            return this.receiverId;
        }

        public String getReceiverName() {
            return this.receiverName;
        }

        public String getContent() {
            return this.content;
        }

        public Boolean getIsRead() {
            return this.isRead;
        }

        public String getTimestamp() {
            return this.timestamp;
        }

        public void setId(final Long id) {
            this.id = id;
        }

        public void setSenderId(final Long senderId) {
            this.senderId = senderId;
        }

        public void setSenderName(final String senderName) {
            this.senderName = senderName;
        }

        public void setSenderRole(final String senderRole) {
            this.senderRole = senderRole;
        }

        public void setReceiverId(final Long receiverId) {
            this.receiverId = receiverId;
        }

        public void setReceiverName(final String receiverName) {
            this.receiverName = receiverName;
        }

        public void setContent(final String content) {
            this.content = content;
        }

        public void setIsRead(final Boolean isRead) {
            this.isRead = isRead;
        }

        public void setTimestamp(final String timestamp) {
            this.timestamp = timestamp;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof CommunicationDTOs.MessageResponse)) return false;
            final CommunicationDTOs.MessageResponse other = (CommunicationDTOs.MessageResponse) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$id = this.getId();
            final Object other$id = other.getId();
            if (this$id == null ? other$id != null : !this$id.equals(other$id)) return false;
            final Object this$senderId = this.getSenderId();
            final Object other$senderId = other.getSenderId();
            if (this$senderId == null ? other$senderId != null : !this$senderId.equals(other$senderId)) return false;
            final Object this$receiverId = this.getReceiverId();
            final Object other$receiverId = other.getReceiverId();
            if (this$receiverId == null ? other$receiverId != null : !this$receiverId.equals(other$receiverId)) return false;
            final Object this$isRead = this.getIsRead();
            final Object other$isRead = other.getIsRead();
            if (this$isRead == null ? other$isRead != null : !this$isRead.equals(other$isRead)) return false;
            final Object this$senderName = this.getSenderName();
            final Object other$senderName = other.getSenderName();
            if (this$senderName == null ? other$senderName != null : !this$senderName.equals(other$senderName)) return false;
            final Object this$senderRole = this.getSenderRole();
            final Object other$senderRole = other.getSenderRole();
            if (this$senderRole == null ? other$senderRole != null : !this$senderRole.equals(other$senderRole)) return false;
            final Object this$receiverName = this.getReceiverName();
            final Object other$receiverName = other.getReceiverName();
            if (this$receiverName == null ? other$receiverName != null : !this$receiverName.equals(other$receiverName)) return false;
            final Object this$content = this.getContent();
            final Object other$content = other.getContent();
            if (this$content == null ? other$content != null : !this$content.equals(other$content)) return false;
            final Object this$timestamp = this.getTimestamp();
            final Object other$timestamp = other.getTimestamp();
            if (this$timestamp == null ? other$timestamp != null : !this$timestamp.equals(other$timestamp)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof CommunicationDTOs.MessageResponse;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $id = this.getId();
            result = result * PRIME + ($id == null ? 43 : $id.hashCode());
            final Object $senderId = this.getSenderId();
            result = result * PRIME + ($senderId == null ? 43 : $senderId.hashCode());
            final Object $receiverId = this.getReceiverId();
            result = result * PRIME + ($receiverId == null ? 43 : $receiverId.hashCode());
            final Object $isRead = this.getIsRead();
            result = result * PRIME + ($isRead == null ? 43 : $isRead.hashCode());
            final Object $senderName = this.getSenderName();
            result = result * PRIME + ($senderName == null ? 43 : $senderName.hashCode());
            final Object $senderRole = this.getSenderRole();
            result = result * PRIME + ($senderRole == null ? 43 : $senderRole.hashCode());
            final Object $receiverName = this.getReceiverName();
            result = result * PRIME + ($receiverName == null ? 43 : $receiverName.hashCode());
            final Object $content = this.getContent();
            result = result * PRIME + ($content == null ? 43 : $content.hashCode());
            final Object $timestamp = this.getTimestamp();
            result = result * PRIME + ($timestamp == null ? 43 : $timestamp.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "CommunicationDTOs.MessageResponse(id=" + this.getId() + ", senderId=" + this.getSenderId() + ", senderName=" + this.getSenderName() + ", senderRole=" + this.getSenderRole() + ", receiverId=" + this.getReceiverId() + ", receiverName=" + this.getReceiverName() + ", content=" + this.getContent() + ", isRead=" + this.getIsRead() + ", timestamp=" + this.getTimestamp() + ")";
        }

        public MessageResponse() {
        }

        public MessageResponse(final Long id, final Long senderId, final String senderName, final String senderRole, final Long receiverId, final String receiverName, final String content, final Boolean isRead, final String timestamp) {
            this.id = id;
            this.senderId = senderId;
            this.senderName = senderName;
            this.senderRole = senderRole;
            this.receiverId = receiverId;
            this.receiverName = receiverName;
            this.content = content;
            this.isRead = isRead;
            this.timestamp = timestamp;
        }
    }
}
