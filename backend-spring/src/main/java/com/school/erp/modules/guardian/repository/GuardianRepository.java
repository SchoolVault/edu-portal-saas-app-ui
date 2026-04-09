package com.school.erp.modules.guardian.repository;

import com.school.erp.modules.guardian.entity.Guardian;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GuardianRepository extends JpaRepository<Guardian, Long> {

    Optional<Guardian> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    List<Guardian> findByTenantIdAndPrimaryPhoneAndIsDeletedFalse(String tenantId, String primaryPhone);

    List<Guardian> findByTenantIdAndIsDeletedFalseAndFullNameContainingIgnoreCase(String tenantId, String namePart);
}
