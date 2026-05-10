package com.school.erp.modules.leave.repository;

import com.school.erp.modules.leave.entity.LeaveEntitlementLedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveEntitlementLedgerRepository extends JpaRepository<LeaveEntitlementLedgerEntry, Long> {

    @Query("""
            SELECT COALESCE(SUM(e.signedUnits), 0)
            FROM LeaveEntitlementLedgerEntry e
            WHERE e.tenantId = :tenantId
              AND e.userId = :userId
              AND e.leaveType = :leaveType
              AND (e.isDeleted = false OR e.isDeleted IS NULL)
            """)
    Integer sumSignedUnitsByUserAndLeaveType(
            @Param("tenantId") String tenantId,
            @Param("userId") Long userId,
            @Param("leaveType") String leaveType);

    List<LeaveEntitlementLedgerEntry> findByTenantIdAndUserIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId, Long userId);

    @Query("""
            SELECT COALESCE(SUM(e.signedUnits), 0)
            FROM LeaveEntitlementLedgerEntry e
            WHERE e.tenantId = :tenantId
              AND e.userId = :userId
              AND e.referenceType = :referenceType
              AND e.referenceId = :referenceId
              AND (e.isDeleted = false OR e.isDeleted IS NULL)
            """)
    Integer sumSignedUnitsByReference(
            @Param("tenantId") String tenantId,
            @Param("userId") Long userId,
            @Param("referenceType") String referenceType,
            @Param("referenceId") Long referenceId);

    Optional<LeaveEntitlementLedgerEntry> findFirstByTenantIdAndUserIdAndLeaveTypeAndPolicyYearLabelAndEntryTypeAndReferenceTypeAndReferenceIdAndIsDeletedFalse(
            String tenantId,
            Long userId,
            String leaveType,
            String policyYearLabel,
            String entryType,
            String referenceType,
            Long referenceId);
}
