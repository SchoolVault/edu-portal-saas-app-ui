package com.school.erp.modules.student.repository;

import com.school.erp.modules.student.entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    Page<Student> findByTenantIdAndIsDeletedFalse(String tenantId, Pageable pageable);

    List<Student> findByTenantIdAndIsDeletedFalse(String tenantId);

    Optional<Student> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    List<Student> findByTenantIdAndClassIdAndIsDeletedFalse(String tenantId, Long classId);

    List<Student> findByTenantIdAndClassIdAndSectionIdAndIsDeletedFalse(String tenantId, Long classId, Long sectionId);

    List<Student> findByTenantIdAndParentIdAndIsDeletedFalse(String tenantId, Long parentId);
    long countByTenantIdAndParentIdAndIsDeletedFalse(String tenantId, Long parentId);

    List<Student> findByTenantIdAndIdInAndIsDeletedFalse(String tenantId, List<Long> ids);

    @Query("SELECT s FROM Student s WHERE s.tenantId = :tenantId AND s.isDeleted = false " +
           "AND (:classId IS NULL OR s.classId = :classId) " +
           "AND (:status IS NULL OR s.status = :status) " +
           "AND (:search IS NULL OR LOWER(CONCAT(s.firstName, ' ', s.lastName)) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(s.admissionNumber) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Student> findByFilters(@Param("tenantId") String tenantId,
                                @Param("classId") Long classId,
                                @Param("status") com.school.erp.common.enums.Enums.StudentStatus status,
                                @Param("search") String search,
                                Pageable pageable);

    long countByTenantIdAndIsDeletedFalse(String tenantId);
    long countByIsDeletedFalse();

    boolean existsByTenantIdAndAdmissionNumber(String tenantId, String admissionNumber);
}
