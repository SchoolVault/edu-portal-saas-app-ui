package com.school.erp.modules.transport.repository;

import com.school.erp.modules.transport.entity.StudentTransportMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface StudentTransportMappingRepository extends JpaRepository<StudentTransportMapping, Long> {
    List<StudentTransportMapping> findByTenantIdAndRouteIdAndIsDeletedFalse(String t, Long routeId);

    List<StudentTransportMapping> findByTenantIdAndStudentIdAndIsDeletedFalse(String t, Long studentId);

    Optional<StudentTransportMapping> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
