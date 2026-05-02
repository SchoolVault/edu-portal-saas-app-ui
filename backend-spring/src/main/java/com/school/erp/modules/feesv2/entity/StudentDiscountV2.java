package com.school.erp.modules.feesv2.entity;

import com.school.erp.modules.feesv2.domain.FeeV2Enums.DiscountType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Setter
@Entity
@Table(name = "student_discount", indexes = {
        @Index(name = "idx_student_discount_student", columnList = "tenant_id, academic_year_id, student_id, is_deleted, is_active")
})
public class StudentDiscountV2 extends FeeV2AcademicYearEntity {
    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "discount_type", nullable = false, length = 20)
    private DiscountType discountType;

    @Column(name = "discount_value", nullable = false, precision = 14, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "component_scope", nullable = false, length = 20)
    private String componentScope;

    @Column(name = "applicable_component_ids_json", columnDefinition = "json")
    private String applicableComponentIdsJson;

    @Column(name = "valid_from", nullable = false)
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    @Column(name = "approval_status", nullable = false, length = 20)
    private String approvalStatus = "APPROVED";

    @Column(name = "reason", length = 255)
    private String reason;
}
