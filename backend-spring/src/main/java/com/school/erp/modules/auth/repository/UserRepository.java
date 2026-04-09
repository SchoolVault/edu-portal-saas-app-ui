package com.school.erp.modules.auth.repository;

import com.school.erp.modules.auth.entity.User;
import com.school.erp.common.enums.Enums;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailAndTenantIdAndIsDeletedFalse(String email, String tenantId);
    Optional<User> findByEmailAndSchoolCodeAndIsDeletedFalse(String email, String schoolCode);
    boolean existsByEmailAndTenantId(String email, String tenantId);
    Optional<User> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
    List<User> findByTenantIdAndRoleAndIsDeletedFalse(String tenantId, Enums.Role role);
    long countByRoleAndIsDeletedFalse(Enums.Role role);
    long countByTenantIdAndRoleAndIsDeletedFalse(String tenantId, Enums.Role role);
}
