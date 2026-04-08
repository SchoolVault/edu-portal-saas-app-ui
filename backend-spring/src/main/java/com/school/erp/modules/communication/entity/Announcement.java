package com.school.erp.modules.communication.entity;
import com.school.erp.common.entity.BaseEntity; import com.school.erp.common.enums.Enums;
import jakarta.persistence.*; import lombok.*;
@Entity @Table(name = "announcements", indexes = {@Index(name = "idx_ann_tenant", columnNames = "tenant_id")})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Announcement extends BaseEntity {
    @Column(nullable = false, length = 200) private String title;
    @Column(columnDefinition = "TEXT") private String content;
    @Column(length = 200) private String author;
    @Column(name = "author_role", length = 20) private String authorRole;
    @Enumerated(EnumType.STRING) @Column(name = "target_audience", length = 20) private Enums.TargetAudience targetAudience;
    @Column(name = "target_class_id") private Long targetClassId;
}
