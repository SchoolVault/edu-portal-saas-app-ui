package com.school.erp.modules.transport.repository;

import com.school.erp.modules.transport.entity.StudentTransportMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StudentTransportMappingRepository extends JpaRepository<StudentTransportMapping, Long> {
    List<StudentTransportMapping> findByTenantIdAndRouteIdAndIsDeletedFalse(String t, Long routeId);
    List<StudentTransportMapping> findByTenantIdAndStudentIdAndIsDeletedFalse(String t, Long studentId);
}
