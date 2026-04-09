package com.school.erp.modules.hostel.repository;

import com.school.erp.modules.hostel.entity.Hostel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HostelRepository extends JpaRepository<Hostel, Long> {
    List<Hostel> findByTenantIdAndIsDeletedFalse(String tenantId);

    Optional<Hostel> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
