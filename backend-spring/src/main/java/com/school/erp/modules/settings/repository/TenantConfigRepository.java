package com.school.erp.modules.settings.repository;

import com.school.erp.modules.settings.entity.TenantConfig;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TenantConfigRepository extends JpaRepository<TenantConfig, Long> {
    Optional<TenantConfig> findByTenantId(String t);
    Optional<TenantConfig> findBySchoolCode(String schoolCode);
    boolean existsBySchoolCode(String schoolCode);

    List<TenantConfig> findAllBySchoolCodeOrderBySchoolNameAsc(String schoolCode);

    @Query("SELECT t FROM TenantConfig t WHERE (t.isDeleted IS NULL OR t.isDeleted = false) AND "
            + "(:q IS NULL OR :q = '' OR LOWER(t.schoolName) LIKE LOWER(CONCAT('%', :q, '%')) "
            + "OR LOWER(t.schoolCode) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<TenantConfig> pageActiveSchools(@Param("q") String q, Pageable pageable);
}
