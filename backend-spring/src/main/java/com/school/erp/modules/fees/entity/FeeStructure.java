package com.school.erp.modules.fees.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "fee_structures", indexes = {@Index(name = "idx_fs_tenant", columnList = "tenant_id")})
public class FeeStructure extends BaseEntity {
    @Column(nullable = false, length = 100)
    private String name;
    @Column(name = "class_id")
    private Long classId;
    @Column(name = "class_name", length = 50)
    private String className;
    @Column(name = "academic_year_id")
    private Long academicYearId;
    @Column(name = "total_amount", precision = 12, scale = 2)
    private BigDecimal totalAmount;


    public static class FeeStructureBuilder {
        private String name;
        private Long classId;
        private String className;
        private Long academicYearId;
        private BigDecimal totalAmount;

        FeeStructureBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public FeeStructure.FeeStructureBuilder name(final String name) {
            this.name = name;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public FeeStructure.FeeStructureBuilder classId(final Long classId) {
            this.classId = classId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public FeeStructure.FeeStructureBuilder className(final String className) {
            this.className = className;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public FeeStructure.FeeStructureBuilder academicYearId(final Long academicYearId) {
            this.academicYearId = academicYearId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public FeeStructure.FeeStructureBuilder totalAmount(final BigDecimal totalAmount) {
            this.totalAmount = totalAmount;
            return this;
        }

        public FeeStructure build() {
            return new FeeStructure(this.name, this.classId, this.className, this.academicYearId, this.totalAmount);
        }

        @Override
        public String toString() {
            return "FeeStructure.FeeStructureBuilder(name=" + this.name + ", classId=" + this.classId + ", className=" + this.className + ", academicYearId=" + this.academicYearId + ", totalAmount=" + this.totalAmount + ")";
        }
    }

    public static FeeStructure.FeeStructureBuilder builder() {
        return new FeeStructure.FeeStructureBuilder();
    }

    public String getName() {
        return this.name;
    }

    public Long getClassId() {
        return this.classId;
    }

    public String getClassName() {
        return this.className;
    }

    public Long getAcademicYearId() {
        return this.academicYearId;
    }

    public BigDecimal getTotalAmount() {
        return this.totalAmount;
    }

    public void setName(final String name) {
        this.name = name;
    }

    public void setClassId(final Long classId) {
        this.classId = classId;
    }

    public void setClassName(final String className) {
        this.className = className;
    }

    public void setAcademicYearId(final Long academicYearId) {
        this.academicYearId = academicYearId;
    }

    public void setTotalAmount(final BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public FeeStructure() {
    }

    public FeeStructure(final String name, final Long classId, final String className, final Long academicYearId, final BigDecimal totalAmount) {
        this.name = name;
        this.classId = classId;
        this.className = className;
        this.academicYearId = academicYearId;
        this.totalAmount = totalAmount;
    }
}
