package com.school.erp.modules.feesv2.entity;

import com.school.erp.modules.feesv2.domain.FeeV2Enums.RefundStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Setter
@Entity
@Table(name = "fee_refund_v2", indexes = {
        @Index(name = "idx_fee_refund_v2_student", columnList = "tenant_id, academic_year_id, student_id, is_deleted")
})
public class FeeRefundV2 extends FeeV2AcademicYearEntity {
    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "refund_no", nullable = false, length = 80)
    private String refundNo;

    @Column(name = "amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "refund_status", nullable = false, length = 20)
    private RefundStatus refundStatus = RefundStatus.SUCCESS;

    @Column(name = "approval_status", nullable = false, length = 20)
    private String approvalStatus = "APPROVED";

    @Column(name = "idempotency_key", nullable = false, length = 120)
    private String idempotencyKey;

    @Column(name = "reason", length = 255)
    private String reason;

    @Column(name = "related_payment_id")
    private Long relatedPaymentId;
}
