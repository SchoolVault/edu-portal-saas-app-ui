package com.school.erp.modules.hostel.repository;

import com.school.erp.modules.hostel.entity.HostelBillingProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HostelBillingProfileRepository extends JpaRepository<HostelBillingProfile, Long> {
    List<HostelBillingProfile> findByTenantIdAndIsDeletedFalseOrderByNextDueDateAsc(String tenantId);

    Optional<HostelBillingProfile> findByTenantIdAndStudentIdAndIsDeletedFalse(String tenantId, Long studentId);

    List<HostelBillingProfile> findByTenantIdAndAutoInvoiceEnabledTrueAndIsDeletedFalse(String tenantId);
}
