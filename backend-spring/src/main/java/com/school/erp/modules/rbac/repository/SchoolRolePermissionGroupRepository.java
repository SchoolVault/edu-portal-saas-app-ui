package com.school.erp.modules.rbac.repository;

import com.school.erp.modules.rbac.entity.SchoolRolePermissionGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SchoolRolePermissionGroupRepository extends JpaRepository<SchoolRolePermissionGroup, Long> {

    long countBySchoolRoleId(Long schoolRoleId);

    long countByPermissionGroupId(Long permissionGroupId);

    @Modifying
    @Query("delete from SchoolRolePermissionGroup s where s.schoolRole.id = :rid")
    int deleteBySchoolRoleId(@Param("rid") Long schoolRoleId);

    @Modifying
    @Query("delete from SchoolRolePermissionGroup s where s.permissionGroup.id = :gid")
    int deleteByPermissionGroupId(@Param("gid") Long permissionGroupId);

    @Query(
            "select s.permissionGroup.id from SchoolRolePermissionGroup s where s.schoolRole.id = :rid order by s.sortOrder asc, s.permissionGroup.id asc")
    List<Long> findPermissionGroupIdsBySchoolRoleId(@Param("rid") Long schoolRoleId);

    @Query(
            value =
                    """
            select distinct gp.permission_code from rbac_group_permission gp
            inner join rbac_school_role_permission_group srg on srg.permission_group_id = gp.permission_group_id
            inner join rbac_permission_group pg on pg.id = gp.permission_group_id
            where srg.school_role_id = :roleId and pg.is_deleted = 0 and pg.tenant_id = :tid
            """,
            nativeQuery = true)
    List<String> findDistinctPermissionCodesBySchoolRole(
            @Param("tid") String tenantId, @Param("roleId") long schoolRoleId);

    @Query(
            """
            select pg.id, pg.code, pg.name from SchoolRolePermissionGroup s
            join s.permissionGroup pg
            where s.schoolRole.id = :rid and pg.isDeleted = false
            order by s.sortOrder asc, pg.name asc
            """)
    List<Object[]> findLinkedGroupSummaries(@Param("rid") long schoolRoleId);
}
