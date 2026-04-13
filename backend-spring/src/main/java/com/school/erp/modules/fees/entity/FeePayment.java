package com.school.erp.modules.fees.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.enums.Enums;
import jakarta.persistence.*;
import java.math.BigDecimal;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDate;

@Entity
@Table(
        name = "fee_payments",
        indexes = {
            @Index(name = "idx_fp_tenant_student", columnList = "tenant_id, student_id"),
            @Index(name = "idx_fp_status", columnList = "tenant_id, status")
        },
        uniqueConstraints = @UniqueConstraint(
                name = "uq_fee_payment_tenant_receipt",
                columnNames = {"tenant_id", "receipt_number"}))
public class FeePayment extends BaseEntity {
    @Column(name = "student_id", nullable = false)
    private Long studentId;
    @Column(name = "student_name", length = 200)
    private String studentName;
    @Column(name = "fee_structure_id")
    private Long feeStructureId;
    @Column(precision = 12, scale = 2)
    private BigDecimal amount;
    @Column(name = "paid_amount", precision = 12, scale = 2)
    private BigDecimal paidAmount;
    @Column(name = "due_amount", precision = 12, scale = 2)
    private BigDecimal dueAmount;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 10)
    private Enums.FeeStatus status;
    @Column(name = "payment_date")
    private LocalDate paymentDate;
    @Column(name = "due_date")
    private LocalDate dueDate;
    @Column(precision = 10, scale = 2)
    private BigDecimal discount;
    @Column(name = "late_fee", precision = 10, scale = 2)
    private BigDecimal lateFee;
    @Column(name = "receipt_number", length = 50)
    private String receiptNumber;
    @Column(name = "payment_method", length = 30)
    private String paymentMethod;


    public static class FeePaymentBuilder {
        private Long studentId;
        private String studentName;
        private Long feeStructureId;
        private BigDecimal amount;
        private BigDecimal paidAmount;
        private BigDecimal dueAmount;
        private Enums.FeeStatus status;
        private LocalDate paymentDate;
        private LocalDate dueDate;
        private BigDecimal discount;
        private BigDecimal lateFee;
        private String receiptNumber;
        private String paymentMethod;

        FeePaymentBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public FeePayment.FeePaymentBuilder studentId(final Long studentId) {
            this.studentId = studentId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public FeePayment.FeePaymentBuilder studentName(final String studentName) {
            this.studentName = studentName;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public FeePayment.FeePaymentBuilder feeStructureId(final Long feeStructureId) {
            this.feeStructureId = feeStructureId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public FeePayment.FeePaymentBuilder amount(final BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public FeePayment.FeePaymentBuilder paidAmount(final BigDecimal paidAmount) {
            this.paidAmount = paidAmount;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public FeePayment.FeePaymentBuilder dueAmount(final BigDecimal dueAmount) {
            this.dueAmount = dueAmount;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public FeePayment.FeePaymentBuilder status(final Enums.FeeStatus status) {
            this.status = status;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public FeePayment.FeePaymentBuilder paymentDate(final LocalDate paymentDate) {
            this.paymentDate = paymentDate;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public FeePayment.FeePaymentBuilder dueDate(final LocalDate dueDate) {
            this.dueDate = dueDate;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public FeePayment.FeePaymentBuilder discount(final BigDecimal discount) {
            this.discount = discount;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public FeePayment.FeePaymentBuilder lateFee(final BigDecimal lateFee) {
            this.lateFee = lateFee;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public FeePayment.FeePaymentBuilder receiptNumber(final String receiptNumber) {
            this.receiptNumber = receiptNumber;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public FeePayment.FeePaymentBuilder paymentMethod(final String paymentMethod) {
            this.paymentMethod = paymentMethod;
            return this;
        }

        public FeePayment build() {
            return new FeePayment(this.studentId, this.studentName, this.feeStructureId, this.amount, this.paidAmount, this.dueAmount, this.status, this.paymentDate, this.dueDate, this.discount, this.lateFee, this.receiptNumber, this.paymentMethod);
        }

        @Override
        public String toString() {
            return "FeePayment.FeePaymentBuilder(studentId=" + this.studentId + ", studentName=" + this.studentName + ", feeStructureId=" + this.feeStructureId + ", amount=" + this.amount + ", paidAmount=" + this.paidAmount + ", dueAmount=" + this.dueAmount + ", status=" + this.status + ", paymentDate=" + this.paymentDate + ", dueDate=" + this.dueDate + ", discount=" + this.discount + ", lateFee=" + this.lateFee + ", receiptNumber=" + this.receiptNumber + ", paymentMethod=" + this.paymentMethod + ")";
        }
    }

    public static FeePayment.FeePaymentBuilder builder() {
        return new FeePayment.FeePaymentBuilder();
    }

    public Long getStudentId() {
        return this.studentId;
    }

    public String getStudentName() {
        return this.studentName;
    }

    public Long getFeeStructureId() {
        return this.feeStructureId;
    }

    public BigDecimal getAmount() {
        return this.amount;
    }

    public BigDecimal getPaidAmount() {
        return this.paidAmount;
    }

    public BigDecimal getDueAmount() {
        return this.dueAmount;
    }

    public Enums.FeeStatus getStatus() {
        return this.status;
    }

    public LocalDate getPaymentDate() {
        return this.paymentDate;
    }

    public LocalDate getDueDate() {
        return this.dueDate;
    }

    public BigDecimal getDiscount() {
        return this.discount;
    }

    public BigDecimal getLateFee() {
        return this.lateFee;
    }

    public String getReceiptNumber() {
        return this.receiptNumber;
    }

    public String getPaymentMethod() {
        return this.paymentMethod;
    }

    public void setStudentId(final Long studentId) {
        this.studentId = studentId;
    }

    public void setStudentName(final String studentName) {
        this.studentName = studentName;
    }

    public void setFeeStructureId(final Long feeStructureId) {
        this.feeStructureId = feeStructureId;
    }

    public void setAmount(final BigDecimal amount) {
        this.amount = amount;
    }

    public void setPaidAmount(final BigDecimal paidAmount) {
        this.paidAmount = paidAmount;
    }

    public void setDueAmount(final BigDecimal dueAmount) {
        this.dueAmount = dueAmount;
    }

    public void setStatus(final Enums.FeeStatus status) {
        this.status = status;
    }

    public void setPaymentDate(final LocalDate paymentDate) {
        this.paymentDate = paymentDate;
    }

    public void setDueDate(final LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public void setDiscount(final BigDecimal discount) {
        this.discount = discount;
    }

    public void setLateFee(final BigDecimal lateFee) {
        this.lateFee = lateFee;
    }

    public void setReceiptNumber(final String receiptNumber) {
        this.receiptNumber = receiptNumber;
    }

    public void setPaymentMethod(final String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public FeePayment() {
    }

    public FeePayment(final Long studentId, final String studentName, final Long feeStructureId, final BigDecimal amount, final BigDecimal paidAmount, final BigDecimal dueAmount, final Enums.FeeStatus status, final LocalDate paymentDate, final LocalDate dueDate, final BigDecimal discount, final BigDecimal lateFee, final String receiptNumber, final String paymentMethod) {
        this.studentId = studentId;
        this.studentName = studentName;
        this.feeStructureId = feeStructureId;
        this.amount = amount;
        this.paidAmount = paidAmount;
        this.dueAmount = dueAmount;
        this.status = status;
        this.paymentDate = paymentDate;
        this.dueDate = dueDate;
        this.discount = discount;
        this.lateFee = lateFee;
        this.receiptNumber = receiptNumber;
        this.paymentMethod = paymentMethod;
    }
}
