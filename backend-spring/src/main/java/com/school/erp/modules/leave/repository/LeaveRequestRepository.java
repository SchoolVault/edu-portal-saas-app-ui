package com.school.erp.modules.leave.repository;

import com.school.erp.modules.leave.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId);

    List<LeaveRequest> findByTenantIdAndApplicantUserIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId, Long applicantUserId);
}
