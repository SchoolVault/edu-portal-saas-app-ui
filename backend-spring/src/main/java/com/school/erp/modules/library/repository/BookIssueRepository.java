package com.school.erp.modules.library.repository;
import com.school.erp.common.enums.Enums;
import com.school.erp.modules.library.entity.BookIssue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BookIssueRepository extends JpaRepository<BookIssue, Long> {
    long countByTenantIdAndIsDeletedFalse(String tenantId);

    List<BookIssue> findByTenantIdAndIsDeletedFalse(String t);
    List<BookIssue> findByTenantIdAndStudentIdAndIsDeletedFalse(String t, Long studentId);

    Optional<BookIssue> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    Page<BookIssue> findByTenantIdAndIsDeletedFalseOrderByIssueDateDesc(String tenantId, Pageable pageable);

    Page<BookIssue> findByTenantIdAndStatusAndIsDeletedFalseOrderByIssueDateDesc(String tenantId, Enums.BookIssueStatus status, Pageable pageable);

    @Query("""
            SELECT i FROM BookIssue i WHERE i.tenantId = :t AND (i.isDeleted = false OR i.isDeleted IS NULL)
              AND i.status = 'ISSUED' AND i.dueDate < :today
            ORDER BY i.dueDate ASC
            """)
    Page<BookIssue> pageOverdue(@Param("t") String t, @Param("today") LocalDate today, Pageable pageable);
}
