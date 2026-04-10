package com.school.erp.modules.operations.repository;

import com.school.erp.modules.operations.entity.GatePass;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GatePassRepository extends JpaRepository<GatePass, Long> {

    List<GatePass> findByTenantIdAndIsDeletedFalseOrderByValidFromDesc(String tenantId);

    Optional<GatePass> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
