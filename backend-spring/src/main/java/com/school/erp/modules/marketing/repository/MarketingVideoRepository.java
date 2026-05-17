package com.school.erp.modules.marketing.repository;

import com.school.erp.modules.marketing.entity.MarketingVideo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MarketingVideoRepository extends JpaRepository<MarketingVideo, String> {
    Optional<MarketingVideo> findBySlugAndPublishedTrue(String slug);

    @Query("""
            select v from MarketingVideo v
            where v.published = true
            and (:featured is null or v.featured = :featured)
            and (:category is null or lower(v.category) = lower(:category))
            and (:tag is null or lower(v.tags) like lower(concat('%', :tag, '%')))
            and (:q is null or lower(v.title) like lower(concat('%', :q, '%')) or lower(v.summary) like lower(concat('%', :q, '%')))
            order by v.displayOrder asc
            """)
    List<MarketingVideo> searchPublic(
            @Param("featured") Boolean featured,
            @Param("category") String category,
            @Param("tag") String tag,
            @Param("q") String q
    );

    @Query("""
            select v from MarketingVideo v
            where (:published is null or v.published = :published)
            and (:category is null or lower(v.category) = lower(:category))
            and (:tag is null or lower(v.tags) like lower(concat('%', :tag, '%')))
            and (:q is null or lower(v.title) like lower(concat('%', :q, '%')) or lower(v.slug) like lower(concat('%', :q, '%')))
            """)
    Page<MarketingVideo> searchAdmin(
            @Param("q") String q,
            @Param("category") String category,
            @Param("tag") String tag,
            @Param("published") Boolean published,
            Pageable pageable
    );
}
