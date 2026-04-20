package com.school.erp.modules.guardian.repository;

import com.school.erp.modules.guardian.entity.StudentGuardianMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StudentGuardianMappingRepository extends JpaRepository<StudentGuardianMapping, Long> {

    List<StudentGuardianMapping> findByTenantIdAndStudentIdAndIsDeletedFalse(String tenantId, Long studentId);

    boolean existsByTenantIdAndStudentIdAndGuardianIdAndIsDeletedFalse(String tenantId, Long studentId, Long guardianId);

    java.util.Optional<StudentGuardianMapping> findByIdAndTenantIdAndStudentIdAndIsDeletedFalse(
            Long id, String tenantId, Long studentId);

    @Query(
            "SELECT DISTINCT m.studentId FROM StudentGuardianMapping m WHERE m.tenantId = :t AND m.isDeleted = false "
                    + "AND m.guardianId IN (SELECT g.id FROM Guardian g WHERE g.tenantId = :t AND g.isDeleted = false AND g.userId = :userId) ")
    List<Long> findStudentIdsLinkedToGuardianUser(
            @Param("t") String tenantId, @Param("userId") Long userId);

    @Query(
            "SELECT COUNT(m) > 0 FROM StudentGuardianMapping m, Guardian g WHERE m.guardianId = g.id AND m.tenantId = :t AND g.tenantId = :t "
                    + "AND m.studentId = :sid AND g.userId = :uid AND m.isDeleted = false AND g.isDeleted = false "
                    + "AND (m.effectiveTo IS NULL OR m.effectiveTo >= :today)")
    boolean existsActiveLinkForStudentAndGuardianUser(
            @Param("t") String tenantId, @Param("sid") Long studentId, @Param("uid") Long userId, @Param("today") LocalDate today);
}
