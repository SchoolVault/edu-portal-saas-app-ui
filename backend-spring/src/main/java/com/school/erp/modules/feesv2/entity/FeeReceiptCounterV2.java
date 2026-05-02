package com.school.erp.modules.feesv2.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "fee_receipt_counter_v2")
public class FeeReceiptCounterV2 extends FeeV2AcademicYearEntity {
    @Column(name = "next_seq", nullable = false)
    private Long nextSeq = 1L;
}
