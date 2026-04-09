package com.school.erp.modules.library.repository;
import com.school.erp.modules.library.entity.BookIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BookIssueRepository extends JpaRepository<BookIssue, Long> {
    long countByTenantIdAndIsDeletedFalse(String tenantId);

    List<BookIssue> findByTenantIdAndIsDeletedFalse(String t);
    List<BookIssue> findByTenantIdAndStudentIdAndIsDeletedFalse(String t, Long studentId);

    Optional<BookIssue> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
