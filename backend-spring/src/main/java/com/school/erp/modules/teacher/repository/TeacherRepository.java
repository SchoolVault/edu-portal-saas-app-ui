package com.school.erp.modules.teacher.repository;
import com.school.erp.modules.teacher.entity.Teacher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    Page<Teacher> findByTenantIdAndIsDeletedFalse(String tenantId, Pageable pageable);

    /**
     * Paged list with optional text match on name, email, or specialization.
     * When {@code search} is blank, {@code LIKE '%%'} matches all rows for that clause (same as no filter).
     */
    @Query("SELECT t FROM Teacher t WHERE t.tenantId = :tenantId AND t.isDeleted = false AND " +
           "(LOWER(CONCAT(t.firstName, ' ', t.lastName)) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(COALESCE(t.email, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(COALESCE(t.specialization, '')) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Teacher> findByTenantIdAndSearch(@Param("tenantId") String tenantId, @Param("search") String search, Pageable pageable);
    Optional<Teacher> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
    Optional<Teacher> findByTenantIdAndUserIdAndIsDeletedFalse(String tenantId, Long userId);
    List<Teacher> findByTenantIdAndIsDeletedFalse(String tenantId);
    long countByTenantIdAndIsDeletedFalse(String tenantId);
    long countByIsDeletedFalse();

    boolean existsByTenantIdAndEmailAndIsDeletedFalse(String tenantId, String email);
}
