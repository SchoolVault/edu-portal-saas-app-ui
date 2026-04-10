package com.school.erp.modules.auth.repository;

import com.school.erp.modules.auth.entity.User;
import com.school.erp.common.enums.Enums;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailAndTenantIdAndIsDeletedFalse(String email, String tenantId);
    Optional<User> findByEmailAndSchoolCodeAndIsDeletedFalse(String email, String schoolCode);

    boolean existsByEmailAndTenantIdAndIsDeletedFalse(String email, String tenantId);

    boolean existsByEmailAndTenantId(String email, String tenantId);
    Optional<User> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    Optional<User> findByIdAndIsDeletedFalse(Long id);
    List<User> findByTenantIdAndRoleAndIsDeletedFalse(String tenantId, Enums.Role role);
    long countByRoleAndIsDeletedFalse(Enums.Role role);
    long countByTenantIdAndRoleAndIsDeletedFalse(String tenantId, Enums.Role role);

    List<User> findByTenantIdAndIsDeletedFalseOrderByNameAsc(String tenantId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE User u SET u.isActive = false WHERE u.tenantId = :tenantId AND u.isDeleted = false")
    int deactivateAllByTenantId(@Param("tenantId") String tenantId);
}
