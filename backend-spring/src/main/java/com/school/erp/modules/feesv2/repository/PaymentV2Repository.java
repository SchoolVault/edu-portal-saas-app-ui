package com.school.erp.modules.feesv2.repository;

import com.school.erp.modules.feesv2.domain.FeeV2Enums.PaymentStatus;
import com.school.erp.modules.feesv2.entity.PaymentV2;
import com.school.erp.modules.feesv2.repository.projection.PaymentModeTotalRow;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentV2Repository extends JpaRepository<PaymentV2, Long> {
    Optional<PaymentV2> findByTenantIdAndAcademicYearIdAndIdempotencyKeyAndIsDeletedFalse(String tenantId, Long academicYearId, String idempotencyKey);

    List<PaymentV2> findByTenantIdAndAcademicYearIdAndReceiptNoAndIsDeletedFalse(
            String tenantId, Long academicYearId, String receiptNo);
    List<PaymentV2> findByTenantIdAndAcademicYearIdAndStudentIdAndIsDeletedFalseOrderByPaymentDateDescIdDesc(
            String tenantId, Long academicYearId, Long studentId);

    @Query(
            """
            select coalesce(sum(p.amount), 0) from PaymentV2 p
            where p.tenantId = :tenantId and p.academicYearId = :academicYearId and p.isDeleted = false
            and p.paymentStatus = :successStatus
            and (:fromTs is null or p.paymentDate >= :fromTs)
            and (:toTs is null or p.paymentDate <= :toTs)
            """)
    BigDecimal sumSuccessfulAmountInRange(
            @Param("tenantId") String tenantId,
            @Param("academicYearId") Long academicYearId,
            @Param("successStatus") PaymentStatus successStatus,
            @Param("fromTs") LocalDateTime fromTs,
            @Param("toTs") LocalDateTime toTs);

    @Query(
            """
            select count(p.id) from PaymentV2 p
            where p.tenantId = :tenantId and p.academicYearId = :academicYearId and p.isDeleted = false
            and p.paymentStatus = :successStatus
            and (:fromTs is null or p.paymentDate >= :fromTs)
            and (:toTs is null or p.paymentDate <= :toTs)
            """)
    long countSuccessfulInRange(
            @Param("tenantId") String tenantId,
            @Param("academicYearId") Long academicYearId,
            @Param("successStatus") PaymentStatus successStatus,
            @Param("fromTs") LocalDateTime fromTs,
            @Param("toTs") LocalDateTime toTs);

    @Query(
            """
            select p.paymentMode as paymentMode, sum(p.amount) as totalAmount, count(p.id) as paymentCount from PaymentV2 p
            where p.tenantId = :tenantId and p.academicYearId = :academicYearId and p.isDeleted = false
            and p.paymentStatus = :successStatus
            and (:fromTs is null or p.paymentDate >= :fromTs)
            and (:toTs is null or p.paymentDate <= :toTs)
            group by p.paymentMode
            """)
    List<PaymentModeTotalRow> totalsByPaymentMode(
            @Param("tenantId") String tenantId,
            @Param("academicYearId") Long academicYearId,
            @Param("successStatus") PaymentStatus successStatus,
            @Param("fromTs") LocalDateTime fromTs,
            @Param("toTs") LocalDateTime toTs);

    @Query(
            """
            select p from PaymentV2 p
            where p.tenantId = :tenantId and p.academicYearId = :academicYearId and p.isDeleted = false
            and (:studentId is null or p.studentId = :studentId)
            and (:fromTs is null or p.paymentDate >= :fromTs)
            and (:toTs is null or p.paymentDate <= :toTs)
            order by p.paymentDate desc, p.id desc
            """)
    List<PaymentV2> searchPaymentRegister(
            @Param("tenantId") String tenantId,
            @Param("academicYearId") Long academicYearId,
            @Param("studentId") Long studentId,
            @Param("fromTs") LocalDateTime fromTs,
            @Param("toTs") LocalDateTime toTs);
}
