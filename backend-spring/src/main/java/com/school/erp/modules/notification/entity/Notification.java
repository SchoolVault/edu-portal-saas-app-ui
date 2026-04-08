package com.school.erp.modules.notification.entity;
import com.school.erp.common.entity.BaseEntity; import com.school.erp.common.enums.Enums;
import jakarta.persistence.*; import lombok.*;
@Entity @Table(name = "notifications", indexes = {
    @Index(name = "idx_notif_user", columnNames = {"tenant_id", "user_id"}),
    @Index(name = "idx_notif_read", columnNames = {"tenant_id", "user_id", "is_read"})
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Notification extends BaseEntity {
    @Column(nullable = false, length = 200) private String title;
    @Column(length = 500) private String message;
    @Enumerated(EnumType.STRING) @Column(length = 10) private Enums.NotificationType type;
    @Column(name = "is_read") private Boolean isRead = false;
    @Column(name = "user_id", nullable = false) private Long userId;
    @Column(length = 300) private String link;
}
