package com.school.erp.modules.exams.repository;
import com.school.erp.common.enums.Enums;
import com.school.erp.modules.exams.entity.Exam;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findByTenantIdAndIsDeletedFalse(String tenantId);

    Page<Exam> findByTenantIdAndIsDeletedFalse(String tenantId, Pageable pageable);

    Page<Exam> findByTenantIdAndIsDeletedFalseAndNameContainingIgnoreCase(String tenantId, String q, Pageable pageable);

    Page<Exam> findByTenantIdAndIsDeletedFalseAndStatus(String tenantId, Enums.ExamStatus status, Pageable pageable);

    Page<Exam> findByTenantIdAndIsDeletedFalseAndStatusAndNameContainingIgnoreCase(
            String tenantId, Enums.ExamStatus status, String q, Pageable pageable);

    Optional<Exam> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
