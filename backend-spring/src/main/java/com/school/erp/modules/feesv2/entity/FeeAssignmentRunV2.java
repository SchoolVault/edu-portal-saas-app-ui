package com.school.erp.modules.feesv2.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "fee_assignment_run_v2", indexes = {
        @Index(name = "idx_fee_assignment_run_tenant_year", columnList = "tenant_id, academic_year_id")
})
public class FeeAssignmentRunV2 extends FeeV2AcademicYearEntity {
    @Column(name = "idempotency_key", nullable = false, length = 120)
    private String idempotencyKey;

    @Column(name = "cohort_class_id")
    private Long cohortClassId;

    @Column(name = "cohort_section_id")
    private Long cohortSectionId;

    @Column(name = "student_ids_json", columnDefinition = "json")
    private String studentIdsJson;

    @Column(name = "maps_applied", nullable = false)
    private Integer mapsApplied = 0;

    @Column(name = "students_skipped", nullable = false)
    private Integer studentsSkipped = 0;

    @Column(name = "run_metadata_json", columnDefinition = "json")
    private String runMetadataJson;
}
