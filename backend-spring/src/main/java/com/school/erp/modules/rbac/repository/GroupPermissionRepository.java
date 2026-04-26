package com.school.erp.modules.rbac.repository;

import com.school.erp.modules.rbac.entity.GroupPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupPermissionRepository extends JpaRepository<GroupPermission, Long> {

    List<GroupPermission> findByPermissionGroupIdOrderByPermissionCodeAsc(Long permissionGroupId);

    @Modifying
    @Query("delete from GroupPermission g where g.permissionGroup.id = :gid")
    int deleteByPermissionGroupId(@Param("gid") Long permissionGroupId);
}
