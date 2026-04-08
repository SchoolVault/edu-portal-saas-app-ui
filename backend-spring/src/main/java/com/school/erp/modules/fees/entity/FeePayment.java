package com.school.erp.modules.fees.entity;
import com.school.erp.common.entity.BaseEntity; import com.school.erp.common.enums.Enums;
import jakarta.persistence.*; import lombok.*; import java.math.BigDecimal; import java.time.LocalDate;

@Entity @Table(name = "fee_payments", indexes = {
    @Index(name = "idx_fp_tenant_student", columnNames = {"tenant_id", "student_id"}),
    @Index(name = "idx_fp_status", columnNames = {"tenant_id", "status"})
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class FeePayment extends BaseEntity {
    @Column(name = "student_id", nullable = false) private Long studentId;
    @Column(name = "student_name", length = 200) private String studentName;
    @Column(name = "fee_structure_id") private Long feeStructureId;
    @Column(precision = 12, scale = 2) private BigDecimal amount;
    @Column(name = "paid_amount", precision = 12, scale = 2) private BigDecimal paidAmount;
    @Column(name = "due_amount", precision = 12, scale = 2) private BigDecimal dueAmount;
    @Enumerated(EnumType.STRING) @Column(length = 10) private Enums.FeeStatus status;
    @Column(name = "payment_date") private LocalDate paymentDate;
    @Column(name = "due_date") private LocalDate dueDate;
    @Column(precision = 10, scale = 2) private BigDecimal discount;
    @Column(name = "late_fee", precision = 10, scale = 2) private BigDecimal lateFee;
    @Column(name = "receipt_number", length = 50) private String receiptNumber;
    @Column(name = "payment_method", length = 30) private String paymentMethod;
}
