package com.school.erp.modules.operations.repository;

import com.school.erp.modules.operations.entity.OperationalStaff;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OperationalStaffRepository extends JpaRepository<OperationalStaff, Long> {

    List<OperationalStaff> findByTenantIdAndIsDeletedFalseOrderByFullNameAsc(String tenantId);

    Page<OperationalStaff> findByTenantIdAndIsDeletedFalseOrderByFullNameAsc(String tenantId, Pageable pageable);

    @Query("SELECT s FROM OperationalStaff s WHERE s.tenantId = :tenantId AND s.isDeleted = false " +
            "AND (:isActive IS NULL OR s.isActive = :isActive) " +
            "AND (:search IS NULL OR LOWER(s.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(s.email,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(s.employeeCode,'')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(s.staffRole,'')) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<OperationalStaff> searchStaff(
            @Param("tenantId") String tenantId,
            @Param("search") String search,
            @Param("isActive") Boolean isActive,
            Pageable pageable);

    Optional<OperationalStaff> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    Optional<OperationalStaff> findByIdAndTenantId(Long id, String tenantId);

    Optional<OperationalStaff> findByTenantIdAndUserIdAndIsDeletedFalse(String tenantId, Long userId);

    Optional<OperationalStaff> findByTenantIdAndEmployeeCodeAndIsDeletedFalse(String tenantId, String employeeCode);

    Optional<OperationalStaff> findByTenantIdAndEmailIgnoreCaseAndIsDeletedFalse(String tenantId, String email);

    Optional<OperationalStaff> findByTenantIdAndPhoneAndIsDeletedFalse(String tenantId, String phone);
}
