package com.school.erp.modules.exams.entity;
import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.*; import lombok.*;

@Entity @Table(name = "mark_records", indexes = {
    @Index(name = "idx_marks_exam", columnNames = {"tenant_id", "exam_id"}),
    @Index(name = "idx_marks_student", columnNames = {"tenant_id", "student_id"})
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class MarkRecord extends BaseEntity {
    @Column(name = "exam_id", nullable = false) private Long examId;
    @Column(name = "student_id", nullable = false) private Long studentId;
    @Column(name = "student_name", length = 200) private String studentName;
    @Column(name = "subject_name", nullable = false, length = 100) private String subjectName;
    @Column(name = "marks_obtained", nullable = false) private Double marksObtained;
    @Column(name = "max_marks", nullable = false) private Double maxMarks;
    @Column(length = 5) private String grade;
    @Column(name = "class_id") private Long classId;
}
