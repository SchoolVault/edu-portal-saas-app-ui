package com.school.erp.modules.student.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.enums.Enums;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "students", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"tenant_id", "admission_number"}),
        @UniqueConstraint(columnNames = {"tenant_id", "email"})
}, indexes = {
        @Index(name = "idx_student_tenant", columnNames = "tenant_id"),
        @Index(name = "idx_student_class", columnNames = {"tenant_id", "class_id"}),
        @Index(name = "idx_student_section", columnNames = {"tenant_id", "class_id", "section_id"})
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Student extends BaseEntity {

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(length = 150)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Enums.Gender gender;

    @Column(name = "class_id")
    private Long classId;

    @Column(name = "section_id")
    private Long sectionId;

    @Column(name = "roll_number", length = 20)
    private String rollNumber;

    @Column(name = "admission_number", nullable = false, length = 50)
    private String admissionNumber;

    @Column(name = "admission_date")
    private LocalDate admissionDate;

    @Column(name = "parent_id")
    private Long parentId;

    @Column(name = "parent_name", length = 200)
    private String parentName;

    @Column(length = 500)
    private String address;

    @Column(name = "blood_group", length = 5)
    private String bloodGroup;

    @Column(length = 500)
    private String avatar;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Enums.StudentStatus status;

    // Transient fields for response enrichment
    @Transient
    private String className;
    @Transient
    private String sectionName;
}
