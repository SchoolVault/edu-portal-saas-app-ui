package com.school.erp.modules.student.port;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.student.entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Persistence port for student aggregate (JPA today; read replica / CQRS later).
 */
public interface StudentPersistencePort {

    Page<Student> findByTenantIdAndIsDeletedFalse(String tenantId, Pageable pageable);

    List<Student> findByTenantIdAndIsDeletedFalse(String tenantId);

    Optional<Student> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    List<Student> findByTenantIdAndClassIdAndIsDeletedFalse(String tenantId, Long classId);

    List<Student> findByTenantIdAndClassIdAndSectionIdAndIsDeletedFalse(String tenantId, Long classId, Long sectionId);

    List<Student> findByTenantIdAndParentIdAndIsDeletedFalse(String tenantId, Long parentId);

    long countByTenantIdAndParentIdAndIsDeletedFalse(String tenantId, Long parentId);

    List<Student> findByTenantIdAndIdInAndIsDeletedFalse(String tenantId, List<Long> ids);

    Page<Student> findByFilters(String tenantId, Long classId, Long sectionId, Enums.StudentStatus status, String search, Pageable pageable);

    Page<Student> findByFiltersClassScope(String tenantId, Collection<Long> classIds, Long classId, Long sectionId, Enums.StudentStatus status, String search, Pageable pageable);

    long countByTenantIdAndIsDeletedFalse(String tenantId);

    boolean existsByTenantIdAndAdmissionNumber(String tenantId, String admissionNumber);

    Student save(Student student);

    List<Student> saveAll(Iterable<Student> students);

    List<Student> findAllById(Iterable<Long> ids);
}
