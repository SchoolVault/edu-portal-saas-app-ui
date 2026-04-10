package com.school.erp.modules.operations.repository;

import com.school.erp.modules.operations.entity.VisitorLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VisitorLogRepository extends JpaRepository<VisitorLog, Long> {

    List<VisitorLog> findByTenantIdAndIsDeletedFalseOrderByCheckInAtDesc(String tenantId);

    Optional<VisitorLog> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
