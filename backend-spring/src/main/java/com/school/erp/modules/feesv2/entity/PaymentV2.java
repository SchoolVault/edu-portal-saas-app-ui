package com.school.erp.modules.feesv2.entity;

import com.school.erp.modules.feesv2.domain.FeeV2Enums.PaymentChannelType;
import com.school.erp.modules.feesv2.domain.FeeV2Enums.PaymentMode;
import com.school.erp.modules.feesv2.domain.FeeV2Enums.PaymentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Setter
@Entity
@Table(name = "payment", indexes = {
        @Index(name = "idx_payment_student_date", columnList = "tenant_id, academic_year_id, student_id, payment_date"),
        @Index(name = "idx_payment_external", columnList = "tenant_id, external_ref_id")
})
public class PaymentV2 extends FeeV2AcademicYearEntity {
    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "payment_no", nullable = false, length = 80)
    private String paymentNo;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "channel_type", nullable = false, length = 20)
    private PaymentChannelType channelType;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "payment_mode", nullable = false, length = 20)
    private PaymentMode paymentMode;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "payment_status", nullable = false, length = 20)
    private PaymentStatus paymentStatus = PaymentStatus.INITIATED;

    @Column(name = "amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 10)
    private String currency = "INR";

    @Column(name = "external_ref_id", length = 120)
    private String externalRefId;

    @Column(name = "instrument_ref", length = 120)
    private String instrumentRef;

    @Column(name = "receipt_no", length = 80)
    private String receiptNo;

    @Column(name = "payment_date", nullable = false)
    private LocalDateTime paymentDate;

    @Column(name = "idempotency_key", nullable = false, length = 120)
    private String idempotencyKey;

    @Column(name = "payment_metadata_json", columnDefinition = "json")
    private String paymentMetadataJson;
}
