package com.school.erp.modules.feesv2.entity;

import com.school.erp.modules.feesv2.domain.FeeV2Enums.LedgerEntryType;
import com.school.erp.modules.feesv2.domain.FeeV2Enums.LedgerSourceType;
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
@Table(name = "student_ledger", indexes = {
        @Index(name = "idx_student_ledger_student_txn", columnList = "tenant_id, academic_year_id, student_id, txn_time, id"),
        @Index(name = "idx_student_ledger_source", columnList = "tenant_id, academic_year_id, source_type, source_ref_id")
})
public class StudentLedgerEntryV2 extends FeeV2AcademicYearEntity {
    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "entry_type", nullable = false, length = 10)
    private LedgerEntryType entryType;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "source_type", nullable = false, length = 30)
    private LedgerSourceType sourceType;

    @Column(name = "source_ref_id")
    private Long sourceRefId;

    @Column(name = "source_ref_code", length = 80)
    private String sourceRefCode;

    @Column(name = "amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "signed_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal signedAmount;

    @Column(name = "running_balance", nullable = false, precision = 14, scale = 2)
    private BigDecimal runningBalance;

    @Column(name = "txn_time", nullable = false)
    private LocalDateTime txnTime;

    @Column(name = "narrative", length = 255)
    private String narrative;

    @Column(name = "metadata_json", columnDefinition = "json")
    private String metadataJson;
}
