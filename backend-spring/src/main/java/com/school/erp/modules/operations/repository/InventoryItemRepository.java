package com.school.erp.modules.operations.repository;

import com.school.erp.modules.operations.entity.InventoryItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    List<InventoryItem> findByTenantIdAndIsDeletedFalseOrderByNameAsc(String tenantId);

    Page<InventoryItem> findByTenantIdAndIsDeletedFalseOrderByNameAsc(String tenantId, Pageable pageable);

    Optional<InventoryItem> findByTenantIdAndSkuAndIsDeletedFalse(String tenantId, String sku);

    Optional<InventoryItem> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
