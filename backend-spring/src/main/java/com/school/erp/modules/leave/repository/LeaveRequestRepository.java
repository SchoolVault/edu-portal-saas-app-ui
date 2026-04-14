package com.school.erp.modules.leave.repository;

import com.school.erp.modules.leave.entity.LeaveRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId);

    List<LeaveRequest> findByTenantIdAndApplicantUserIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId, Long applicantUserId);

    @Query("""
            SELECT l FROM LeaveRequest l
            WHERE l.tenantId = :t AND (l.isDeleted = false OR l.isDeleted IS NULL)
              AND l.applicantUserId = :uid
              AND (:q = '' OR LOWER(CONCAT(COALESCE(l.reason, ''), ' ', COALESCE(l.leaveType, ''))) LIKE LOWER(CONCAT('%', :q, '%')))
            ORDER BY l.createdAt DESC
            """)
    Page<LeaveRequest> pageMine(@Param("t") String t, @Param("uid") Long uid, @Param("q") String q, Pageable pageable);

    @Query("""
            SELECT l FROM LeaveRequest l
            WHERE l.tenantId = :t AND (l.isDeleted = false OR l.isDeleted IS NULL)
              AND (:q = '' OR LOWER(CONCAT(COALESCE(l.reason, ''), ' ', COALESCE(l.leaveType, ''))) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR CAST(l.applicantUserId AS string) LIKE CONCAT('%', :q, '%'))
            ORDER BY l.createdAt DESC
            """)
    Page<LeaveRequest> pageAll(@Param("t") String t, @Param("q") String q, Pageable pageable);
}
