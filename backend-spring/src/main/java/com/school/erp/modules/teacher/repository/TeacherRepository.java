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

    @Query("SELECT t FROM Teacher t WHERE t.tenantId = :tenantId AND t.isDeleted = false AND " +
           "(LOWER(CONCAT(t.firstName, ' ', t.lastName)) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(COALESCE(t.email, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(COALESCE(t.specialization, '')) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(t.userId IS NULL OR t.userId NOT IN (" +
           "SELECT u.id FROM User u WHERE u.tenantId = :tenantId AND u.isDeleted = false AND u.role IN :excludedRoles))")
    Page<Teacher> findByTenantIdAndSearchExcludingPortalRoles(
            @Param("tenantId") String tenantId,
            @Param("search") String search,
            @Param("excludedRoles") java.util.Collection<com.school.erp.common.enums.Enums.Role> excludedRoles,
            Pageable pageable);

    @Query("SELECT t FROM Teacher t WHERE t.tenantId = :tenantId AND t.isDeleted = false AND " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:subject IS NULL OR EXISTS (" +
           "SELECT s FROM Teacher tx JOIN tx.subjects s " +
           "WHERE tx.id = t.id AND LOWER(s) LIKE LOWER(CONCAT('%', :subject, '%')))) AND " +
           "(LOWER(CONCAT(t.firstName, ' ', t.lastName)) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(COALESCE(t.email, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(COALESCE(t.specialization, '')) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(t.userId IS NULL OR t.userId NOT IN (" +
           "SELECT u.id FROM User u WHERE u.tenantId = :tenantId AND u.isDeleted = false AND u.role IN :excludedRoles))")
    Page<Teacher> findByTenantIdAndSearchAndStatusAndSubjectExcludingPortalRoles(
            @Param("tenantId") String tenantId,
            @Param("search") String search,
            @Param("status") com.school.erp.common.enums.Enums.TeacherStatus status,
            @Param("subject") String subject,
            @Param("excludedRoles") java.util.Collection<com.school.erp.common.enums.Enums.Role> excludedRoles,
            Pageable pageable);
    
    @Query("SELECT t FROM Teacher t WHERE t.tenantId = :tenantId AND t.isDeleted = false AND " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(LOWER(CONCAT(t.firstName, ' ', t.lastName)) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(COALESCE(t.email, '')) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(COALESCE(t.specialization, '')) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "t.userId IN (SELECT u.id FROM User u WHERE u.tenantId = :tenantId AND u.isDeleted = false AND u.role IN :staffRoles)")
    Page<Teacher> findStaffByTenantIdAndSearchAndStatus(
            @Param("tenantId") String tenantId,
            @Param("search") String search,
            @Param("status") com.school.erp.common.enums.Enums.TeacherStatus status,
            @Param("staffRoles") java.util.Collection<com.school.erp.common.enums.Enums.Role> staffRoles,
            Pageable pageable);
    Optional<Teacher> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
    Optional<Teacher> findByTenantIdAndUserIdAndIsDeletedFalse(String tenantId, Long userId);

    /** All active teacher rows for a portal user (normally one; demo/legacy data may duplicate). */
    List<Teacher> findAllByTenantIdAndUserIdAndIsDeletedFalseOrderByIdAsc(String tenantId, Long userId);
    List<Teacher> findByTenantIdAndIsDeletedFalse(String tenantId);
    long countByTenantIdAndIsDeletedFalse(String tenantId);
    long countByIsDeletedFalse();

    boolean existsByTenantIdAndEmailAndIsDeletedFalse(String tenantId, String email);

    Optional<Teacher> findByTenantIdAndEmailIgnoreCaseAndIsDeletedFalse(String tenantId, String email);

    Optional<Teacher> findByTenantIdAndPhoneAndIsDeletedFalse(String tenantId, String phone);
    Optional<Teacher> findByTenantIdAndEmployeeCodeAndIsDeletedFalse(String tenantId, String employeeCode);

    boolean existsByTenantIdAndPhoneAndIsDeletedFalse(String tenantId, String phone);
    boolean existsByTenantIdAndEmployeeCodeAndIsDeletedFalse(String tenantId, String employeeCode);
}
