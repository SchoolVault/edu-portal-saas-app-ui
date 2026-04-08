package com.school.erp.modules.academic.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity @Table(name = "academic_years", indexes = {@Index(name = "idx_ay_tenant", columnNames = "tenant_id")})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AcademicYear extends BaseEntity {
    @Column(nullable = false, length = 50) private String name;
    @Column(name = "start_date", nullable = false) private LocalDate startDate;
    @Column(name = "end_date", nullable = false) private LocalDate endDate;
    @Column(name = "is_current") private Boolean isCurrent = false;
}
