package com.school.erp.modules.documents.entity;
import com.school.erp.common.entity.BaseEntity; import com.school.erp.common.enums.Enums;
import jakarta.persistence.*; import lombok.*;
@Entity @Table(name = "documents") @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Document extends BaseEntity {
    @Column(nullable = false, length = 200) private String name;
    @Column(name = "file_type", length = 20) private String fileType;
    @Enumerated(EnumType.STRING) @Column(length = 20) private Enums.DocumentCategory category;
    @Column(name = "uploaded_by", length = 100) private String uploadedBy;
    @Column(name = "file_size", length = 20) private String fileSize;
    @Column(name = "file_url", length = 500) private String fileUrl;
    @Column(name = "related_entity_id") private Long relatedEntityId;
    @Column(name = "related_entity_type", length = 50) private String relatedEntityType;
}
