package com.school.erp.modules.operations.repository;

import com.school.erp.modules.operations.entity.VisitorLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VisitorLogRepository extends JpaRepository<VisitorLog, Long> {

    List<VisitorLog> findByTenantIdAndIsDeletedFalseOrderByCheckInAtDesc(String tenantId);

    Page<VisitorLog> findByTenantIdAndIsDeletedFalseOrderByCheckInAtDesc(String tenantId, Pageable pageable);

    Optional<VisitorLog> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
