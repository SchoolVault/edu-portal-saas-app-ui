package com.school.erp.modules.academic.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "school_classes", indexes = {@Index(name = "idx_class_tenant", columnNames = "tenant_id")})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SchoolClass extends BaseEntity {
    @Column(nullable = false, length = 50) private String name;
    @Column(nullable = false) private Integer grade;
    @Column(name = "class_teacher_id") private Long classTeacherId;
    @Column(name = "class_teacher_name", length = 200) private String classTeacherName;
    @Column(name = "academic_year_id", nullable = false) private Long academicYearId;
}
