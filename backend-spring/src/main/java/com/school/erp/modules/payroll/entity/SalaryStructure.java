package com.school.erp.modules.payroll.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.enums.Enums;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "salary_structures")
public class SalaryStructure extends BaseEntity {
    @Column(name = "teacher_id", nullable = false)
    private Long teacherId;
    @Column(name = "teacher_name", length = 200)
    private String teacherName;
    @Column(name = "basic_salary", precision = 12, scale = 2)
    private BigDecimal basicSalary;
    @Column(name = "net_salary", precision = 12, scale = 2)
    private BigDecimal netSalary;


    public static class SalaryStructureBuilder {
        private Long teacherId;
        private String teacherName;
        private BigDecimal basicSalary;
        private BigDecimal netSalary;

        SalaryStructureBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public SalaryStructure.SalaryStructureBuilder teacherId(final Long teacherId) {
            this.teacherId = teacherId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public SalaryStructure.SalaryStructureBuilder teacherName(final String teacherName) {
            this.teacherName = teacherName;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public SalaryStructure.SalaryStructureBuilder basicSalary(final BigDecimal basicSalary) {
            this.basicSalary = basicSalary;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public SalaryStructure.SalaryStructureBuilder netSalary(final BigDecimal netSalary) {
            this.netSalary = netSalary;
            return this;
        }

        public SalaryStructure build() {
            return new SalaryStructure(this.teacherId, this.teacherName, this.basicSalary, this.netSalary);
        }

        @Override
        public String toString() {
            return "SalaryStructure.SalaryStructureBuilder(teacherId=" + this.teacherId + ", teacherName=" + this.teacherName + ", basicSalary=" + this.basicSalary + ", netSalary=" + this.netSalary + ")";
        }
    }

    public static SalaryStructure.SalaryStructureBuilder builder() {
        return new SalaryStructure.SalaryStructureBuilder();
    }

    public Long getTeacherId() {
        return this.teacherId;
    }

    public String getTeacherName() {
        return this.teacherName;
    }

    public BigDecimal getBasicSalary() {
        return this.basicSalary;
    }

    public BigDecimal getNetSalary() {
        return this.netSalary;
    }

    public void setTeacherId(final Long teacherId) {
        this.teacherId = teacherId;
    }

    public void setTeacherName(final String teacherName) {
        this.teacherName = teacherName;
    }

    public void setBasicSalary(final BigDecimal basicSalary) {
        this.basicSalary = basicSalary;
    }

    public void setNetSalary(final BigDecimal netSalary) {
        this.netSalary = netSalary;
    }

    public SalaryStructure() {
    }

    public SalaryStructure(final Long teacherId, final String teacherName, final BigDecimal basicSalary, final BigDecimal netSalary) {
        this.teacherId = teacherId;
        this.teacherName = teacherName;
        this.basicSalary = basicSalary;
        this.netSalary = netSalary;
    }
}
