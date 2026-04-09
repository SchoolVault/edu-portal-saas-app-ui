package com.school.erp.modules.documents.repository;
import com.school.erp.modules.documents.entity.Document;
import com.school.erp.common.enums.Enums;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    Optional<Document> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    List<Document> findByTenantIdAndIsDeletedFalse(String t);

    List<Document> findByTenantIdAndOwnerTypeAndOwnerIdAndIsDeletedFalse(
            String tenantId, Enums.DocumentOwnerType ownerType, Long ownerId);
}
