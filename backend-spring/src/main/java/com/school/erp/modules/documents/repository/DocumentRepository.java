package com.school.erp.modules.documents.repository;
import com.school.erp.modules.documents.entity.Document;
import com.school.erp.common.enums.Enums;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    Optional<Document> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    List<Document> findByTenantIdAndIsDeletedFalse(String t);

    List<Document> findByTenantIdAndOwnerTypeAndOwnerIdAndIsDeletedFalse(
            String tenantId, Enums.DocumentOwnerType ownerType, Long ownerId);

    @Query("""
            SELECT d FROM Document d WHERE d.tenantId = :t AND (d.isDeleted = false OR d.isDeleted IS NULL)
              AND (:cat IS NULL OR d.category = :cat)
              AND (:ot IS NULL OR d.ownerType = :ot)
              AND (:oid IS NULL OR d.ownerId = :oid)
              AND (:q = '' OR LOWER(d.name) LIKE LOWER(CONCAT('%', :q, '%')))
            ORDER BY d.createdAt DESC
            """)
    Page<Document> pageFiltered(@Param("t") String t, @Param("cat") Enums.DocumentCategory cat,
                                @Param("ot") Enums.DocumentOwnerType ot, @Param("oid") Long oid,
                                @Param("q") String q, Pageable pageable);
}
