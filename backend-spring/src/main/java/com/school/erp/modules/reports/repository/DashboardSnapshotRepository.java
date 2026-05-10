package com.school.erp.modules.reports.repository;

import com.school.erp.modules.reports.entity.DashboardSnapshot;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface DashboardSnapshotRepository extends JpaRepository<DashboardSnapshot, Long> {

    List<DashboardSnapshot> findAllByTenantIdAndSnapshotTypeAndRoleCodeAndScopeKeyAndWindowStartAndWindowEndAndIsDeletedFalseOrderByUpdatedAtDescIdDesc(
            String tenantId,
            String snapshotType,
            String roleCode,
            String scopeKey,
            LocalDate windowStart,
            LocalDate windowEnd);

    Page<DashboardSnapshot> findByRefreshRequiredTrueAndIsDeletedFalseOrderByUpdatedAtAsc(Pageable pageable);
    long countByRefreshRequiredTrueAndIsDeletedFalse();
    long countByIsDeletedFalse();
    long countByGeneratedAtBeforeAndIsDeletedFalse(LocalDateTime cutoff);

    @Query("""
            select s from DashboardSnapshot s
            where s.isDeleted = false and s.generatedAt is not null and s.generatedAt < :cutoff
            order by s.generatedAt asc
            """)
    Page<DashboardSnapshot> findStaleSnapshots(@Param("cutoff") LocalDateTime cutoff, Pageable pageable);

    @Modifying
    @Query("""
            update DashboardSnapshot s
            set s.refreshRequired = true,
                s.cacheVersion = s.cacheVersion + 1
            where s.tenantId = :tenantId and s.isDeleted = false
            """)
    int markRefreshRequiredForTenant(@Param("tenantId") String tenantId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update DashboardSnapshot s
            set s.refreshRequired = true,
                s.cacheVersion = s.cacheVersion + 1
            where s.isDeleted = false
            """)
    int markRefreshRequiredAll();

    @Query("select distinct s.tenantId from DashboardSnapshot s where s.isDeleted = false")
    List<String> findDistinctTenantIds();
}
