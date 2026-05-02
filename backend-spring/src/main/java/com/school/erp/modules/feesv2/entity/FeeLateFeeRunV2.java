package com.school.erp.modules.feesv2.entity;

import com.school.erp.modules.feesv2.domain.FeeV2Enums.LateFeeRunStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Setter
@Entity
@Table(name = "fee_late_fee_run_v2", indexes = {
        @Index(name = "idx_late_fee_run_policy", columnList = "tenant_id, academic_year_id, fee_late_fee_policy_id")
})
public class FeeLateFeeRunV2 extends FeeV2AcademicYearEntity {
    @Column(name = "fee_late_fee_policy_id", nullable = false)
    private Long feeLateFeePolicyId;

    @Column(name = "as_of_date", nullable = false)
    private LocalDate asOfDate;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "status", nullable = false, length = 20)
    private LateFeeRunStatus status = LateFeeRunStatus.INITIATED;

    @Column(name = "idempotency_key", nullable = false, length = 120)
    private String idempotencyKey;

    @Column(name = "demands_updated", nullable = false)
    private Integer demandsUpdated = 0;

    @Column(name = "run_metadata_json", columnDefinition = "json")
    private String runMetadataJson;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt = LocalDateTime.now();

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;
}
