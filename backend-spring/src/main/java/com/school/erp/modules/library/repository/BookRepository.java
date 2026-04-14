package com.school.erp.modules.library.repository;
import com.school.erp.modules.library.entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BookRepository extends JpaRepository<Book, Long> {
    boolean existsByTenantIdAndIsbnAndIsDeletedFalse(String tenantId, String isbn);

    List<Book> findByTenantIdAndIsDeletedFalse(String t);

    Optional<Book> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    @Query("""
            SELECT b FROM Book b WHERE b.tenantId = :tenantId AND (b.isDeleted = false OR b.isDeleted IS NULL)
              AND (LOWER(b.title) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(b.author) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(b.isbn) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:cat = '' OR LOWER(COALESCE(b.category, '')) = LOWER(:cat))
              AND (
                   :scope = 'ALL'
                   OR (:scope = 'ACTIVE' AND (b.isActive IS NULL OR b.isActive = true))
                   OR (:scope = 'INACTIVE' AND b.isActive = false)
              )
            """)
    Page<Book> pageBooks(@Param("tenantId") String tenantId, @Param("search") String search,
                         @Param("cat") String cat, @Param("scope") String scope, Pageable pageable);
}
