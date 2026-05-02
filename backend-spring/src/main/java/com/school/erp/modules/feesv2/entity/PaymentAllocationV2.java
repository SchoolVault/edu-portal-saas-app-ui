package com.school.erp.modules.feesv2.entity;

import com.school.erp.modules.feesv2.domain.FeeV2Enums.AllocationType;
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
@Table(name = "payment_allocation", indexes = {
        @Index(name = "idx_payment_allocation_payment", columnList = "tenant_id, academic_year_id, payment_id, allocation_order"),
        @Index(name = "idx_payment_allocation_demand", columnList = "tenant_id, academic_year_id, fee_demand_id")
})
public class PaymentAllocationV2 extends FeeV2AcademicYearEntity {
    @Column(name = "payment_id", nullable = false)
    private Long paymentId;

    @Column(name = "fee_demand_id")
    private Long feeDemandId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "allocation_type", nullable = false, length = 20)
    private AllocationType allocationType;

    @Column(name = "amount_allocated", nullable = false, precision = 14, scale = 2)
    private BigDecimal amountAllocated;

    @Column(name = "allocation_order", nullable = false)
    private Integer allocationOrder;
}
