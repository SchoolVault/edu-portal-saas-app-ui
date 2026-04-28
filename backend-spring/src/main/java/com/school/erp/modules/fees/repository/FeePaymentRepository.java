package com.school.erp.modules.fees.repository;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.fees.entity.FeePayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface FeePaymentRepository extends JpaRepository<FeePayment, Long> {
    List<FeePayment> findByTenantIdAndIsDeletedFalse(String tenantId);

    List<FeePayment> findByTenantIdAndStatusAndIsDeletedFalse(String tenantId, Enums.FeeStatus status);

    List<FeePayment> findByTenantIdAndStudentIdAndIsDeletedFalse(String tenantId, Long studentId);

    Optional<FeePayment> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    Optional<FeePayment> findByReceiptNumberAndTenantIdAndIsDeletedFalse(String receiptNumber, String tenantId);

    @Query("""
            select f from FeePayment f
            where f.tenantId = :tenantId and f.isDeleted = false
              and f.dueAmount is not null and f.dueAmount > 0
              and f.status in :statuses
              and (
                (f.dueDate is not null and f.dueDate between :fromInclusive and :toInclusive)
                or f.status = :overdueStatus
              )
            """)
    List<FeePayment> findDueForReminders(
            @Param("tenantId") String tenantId,
            @Param("fromInclusive") LocalDate fromInclusive,
            @Param("toInclusive") LocalDate toInclusive,
            @Param("statuses") List<Enums.FeeStatus> statuses,
            @Param("overdueStatus") Enums.FeeStatus overdueStatus);

    @Query("""
            select p.studentId from FeePayment p
            where p.tenantId = :tenantId and p.isDeleted = false
              and p.feeStructureId = :feeStructureId and p.dueDate = :dueDate
              and p.studentId in :studentIds
            """)
    Set<Long> findStudentIdsWithObligationOnDueDate(
            @Param("tenantId") String tenantId,
            @Param("feeStructureId") Long feeStructureId,
            @Param("dueDate") LocalDate dueDate,
            @Param("studentIds") Collection<Long> studentIds);

    /**
     * Class-level fee aggregates used by reports.
     * Keep JPQL free of SQL-style inline comments because Hibernate 6 query validation
     * parses annotation text strictly and can fail during application startup.
     */
    @Query("""
            SELECT s.classId,
                   COALESCE(SUM(f.paidAmount), 0),
                   COALESCE(SUM(f.amount), 0),
                   SUM(CASE WHEN f.status = :overdueStatus THEN 1 ELSE 0 END)
            FROM FeePayment f, Student s
            WHERE f.tenantId = :tenantId
              AND s.tenantId = :tenantId
              AND f.isDeleted = false
              AND s.isDeleted = false
              AND f.studentId = s.id
              AND s.classId IN :classIds
            GROUP BY s.classId
            """)
    List<Object[]> getClassFeeSummaryByClassIds(
            @Param("tenantId") String tenantId,
            @Param("classIds") Collection<Long> classIds,
            @Param("overdueStatus") Enums.FeeStatus overdueStatus);
}
