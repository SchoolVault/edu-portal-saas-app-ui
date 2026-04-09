package com.school.erp.modules.library.repository;
import com.school.erp.modules.library.entity.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BookRepository extends JpaRepository<Book, Long> {
    List<Book> findByTenantIdAndIsDeletedFalse(String t);

    Optional<Book> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
