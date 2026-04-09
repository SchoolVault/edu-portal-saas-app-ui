package com.school.erp.modules.payroll.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.enums.Enums;
import jakarta.persistence.*;
import java.math.BigDecimal;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDate;

@Entity
@Table(name = "payslips", indexes = {@Index(name = "idx_payslip_teacher", columnList = "tenant_id, teacher_id")})
public class Payslip extends BaseEntity {
    @Column(name = "teacher_id", nullable = false)
    private Long teacherId;
    @Column(name = "teacher_name", length = 200)
    private String teacherName;
    @Column(name = "payroll_month", length = 7)
    private String payrollMonth;
    @Column(name = "components_json", columnDefinition = "json")
    private String componentsJson;
    @Column(name = "tax_details_json", columnDefinition = "json")
    private String taxDetailsJson;
    @Column(length = 20)
    private String month;
    private Integer year;
    @Column(name = "basic_salary", precision = 12, scale = 2)
    private BigDecimal basicSalary;
    @Column(name = "total_allowances", precision = 12, scale = 2)
    private BigDecimal totalAllowances;
    @Column(name = "total_deductions", precision = 12, scale = 2)
    private BigDecimal totalDeductions;
    @Column(name = "net_salary", precision = 12, scale = 2)
    private BigDecimal netSalary;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 15)
    private Enums.PayslipStatus status;
    @Column(name = "payment_date")
    private LocalDate paymentDate;


    public static class PayslipBuilder {
        private Long teacherId;
        private String teacherName;
        private String month;
        private Integer year;
        private BigDecimal basicSalary;
        private BigDecimal totalAllowances;
        private BigDecimal totalDeductions;
        private BigDecimal netSalary;
        private Enums.PayslipStatus status;
        private LocalDate paymentDate;

        PayslipBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public Payslip.PayslipBuilder teacherId(final Long teacherId) {
            this.teacherId = teacherId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Payslip.PayslipBuilder teacherName(final String teacherName) {
            this.teacherName = teacherName;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Payslip.PayslipBuilder month(final String month) {
            this.month = month;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Payslip.PayslipBuilder year(final Integer year) {
            this.year = year;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Payslip.PayslipBuilder basicSalary(final BigDecimal basicSalary) {
            this.basicSalary = basicSalary;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Payslip.PayslipBuilder totalAllowances(final BigDecimal totalAllowances) {
            this.totalAllowances = totalAllowances;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Payslip.PayslipBuilder totalDeductions(final BigDecimal totalDeductions) {
            this.totalDeductions = totalDeductions;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Payslip.PayslipBuilder netSalary(final BigDecimal netSalary) {
            this.netSalary = netSalary;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Payslip.PayslipBuilder status(final Enums.PayslipStatus status) {
            this.status = status;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Payslip.PayslipBuilder paymentDate(final LocalDate paymentDate) {
            this.paymentDate = paymentDate;
            return this;
        }

        public Payslip build() {
            return new Payslip(this.teacherId, this.teacherName, this.month, this.year, this.basicSalary, this.totalAllowances, this.totalDeductions, this.netSalary, this.status, this.paymentDate);
        }

        @Override
        public String toString() {
            return "Payslip.PayslipBuilder(teacherId=" + this.teacherId + ", teacherName=" + this.teacherName + ", month=" + this.month + ", year=" + this.year + ", basicSalary=" + this.basicSalary + ", totalAllowances=" + this.totalAllowances + ", totalDeductions=" + this.totalDeductions + ", netSalary=" + this.netSalary + ", status=" + this.status + ", paymentDate=" + this.paymentDate + ")";
        }
    }

    public static Payslip.PayslipBuilder builder() {
        return new Payslip.PayslipBuilder();
    }

    public Long getTeacherId() {
        return this.teacherId;
    }

    public String getTeacherName() {
        return this.teacherName;
    }

    public String getPayrollMonth() {
        return payrollMonth;
    }

    public void setPayrollMonth(String payrollMonth) {
        this.payrollMonth = payrollMonth;
    }

    public String getComponentsJson() {
        return componentsJson;
    }

    public void setComponentsJson(String componentsJson) {
        this.componentsJson = componentsJson;
    }

    public String getTaxDetailsJson() {
        return taxDetailsJson;
    }

    public void setTaxDetailsJson(String taxDetailsJson) {
        this.taxDetailsJson = taxDetailsJson;
    }

    public String getMonth() {
        return this.month;
    }

    public Integer getYear() {
        return this.year;
    }

    public BigDecimal getBasicSalary() {
        return this.basicSalary;
    }

    public BigDecimal getTotalAllowances() {
        return this.totalAllowances;
    }

    public BigDecimal getTotalDeductions() {
        return this.totalDeductions;
    }

    public BigDecimal getNetSalary() {
        return this.netSalary;
    }

    public Enums.PayslipStatus getStatus() {
        return this.status;
    }

    public LocalDate getPaymentDate() {
        return this.paymentDate;
    }

    public void setTeacherId(final Long teacherId) {
        this.teacherId = teacherId;
    }

    public void setTeacherName(final String teacherName) {
        this.teacherName = teacherName;
    }

    public void setMonth(final String month) {
        this.month = month;
    }

    public void setYear(final Integer year) {
        this.year = year;
    }

    public void setBasicSalary(final BigDecimal basicSalary) {
        this.basicSalary = basicSalary;
    }

    public void setTotalAllowances(final BigDecimal totalAllowances) {
        this.totalAllowances = totalAllowances;
    }

    public void setTotalDeductions(final BigDecimal totalDeductions) {
        this.totalDeductions = totalDeductions;
    }

    public void setNetSalary(final BigDecimal netSalary) {
        this.netSalary = netSalary;
    }

    public void setStatus(final Enums.PayslipStatus status) {
        this.status = status;
    }

    public void setPaymentDate(final LocalDate paymentDate) {
        this.paymentDate = paymentDate;
    }

    public Payslip() {
    }

    public Payslip(final Long teacherId, final String teacherName, final String month, final Integer year, final BigDecimal basicSalary, final BigDecimal totalAllowances, final BigDecimal totalDeductions, final BigDecimal netSalary, final Enums.PayslipStatus status, final LocalDate paymentDate) {
        this.teacherId = teacherId;
        this.teacherName = teacherName;
        this.month = month;
        this.year = year;
        this.basicSalary = basicSalary;
        this.totalAllowances = totalAllowances;
        this.totalDeductions = totalDeductions;
        this.netSalary = netSalary;
        this.status = status;
        this.paymentDate = paymentDate;
    }
}
