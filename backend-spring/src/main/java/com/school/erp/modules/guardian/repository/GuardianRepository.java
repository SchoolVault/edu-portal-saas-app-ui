package com.school.erp.modules.guardian.repository;

import com.school.erp.modules.guardian.entity.Guardian;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface GuardianRepository extends JpaRepository<Guardian, Long> {

    Optional<Guardian> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    List<Guardian> findByTenantIdAndPrimaryPhoneAndIsDeletedFalse(String tenantId, String primaryPhone);

    /**
     * Match guardians whose {@code primary_phone} is any legacy or national variant of the same handset.
     */
    List<Guardian> findByTenantIdAndPrimaryPhoneInAndIsDeletedFalse(String tenantId, Collection<String> primaryPhones);

    List<Guardian> findByTenantIdAndIsDeletedFalseAndFullNameContainingIgnoreCase(String tenantId, String namePart);

    /** Portal user linked to a guardian profile (parent portal resolution via {@code StudentGuardianMapping}). */
    Optional<Guardian> findFirstByTenantIdAndUserIdAndIsDeletedFalse(String tenantId, Long userId);
}
