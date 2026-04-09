package com.school.erp.modules.payroll.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.enums.Enums;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "salary_components")
public class SalaryComponent extends BaseEntity {
    @Column(name = "salary_structure_id", nullable = false)
    private Long salaryStructureId;
    @Column(nullable = false, length = 100)
    private String name;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private Enums.SalaryComponentType type;


    public static class SalaryComponentBuilder {
        private Long salaryStructureId;
        private String name;
        private BigDecimal amount;
        private Enums.SalaryComponentType type;

        SalaryComponentBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public SalaryComponent.SalaryComponentBuilder salaryStructureId(final Long salaryStructureId) {
            this.salaryStructureId = salaryStructureId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public SalaryComponent.SalaryComponentBuilder name(final String name) {
            this.name = name;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public SalaryComponent.SalaryComponentBuilder amount(final BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public SalaryComponent.SalaryComponentBuilder type(final Enums.SalaryComponentType type) {
            this.type = type;
            return this;
        }

        public SalaryComponent build() {
            return new SalaryComponent(this.salaryStructureId, this.name, this.amount, this.type);
        }

        @Override
        public String toString() {
            return "SalaryComponent.SalaryComponentBuilder(salaryStructureId=" + this.salaryStructureId + ", name=" + this.name + ", amount=" + this.amount + ", type=" + this.type + ")";
        }
    }

    public static SalaryComponent.SalaryComponentBuilder builder() {
        return new SalaryComponent.SalaryComponentBuilder();
    }

    public Long getSalaryStructureId() {
        return this.salaryStructureId;
    }

    public String getName() {
        return this.name;
    }

    public BigDecimal getAmount() {
        return this.amount;
    }

    public Enums.SalaryComponentType getType() {
        return this.type;
    }

    public void setSalaryStructureId(final Long salaryStructureId) {
        this.salaryStructureId = salaryStructureId;
    }

    public void setName(final String name) {
        this.name = name;
    }

    public void setAmount(final BigDecimal amount) {
        this.amount = amount;
    }

    public void setType(final Enums.SalaryComponentType type) {
        this.type = type;
    }

    public SalaryComponent() {
    }

    public SalaryComponent(final Long salaryStructureId, final String name, final BigDecimal amount, final Enums.SalaryComponentType type) {
        this.salaryStructureId = salaryStructureId;
        this.name = name;
        this.amount = amount;
        this.type = type;
    }
}
