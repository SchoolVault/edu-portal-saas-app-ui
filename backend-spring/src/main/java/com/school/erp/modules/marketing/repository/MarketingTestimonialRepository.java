package com.school.erp.modules.marketing.repository;

import com.school.erp.modules.marketing.entity.MarketingTestimonial;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MarketingTestimonialRepository extends JpaRepository<MarketingTestimonial, String> {
    List<MarketingTestimonial> findByPublishedTrueOrderByDisplayOrderAsc();
    List<MarketingTestimonial> findByPublishedTrueAndFeaturedTrueOrderByDisplayOrderAsc();
}
