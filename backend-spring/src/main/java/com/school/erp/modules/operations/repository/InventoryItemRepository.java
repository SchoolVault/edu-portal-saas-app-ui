package com.school.erp.modules.operations.repository;

import com.school.erp.modules.operations.entity.InventoryItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    List<InventoryItem> findByTenantIdAndIsDeletedFalseOrderByNameAsc(String tenantId);

    Page<InventoryItem> findByTenantIdAndIsDeletedFalseOrderByNameAsc(String tenantId, Pageable pageable);

    Optional<InventoryItem> findByTenantIdAndSkuAndIsDeletedFalse(String tenantId, String sku);

    Optional<InventoryItem> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    @Query("""
            SELECT i FROM InventoryItem i
            WHERE i.tenantId = :tenantId
              AND i.isDeleted = false
              AND (
                LOWER(COALESCE(i.sku, '')) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(COALESCE(i.name, '')) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(COALESCE(i.category, '')) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(COALESCE(i.location, '')) LIKE LOWER(CONCAT('%', :q, '%'))
              )
            ORDER BY i.name ASC
            """)
    Page<InventoryItem> searchByTenantAndQuery(
            @Param("tenantId") String tenantId,
            @Param("q") String q,
            Pageable pageable);
}
