package com.school.erp.modules.academic.repository;

import com.school.erp.modules.academic.entity.Section;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface SectionRepository extends JpaRepository<Section, Long> {
    List<Section> findByTenantIdAndClassIdAndIsDeletedFalse(String tenantId, Long classId);
    List<Section> findByTenantIdAndClassIdInAndIsDeletedFalse(String tenantId, List<Long> classIds);
    Page<Section> findByTenantIdAndIsDeletedFalseOrderByClassIdAscNameAsc(String tenantId, Pageable pageable);
    @Query("""
            SELECT s.classId, COUNT(s.id)
            FROM Section s
            WHERE s.tenantId = :tenantId
              AND s.isDeleted = false
              AND s.classId IN :classIds
            GROUP BY s.classId
            """)
    List<Object[]> countSectionsByClassIds(
            @Param("tenantId") String tenantId,
            @Param("classIds") List<Long> classIds);

    Optional<Section> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    List<Section> findByTenantIdAndClassTeacherIdAndIsDeletedFalse(String tenantId, Long classTeacherId);

    Optional<Section> findFirstByTenantIdAndClassIdAndNameIgnoreCaseAndIsDeletedFalse(String tenantId, Long classId, String name);
}
