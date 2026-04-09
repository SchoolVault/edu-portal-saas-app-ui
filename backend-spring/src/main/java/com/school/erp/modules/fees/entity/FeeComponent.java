package com.school.erp.modules.fees.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.enums.Enums;
import jakarta.persistence.*;
import java.math.BigDecimal;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "fee_components")
public class FeeComponent extends BaseEntity {
    @Column(name = "fee_structure_id", nullable = false)
    private Long feeStructureId;
    @Column(nullable = false, length = 100)
    private String name;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 20)
    private Enums.FeeComponentType type;


    public static class FeeComponentBuilder {
        private Long feeStructureId;
        private String name;
        private BigDecimal amount;
        private Enums.FeeComponentType type;

        FeeComponentBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public FeeComponent.FeeComponentBuilder feeStructureId(final Long feeStructureId) {
            this.feeStructureId = feeStructureId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public FeeComponent.FeeComponentBuilder name(final String name) {
            this.name = name;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public FeeComponent.FeeComponentBuilder amount(final BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public FeeComponent.FeeComponentBuilder type(final Enums.FeeComponentType type) {
            this.type = type;
            return this;
        }

        public FeeComponent build() {
            return new FeeComponent(this.feeStructureId, this.name, this.amount, this.type);
        }

        @Override
        public String toString() {
            return "FeeComponent.FeeComponentBuilder(feeStructureId=" + this.feeStructureId + ", name=" + this.name + ", amount=" + this.amount + ", type=" + this.type + ")";
        }
    }

    public static FeeComponent.FeeComponentBuilder builder() {
        return new FeeComponent.FeeComponentBuilder();
    }

    public Long getFeeStructureId() {
        return this.feeStructureId;
    }

    public String getName() {
        return this.name;
    }

    public BigDecimal getAmount() {
        return this.amount;
    }

    public Enums.FeeComponentType getType() {
        return this.type;
    }

    public void setFeeStructureId(final Long feeStructureId) {
        this.feeStructureId = feeStructureId;
    }

    public void setName(final String name) {
        this.name = name;
    }

    public void setAmount(final BigDecimal amount) {
        this.amount = amount;
    }

    public void setType(final Enums.FeeComponentType type) {
        this.type = type;
    }

    public FeeComponent() {
    }

    public FeeComponent(final Long feeStructureId, final String name, final BigDecimal amount, final Enums.FeeComponentType type) {
        this.feeStructureId = feeStructureId;
        this.name = name;
        this.amount = amount;
        this.type = type;
    }
}
