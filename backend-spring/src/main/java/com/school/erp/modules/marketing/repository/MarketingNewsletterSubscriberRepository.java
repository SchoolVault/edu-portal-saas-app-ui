package com.school.erp.modules.marketing.repository;

import com.school.erp.modules.marketing.entity.MarketingNewsletterSubscriber;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MarketingNewsletterSubscriberRepository extends JpaRepository<MarketingNewsletterSubscriber, String> {
    Optional<MarketingNewsletterSubscriber> findByEmailIgnoreCase(String email);
}
