package com.school.erp.modules.feesv2.repository;

import com.school.erp.modules.feesv2.entity.FeeV2AuditEvent;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeeV2AuditEventRepository extends JpaRepository<FeeV2AuditEvent, Long> {
    List<FeeV2AuditEvent> findTop200ByTenantIdAndAcademicYearIdOrderByCreatedAtDesc(String tenantId, Long academicYearId);
}
