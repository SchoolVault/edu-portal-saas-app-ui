package com.school.erp.modules.attendance.entity;
import com.school.erp.common.entity.BaseEntity; import com.school.erp.common.enums.Enums;
import jakarta.persistence.*; import lombok.*; import java.time.LocalDate;

@Entity @Table(name = "attendance_records", indexes = {
    @Index(name = "idx_att_tenant_class_date", columnNames = {"tenant_id", "class_id", "date"}),
    @Index(name = "idx_att_student_date", columnNames = {"tenant_id", "student_id", "date"})
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AttendanceRecord extends BaseEntity {
    @Column(name = "student_id", nullable = false) private Long studentId;
    @Column(name = "student_name", length = 200) private String studentName;
    @Column(name = "class_id", nullable = false) private Long classId;
    @Column(name = "section_id", nullable = false) private Long sectionId;
    @Column(nullable = false) private LocalDate date;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 10) private Enums.AttendanceStatus status;
    @Column(name = "marked_by") private Long markedBy;
    @Column(length = 500) private String remarks;
}
