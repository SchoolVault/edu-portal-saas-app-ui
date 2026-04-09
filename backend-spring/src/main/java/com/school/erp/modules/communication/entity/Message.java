package com.school.erp.modules.communication.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "messages", indexes = {@Index(name = "idx_msg_sender", columnList = "tenant_id, sender_id"), @Index(name = "idx_msg_receiver", columnList = "tenant_id, receiver_id")})
public class Message extends BaseEntity {
    @Column(name = "sender_id", nullable = false)
    private Long senderId;
    @Column(name = "sender_name", length = 200)
    private String senderName;
    @Column(name = "sender_role", length = 20)
    private String senderRole;
    @Column(name = "receiver_id", nullable = false)
    private Long receiverId;
    @Column(name = "receiver_name", length = 200)
    private String receiverName;
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;
    @Column(name = "is_read")
    private Boolean isRead = false;


    public static class MessageBuilder {
        private Long senderId;
        private String senderName;
        private String senderRole;
        private Long receiverId;
        private String receiverName;
        private String content;
        private Boolean isRead;

        MessageBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public Message.MessageBuilder senderId(final Long senderId) {
            this.senderId = senderId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Message.MessageBuilder senderName(final String senderName) {
            this.senderName = senderName;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Message.MessageBuilder senderRole(final String senderRole) {
            this.senderRole = senderRole;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Message.MessageBuilder receiverId(final Long receiverId) {
            this.receiverId = receiverId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Message.MessageBuilder receiverName(final String receiverName) {
            this.receiverName = receiverName;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Message.MessageBuilder content(final String content) {
            this.content = content;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Message.MessageBuilder isRead(final Boolean isRead) {
            this.isRead = isRead;
            return this;
        }

        public Message build() {
            return new Message(this.senderId, this.senderName, this.senderRole, this.receiverId, this.receiverName, this.content, this.isRead);
        }

        @Override
        public String toString() {
            return "Message.MessageBuilder(senderId=" + this.senderId + ", senderName=" + this.senderName + ", senderRole=" + this.senderRole + ", receiverId=" + this.receiverId + ", receiverName=" + this.receiverName + ", content=" + this.content + ", isRead=" + this.isRead + ")";
        }
    }

    public static Message.MessageBuilder builder() {
        return new Message.MessageBuilder();
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

    public Message() {
    }

    public Message(final Long senderId, final String senderName, final String senderRole, final Long receiverId, final String receiverName, final String content, final Boolean isRead) {
        this.senderId = senderId;
        this.senderName = senderName;
        this.senderRole = senderRole;
        this.receiverId = receiverId;
        this.receiverName = receiverName;
        this.content = content;
        this.isRead = isRead;
    }
}
