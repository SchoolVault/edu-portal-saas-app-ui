package com.school.erp.modules.library.repository;
import com.school.erp.modules.library.entity.BookIssue; import org.springframework.data.jpa.repository.JpaRepository; import java.util.List;
public interface BookIssueRepository extends JpaRepository<BookIssue, Long> { List<BookIssue> findByTenantIdAndIsDeletedFalse(String t); List<BookIssue> findByTenantIdAndStudentIdAndIsDeletedFalse(String t, Long studentId); }
