package com.school.erp.modules.feesv2.entity;

import com.school.erp.modules.feesv2.domain.FeeV2Enums.DemandRunStatus;
import com.school.erp.modules.feesv2.domain.FeeV2Enums.DemandRunType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Setter
@Entity
@Table(name = "fee_demand_run", indexes = {
        @Index(name = "idx_fee_demand_run_period", columnList = "tenant_id, academic_year_id, period_key, status")
})
public class FeeDemandRunV2 extends FeeV2AcademicYearEntity {
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "run_type", nullable = false, length = 20)
    private DemandRunType runType;

    @Column(name = "period_key", nullable = false, length = 20)
    private String periodKey;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "status", nullable = false, length = 20)
    private DemandRunStatus status = DemandRunStatus.INITIATED;

    @Column(name = "trigger_source", nullable = false, length = 30)
    private String triggerSource;

    @Column(name = "triggered_by_user_id")
    private Long triggeredByUserId;

    @Column(name = "idempotency_key", nullable = false, length = 120)
    private String idempotencyKey;

    @Column(name = "run_metadata_json", columnDefinition = "json")
    private String runMetadataJson;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;
}
