package com.school.erp.modules.feesv2.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "student_fee_structure_map", indexes = {
        @Index(name = "idx_sfsm_student_active", columnList = "tenant_id, academic_year_id, student_id, is_deleted, is_active"),
        @Index(name = "idx_sfsm_structure", columnList = "tenant_id, academic_year_id, fee_structure_id, is_deleted")
})
public class StudentFeeStructureMapV2 extends FeeV2AcademicYearEntity {
    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "class_id", nullable = false)
    private Long classId;

    @Column(name = "fee_structure_id", nullable = false)
    private Long feeStructureId;

    @Column(name = "frozen_version_no", nullable = false)
    private Integer frozenVersionNo;

    @Column(name = "assignment_source", nullable = false, length = 30)
    private String assignmentSource;

    @Column(name = "assigned_at", nullable = false)
    private LocalDateTime assignedAt;

    @Column(name = "valid_from", nullable = false)
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    @Column(name = "snapshot_json", nullable = false, columnDefinition = "json")
    private String snapshotJson;
}
