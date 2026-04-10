package com.school.erp.modules.operations.repository;

import com.school.erp.modules.operations.entity.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    List<InventoryItem> findByTenantIdAndIsDeletedFalseOrderByNameAsc(String tenantId);

    Optional<InventoryItem> findByTenantIdAndSkuAndIsDeletedFalse(String tenantId, String sku);

    Optional<InventoryItem> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
