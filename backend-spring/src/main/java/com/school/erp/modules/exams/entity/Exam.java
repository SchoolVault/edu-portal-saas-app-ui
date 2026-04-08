package com.school.erp.modules.exams.entity;
import com.school.erp.common.entity.BaseEntity; import com.school.erp.common.enums.Enums;
import jakarta.persistence.*; import lombok.*; import java.time.LocalDate;

@Entity @Table(name = "exams", indexes = {@Index(name = "idx_exam_tenant", columnNames = "tenant_id")})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Exam extends BaseEntity {
    @Column(nullable = false, length = 100) private String name;
    @Column(name = "academic_year_id") private Long academicYearId;
    @Column(name = "start_date") private LocalDate startDate;
    @Column(name = "end_date") private LocalDate endDate;
    @Enumerated(EnumType.STRING) @Column(length = 20) private Enums.ExamStatus status;
}
