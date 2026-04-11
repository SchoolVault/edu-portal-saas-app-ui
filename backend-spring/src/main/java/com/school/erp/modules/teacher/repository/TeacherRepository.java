package com.school.erp.modules.teacher.repository;
import com.school.erp.modules.teacher.entity.Teacher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List; import java.util.Optional;
public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    Page<Teacher> findByTenantIdAndIsDeletedFalse(String tenantId, Pageable pageable);
    Optional<Teacher> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
    Optional<Teacher> findByTenantIdAndUserIdAndIsDeletedFalse(String tenantId, Long userId);
    List<Teacher> findByTenantIdAndIsDeletedFalse(String tenantId);
    long countByTenantIdAndIsDeletedFalse(String tenantId);
    long countByIsDeletedFalse();

    boolean existsByTenantIdAndEmailAndIsDeletedFalse(String tenantId, String email);
}
