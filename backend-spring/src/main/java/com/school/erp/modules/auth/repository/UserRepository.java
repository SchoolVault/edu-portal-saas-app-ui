package com.school.erp.modules.auth.repository;

import com.school.erp.modules.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailAndTenantIdAndIsDeletedFalse(String email, String tenantId);
    Optional<User> findByEmailAndSchoolCodeAndIsDeletedFalse(String email, String schoolCode);
    boolean existsByEmailAndTenantId(String email, String tenantId);
    Optional<User> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
