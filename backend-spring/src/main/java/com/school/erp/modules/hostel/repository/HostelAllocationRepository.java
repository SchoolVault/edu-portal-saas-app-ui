package com.school.erp.modules.hostel.repository;

import com.school.erp.modules.hostel.entity.HostelAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface HostelAllocationRepository extends JpaRepository<HostelAllocation, Long> {
    List<HostelAllocation> findByTenantIdAndIsDeletedFalse(String t);
    List<HostelAllocation> findByTenantIdAndRoomIdAndIsDeletedFalse(String t, Long roomId);
    List<HostelAllocation> findByTenantIdAndStudentIdAndIsDeletedFalse(String t, Long studentId);

    Optional<HostelAllocation> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
