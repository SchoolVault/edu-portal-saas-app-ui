package com.school.erp.modules.library.repository;

import com.school.erp.modules.library.entity.LibraryReservation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LibraryReservationRepository extends JpaRepository<LibraryReservation, Long> {
    List<LibraryReservation> findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId);
    List<LibraryReservation> findByTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId, String status);
    Optional<LibraryReservation> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
