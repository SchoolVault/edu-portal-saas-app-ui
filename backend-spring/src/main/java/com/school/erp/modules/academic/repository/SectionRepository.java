package com.school.erp.modules.academic.repository;

import com.school.erp.modules.academic.entity.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SectionRepository extends JpaRepository<Section, Long> {
    List<Section> findByTenantIdAndClassIdAndIsDeletedFalse(String tenantId, Long classId);

    Optional<Section> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
