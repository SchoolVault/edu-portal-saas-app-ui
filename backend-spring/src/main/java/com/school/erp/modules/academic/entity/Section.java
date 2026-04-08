package com.school.erp.modules.academic.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "sections", indexes = {
    @Index(name = "idx_section_class", columnNames = {"tenant_id", "class_id"})
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Section extends BaseEntity {
    @Column(nullable = false, length = 10) private String name;
    @Column(name = "class_id", nullable = false) private Long classId;
    @Column(nullable = false) private Integer capacity;
    @Column(name = "student_count") private Integer studentCount = 0;
}
