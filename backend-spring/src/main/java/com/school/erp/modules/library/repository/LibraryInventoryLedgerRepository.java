package com.school.erp.modules.library.repository;

import com.school.erp.modules.library.entity.LibraryInventoryLedger;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LibraryInventoryLedgerRepository extends JpaRepository<LibraryInventoryLedger, Long> {
    List<LibraryInventoryLedger> findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId);
}
