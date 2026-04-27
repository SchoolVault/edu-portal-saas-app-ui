package com.school.erp.modules.hostel.repository;

import com.school.erp.modules.hostel.entity.HostelIncidentLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HostelIncidentLogRepository extends JpaRepository<HostelIncidentLog, Long> {
    List<HostelIncidentLog> findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId);

    List<HostelIncidentLog> findByTenantIdAndStudentIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId, Long studentId);

    Optional<HostelIncidentLog> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
