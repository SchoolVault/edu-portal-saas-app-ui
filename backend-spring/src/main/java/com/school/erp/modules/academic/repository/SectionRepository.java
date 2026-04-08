package com.school.erp.modules.academic.repository;

import com.school.erp.modules.academic.entity.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SectionRepository extends JpaRepository<Section, Long> {
    List<Section> findByTenantIdAndClassIdAndIsDeletedFalse(String tenantId, Long classId);
}
