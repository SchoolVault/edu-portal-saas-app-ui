package com.school.erp.modules.transport.repository;

import com.school.erp.modules.transport.entity.TransportOpsPolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TransportOpsPolicyRepository extends JpaRepository<TransportOpsPolicy, Long> {
    Optional<TransportOpsPolicy> findByTenantIdAndExceptionCodeAndIsDeletedFalse(String tenantId, String exceptionCode);

    List<TransportOpsPolicy> findByTenantIdAndIsDeletedFalseOrderByExceptionCodeAsc(String tenantId);
}
