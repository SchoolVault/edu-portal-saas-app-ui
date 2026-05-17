package com.school.erp.modules.marketing.repository;

import com.school.erp.modules.marketing.entity.MarketingLead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface MarketingLeadRepository extends JpaRepository<MarketingLead, String>, JpaSpecificationExecutor<MarketingLead> {
    Optional<MarketingLead> findByIdempotencyKey(String idempotencyKey);

    long countByStatusIgnoreCase(String status);

    @Query("""
            select upper(l.status) as key, count(l) as count
            from MarketingLead l
            where (:fromAt is null or l.createdAt >= :fromAt)
              and (:toAt is null or l.createdAt <= :toAt)
            group by upper(l.status)
            order by count(l) desc
            """)
    java.util.List<BucketProjection> groupByStatus(@Param("fromAt") LocalDateTime fromAt, @Param("toAt") LocalDateTime toAt);

    @Query("""
            select upper(l.source) as key, count(l) as count
            from MarketingLead l
            where (:fromAt is null or l.createdAt >= :fromAt)
              and (:toAt is null or l.createdAt <= :toAt)
            group by upper(l.source)
            order by count(l) desc
            """)
    java.util.List<BucketProjection> groupBySource(@Param("fromAt") LocalDateTime fromAt, @Param("toAt") LocalDateTime toAt);

    @Query("""
            select coalesce(l.schoolName, 'Unknown') as key, count(l) as count
            from MarketingLead l
            where (:fromAt is null or l.createdAt >= :fromAt)
              and (:toAt is null or l.createdAt <= :toAt)
            group by l.schoolName
            order by count(l) desc
            """)
    java.util.List<BucketProjection> groupBySchool(@Param("fromAt") LocalDateTime fromAt, @Param("toAt") LocalDateTime toAt);

    @Query(value = """
            select date(created_at) as day, count(*) as total
            from marketing_leads
            where (:fromAt is null or created_at >= :fromAt)
              and (:toAt is null or created_at <= :toAt)
            group by date(created_at)
            order by day asc
            """, nativeQuery = true)
    java.util.List<DayCountProjection> groupByDay(@Param("fromAt") LocalDateTime fromAt, @Param("toAt") LocalDateTime toAt);

    interface BucketProjection {
        String getKey();
        long getCount();
    }

    interface DayCountProjection {
        String getDay();
        long getTotal();
    }
}
