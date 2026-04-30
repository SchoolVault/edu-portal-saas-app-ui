package com.school.erp.modules.auth.repository;

import com.school.erp.modules.auth.entity.User;
import com.school.erp.common.enums.Enums;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailAndTenantIdAndIsDeletedFalse(String email, String tenantId);
    Optional<User> findByEmailAndSchoolCodeAndIsDeletedFalse(String email, String schoolCode);

    Optional<User> findByPhoneAndSchoolCodeAndIsDeletedFalse(String phone, String schoolCode);

    /**
     * Resolves a user when {@code phones} contains legacy variants of the same handset
     * (see {@link com.school.erp.common.util.InternationalPhone#compatibleLookupKeys}).
     */
    Optional<User> findFirstBySchoolCodeAndPhoneInAndIsDeletedFalseOrderByIdAsc(String schoolCode, Collection<String> phones);

    Optional<User> findByPhoneAndTenantIdAndIsDeletedFalse(String phone, String tenantId);
    Optional<User> findByTenantIdAndParentCodeAndIsDeletedFalse(String tenantId, String parentCode);

    boolean existsByTenantIdAndParentCodeAndIsDeletedFalse(String tenantId, String parentCode);

    boolean existsByPhoneAndTenantIdAndIsDeletedFalse(String phone, String tenantId);

    boolean existsByEmailAndTenantIdAndIsDeletedFalse(String email, String tenantId);

    boolean existsByEmailAndTenantId(String email, String tenantId);
    Optional<User> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    Optional<User> findByIdAndIsDeletedFalse(Long id);
    List<User> findByTenantIdAndIdInAndIsDeletedFalse(String tenantId, Collection<Long> ids);
    List<User> findByTenantIdAndRoleAndIsDeletedFalse(String tenantId, Enums.Role role);
    long countByRoleAndIsDeletedFalse(Enums.Role role);
    long countByTenantIdAndRoleAndIsDeletedFalse(String tenantId, Enums.Role role);

    List<User> findByTenantIdAndIsDeletedFalseOrderByNameAsc(String tenantId);

    List<User> findByTenantIdAndRoleInAndIsDeletedFalseOrderByNameAsc(String tenantId, Collection<Enums.Role> roles);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE User u SET u.isActive = false WHERE u.tenantId = :tenantId AND u.isDeleted = false")
    int deactivateAllByTenantId(@Param("tenantId") String tenantId);
}
