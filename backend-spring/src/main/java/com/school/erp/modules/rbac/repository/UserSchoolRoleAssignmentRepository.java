package com.school.erp.modules.rbac.repository;

import com.school.erp.modules.rbac.entity.UserSchoolRoleAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserSchoolRoleAssignmentRepository extends JpaRepository<UserSchoolRoleAssignment, Long> {

    List<UserSchoolRoleAssignment> findByTenantIdAndUserId(String tenantId, Long userId);

    @Query("SELECT a FROM UserSchoolRoleAssignment a JOIN FETCH a.schoolRole r WHERE a.tenantId = :t AND a.userId = :u")
    List<UserSchoolRoleAssignment> findByTenantIdAndUserIdFetchRoles(
            @Param("t") String tenantId, @Param("u") Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM UserSchoolRoleAssignment u WHERE u.tenantId = :tenantId AND u.userId = :userId")
    int deleteByTenantIdAndUserId(@Param("tenantId") String tenantId, @Param("userId") Long userId);

    long countByTenantIdAndUserId(String tenantId, Long userId);

    long countByTenantIdAndSchoolRole_Id(String tenantId, Long schoolRoleId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM UserSchoolRoleAssignment a WHERE a.tenantId = :t AND a.schoolRole.id = :rid")
    int deleteByTenantIdAndSchoolRoleId(@Param("t") String t, @Param("rid") Long schoolRoleId);
}
