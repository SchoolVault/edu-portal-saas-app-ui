package com.school.erp.modules.feesv2.repository;

import com.school.erp.modules.feesv2.domain.FeeV2Enums.DemandStatus;
import com.school.erp.modules.feesv2.entity.FeeDemandV2;
import com.school.erp.modules.feesv2.repository.projection.ClassOutstandingRow;
import com.school.erp.modules.feesv2.repository.projection.DefaulterSummaryRow;
import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FeeDemandV2Repository extends JpaRepository<FeeDemandV2, Long> {
    List<FeeDemandV2> findByTenantIdAndAcademicYearIdAndStudentIdAndIsDeletedFalseOrderByDueDateAscIdAsc(
            String tenantId, Long academicYearId, Long studentId);

    List<FeeDemandV2> findByTenantIdAndAcademicYearIdAndStudentIdAndOutstandingAmountGreaterThanAndIsDeletedFalseOrderByDueDateAscIdAsc(
            String tenantId, Long academicYearId, Long studentId, java.math.BigDecimal outstandingAmount);

    boolean existsByTenantIdAndAcademicYearIdAndStudentIdAndFeeComponentMasterIdAndPeriodKeyAndIsDeletedFalse(
            String tenantId, Long academicYearId, Long studentId, Long feeComponentMasterId, String periodKey);

    long countByTenantIdAndAcademicYearIdAndDemandRunIdAndIsDeletedFalse(
            String tenantId, Long academicYearId, Long demandRunId);

    @Query(
            """
            select d.studentId as studentId, d.classId as classId,
            sum(d.outstandingAmount) as totalOutstanding, count(d.id) as demandCount, min(d.dueDate) as oldestDueDate
            from FeeDemandV2 d
            where d.tenantId = :tenantId and d.academicYearId = :academicYearId and d.isDeleted = false
            group by d.studentId, d.classId
            having sum(d.outstandingAmount) > 0
            order by sum(d.outstandingAmount) desc
            """)
    List<DefaulterSummaryRow> summarizeDefaulters(
            @Param("tenantId") String tenantId, @Param("academicYearId") Long academicYearId);

    @Query(
            """
            select d.classId as classId, sum(d.outstandingAmount) as totalOutstanding, sum(d.netAmount) as totalDemanded
            from FeeDemandV2 d
            where d.tenantId = :tenantId and d.academicYearId = :academicYearId and d.isDeleted = false
            group by d.classId
            order by d.classId
            """)
    List<ClassOutstandingRow> summarizeOutstandingByClass(
            @Param("tenantId") String tenantId, @Param("academicYearId") Long academicYearId);

    @Query(
            """
            select d from FeeDemandV2 d
            where d.tenantId = :tenantId and d.academicYearId = :academicYearId and d.isDeleted = false
            and d.outstandingAmount > 0 and d.lateFeeAmount = 0 and d.demandStatus <> :paid
            and d.dueDate <= :cutoff
            order by d.id asc
            """)
    List<FeeDemandV2> findCandidatesForLateFeeApplication(
            @Param("tenantId") String tenantId,
            @Param("academicYearId") Long academicYearId,
            @Param("paid") DemandStatus paid,
            @Param("cutoff") LocalDate cutoff);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(
            """
            select d from FeeDemandV2 d
            where d.id = :id and d.tenantId = :tenantId and d.academicYearId = :academicYearId and d.isDeleted = false
            """)
    Optional<FeeDemandV2> findByIdAndTenantIdAndAcademicYearIdForUpdate(
            @Param("id") Long id, @Param("tenantId") String tenantId, @Param("academicYearId") Long academicYearId);

    Optional<FeeDemandV2> findByIdAndTenantIdAndAcademicYearIdAndIsDeletedFalse(
            Long id, String tenantId, Long academicYearId);

    @Query(
            value =
                    """
                    SELECT t.student_id, t.demand_out, IFNULL(lb.running_balance, 0)
                    FROM (
                        SELECT student_id, SUM(outstanding_amount) AS demand_out
                        FROM fee_demand
                        WHERE tenant_id = :tid AND academic_year_id = :yid AND is_deleted = 0
                        GROUP BY student_id
                    ) t
                    LEFT JOIN (
                        SELECT sl.student_id, sl.running_balance
                        FROM student_ledger sl
                        INNER JOIN (
                            SELECT student_id, MAX(id) AS mid
                            FROM student_ledger
                            WHERE tenant_id = :tid AND academic_year_id = :yid AND is_deleted = 0
                            GROUP BY student_id
                        ) x ON sl.id = x.mid AND sl.tenant_id = :tid AND sl.academic_year_id = :yid
                    ) lb ON lb.student_id = t.student_id
                    WHERE ABS(t.demand_out - IFNULL(lb.running_balance, 0)) > 0.009
                    LIMIT 100
                    """,
            nativeQuery = true)
    List<Object[]> findStudentLedgerDemandMismatches(@Param("tid") String tid, @Param("yid") Long yid);
}
