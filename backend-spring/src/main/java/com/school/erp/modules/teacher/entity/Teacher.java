package com.school.erp.modules.teacher.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.enums.Enums;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "teachers", indexes = {
        @Index(name = "idx_teacher_tenant", columnNames = "tenant_id")
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Teacher extends BaseEntity {
    @Column(name = "first_name", nullable = false, length = 100) private String firstName;
    @Column(name = "last_name", nullable = false, length = 100) private String lastName;
    @Column(nullable = false, length = 150) private String email;
    @Column(length = 20) private String phone;
    @Column(length = 200) private String qualification;
    @Column(length = 100) private String specialization;
    @Column(name = "join_date") private LocalDate joinDate;
    @Column(precision = 12, scale = 2) private BigDecimal salary;
    @Enumerated(EnumType.STRING) @Column(length = 20) private Enums.TeacherStatus status;
    @Column(length = 500) private String avatar;
    @Column(name = "user_id") private Long userId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "teacher_subjects", joinColumns = @JoinColumn(name = "teacher_id"))
    @Column(name = "subject")
    private List<String> subjects;
}
