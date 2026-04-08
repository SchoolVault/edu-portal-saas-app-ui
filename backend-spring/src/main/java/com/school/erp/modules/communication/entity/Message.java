package com.school.erp.modules.communication.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "messages", indexes = {
    @Index(name = "idx_msg_sender", columnNames = {"tenant_id", "sender_id"}),
    @Index(name = "idx_msg_receiver", columnNames = {"tenant_id", "receiver_id"})
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Message extends BaseEntity {
    @Column(name = "sender_id", nullable = false) private Long senderId;
    @Column(name = "sender_name", length = 200) private String senderName;
    @Column(name = "sender_role", length = 20) private String senderRole;
    @Column(name = "receiver_id", nullable = false) private Long receiverId;
    @Column(name = "receiver_name", length = 200) private String receiverName;
    @Column(columnDefinition = "TEXT", nullable = false) private String content;
    @Column(name = "is_read") private Boolean isRead = false;
}
