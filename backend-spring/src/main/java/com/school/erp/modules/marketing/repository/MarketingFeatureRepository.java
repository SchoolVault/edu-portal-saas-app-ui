package com.school.erp.modules.marketing.repository;

import com.school.erp.modules.marketing.entity.MarketingFeatureModule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MarketingFeatureRepository extends JpaRepository<MarketingFeatureModule, String> {
    List<MarketingFeatureModule> findByEnabledForMarketingTrueAndStatusOrderBySortOrderAsc(String status);
    Optional<MarketingFeatureModule> findBySlugAndEnabledForMarketingTrueAndStatus(String slug, String status);
}
