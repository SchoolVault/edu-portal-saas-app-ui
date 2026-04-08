package com.school.erp.modules.timetable.entity;
import com.school.erp.common.entity.BaseEntity; import com.school.erp.common.enums.Enums;
import jakarta.persistence.*; import lombok.*; import java.time.LocalTime;

@Entity @Table(name = "timetable_entries", indexes = {
    @Index(name = "idx_tt_class_section", columnNames = {"tenant_id", "class_id", "section_id"}),
    @Index(name = "idx_tt_teacher", columnNames = {"tenant_id", "teacher_id"})
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class TimetableEntry extends BaseEntity {
    @Column(name = "class_id", nullable = false) private Long classId;
    @Column(name = "section_id", nullable = false) private Long sectionId;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 10) private Enums.DayOfWeek day;
    @Column(nullable = false) private Integer period;
    @Column(name = "start_time") private LocalTime startTime;
    @Column(name = "end_time") private LocalTime endTime;
    @Column(name = "subject_name", nullable = false, length = 100) private String subjectName;
    @Column(name = "teacher_id") private Long teacherId;
    @Column(name = "teacher_name", length = 200) private String teacherName;
    @Column(length = 50) private String room;
}
