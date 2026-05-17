package com.school.erp.modules.marketing.service;

import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.marketing.dto.MarketingDTOs;
import com.school.erp.modules.marketing.entity.MarketingFeatureModule;
import com.school.erp.modules.marketing.entity.MarketingLead;
import com.school.erp.modules.marketing.entity.MarketingNewsletterSubscriber;
import com.school.erp.modules.marketing.repository.MarketingFeatureRepository;
import com.school.erp.modules.marketing.repository.MarketingLeadRepository;
import com.school.erp.modules.marketing.repository.MarketingNewsletterSubscriberRepository;
import com.school.erp.modules.marketing.repository.MarketingTestimonialRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;

@Service
public class MarketingPublicService {
    private static final String LIVE_STATUS = "LIVE";
    private static final String NEW_STATUS = "NEW";

    private final MarketingLeadRepository leadRepository;
    private final MarketingFeatureRepository featureRepository;
    private final MarketingTestimonialRepository testimonialRepository;
    private final MarketingNewsletterSubscriberRepository newsletterSubscriberRepository;

    public MarketingPublicService(
            MarketingLeadRepository leadRepository,
            MarketingFeatureRepository featureRepository,
            MarketingTestimonialRepository testimonialRepository,
            MarketingNewsletterSubscriberRepository newsletterSubscriberRepository
    ) {
        this.leadRepository = leadRepository;
        this.featureRepository = featureRepository;
        this.testimonialRepository = testimonialRepository;
        this.newsletterSubscriberRepository = newsletterSubscriberRepository;
    }

    @Transactional
    public MarketingDTOs.LeadResponse createLead(MarketingDTOs.LeadCreateRequest req, String idempotencyKey, HttpServletRequest http) {
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            final MarketingLead existing = leadRepository.findByIdempotencyKey(idempotencyKey).orElse(null);
            if (existing != null) {
                return toLeadResponse(existing);
            }
        }

        final MarketingLead entity = new MarketingLead();
        entity.setFullName(req.fullName());
        entity.setWorkEmail(req.workEmail().trim().toLowerCase(Locale.ROOT));
        entity.setPhone(req.phone());
        entity.setSchoolName(req.schoolName());
        entity.setRole(req.role());
        entity.setStudentStrengthRange(req.studentStrengthRange());
        entity.setCity(req.city());
        entity.setCountry(req.country());
        entity.setMessage(req.message());
        entity.setPreferredContactTime(req.preferredContactTime());
        entity.setSource(req.source().trim().toUpperCase(Locale.ROOT));
        entity.setUtmSource(req.utmSource());
        entity.setUtmMedium(req.utmMedium());
        entity.setUtmCampaign(req.utmCampaign());
        entity.setPagePath(req.pagePath());
        entity.setStatus(NEW_STATUS);
        entity.setPrivacyConsent(Boolean.TRUE.equals(req.privacyConsent()));
        entity.setMarketingConsent(Boolean.TRUE.equals(req.marketingConsent()));
        entity.setIpHash(hashIp(http.getRemoteAddr()));
        entity.setUserAgent(http.getHeader("User-Agent"));
        entity.setIdempotencyKey(idempotencyKey == null || idempotencyKey.isBlank() ? null : idempotencyKey.trim());
        return toLeadResponse(leadRepository.save(entity));
    }

    @Transactional
    public MarketingDTOs.LeadResponse createCallbackLead(
            MarketingDTOs.CallbackRequest req, String idempotencyKey, HttpServletRequest http
    ) {
        final MarketingDTOs.LeadCreateRequest leadRequest = new MarketingDTOs.LeadCreateRequest(
                req.fullName(),
                req.workEmail() == null || req.workEmail().isBlank() ? "callback@" + sanitizeDomain(req.phone()) + ".local" : req.workEmail(),
                req.phone(),
                req.schoolName(),
                "Callback request",
                null,
                null,
                null,
                "Requested callback",
                req.preferredContactTime(),
                "CALLBACK",
                null,
                null,
                null,
                "/contact/callback",
                req.privacyConsent(),
                Boolean.FALSE
        );
        return createLead(leadRequest, idempotencyKey, http);
    }

    @Transactional(readOnly = true)
    public List<MarketingDTOs.FeatureResponse> listFeatures() {
        return featureRepository.findByEnabledForMarketingTrueAndStatusOrderBySortOrderAsc(LIVE_STATUS)
                .stream()
                .map(this::toFeatureResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public MarketingDTOs.FeatureResponse getFeature(String slug) {
        final MarketingFeatureModule feature = featureRepository
                .findBySlugAndEnabledForMarketingTrueAndStatus(slug, LIVE_STATUS)
                .orElseThrow(() -> new ResourceNotFoundException("Marketing feature not found"));
        return toFeatureResponse(feature);
    }

    @Transactional(readOnly = true)
    public List<MarketingDTOs.TestimonialResponse> listTestimonials(boolean featuredOnly) {
        if (featuredOnly) {
            return testimonialRepository.findByPublishedTrueAndFeaturedTrueOrderByDisplayOrderAsc()
                    .stream()
                    .map(t -> new MarketingDTOs.TestimonialResponse(
                            t.getId(), t.getName(), t.getDesignation(), t.getInstitution(),
                            t.getQuote(), t.getRating(), t.getAvatarUrl(), t.getFeatured()
                    ))
                    .toList();
        }
        return testimonialRepository.findByPublishedTrueOrderByDisplayOrderAsc()
                .stream()
                .map(t -> new MarketingDTOs.TestimonialResponse(
                        t.getId(), t.getName(), t.getDesignation(), t.getInstitution(),
                        t.getQuote(), t.getRating(), t.getAvatarUrl(), t.getFeatured()
                ))
                .toList();
    }

    @Transactional
    public boolean subscribeNewsletter(MarketingDTOs.NewsletterRequest req) {
        final String email = req.email().trim().toLowerCase(Locale.ROOT);
        final MarketingNewsletterSubscriber existing = newsletterSubscriberRepository.findByEmailIgnoreCase(email).orElse(null);
        if (existing != null) {
            if (!Boolean.TRUE.equals(existing.getActive())) {
                existing.setActive(true);
                newsletterSubscriberRepository.save(existing);
            }
            return false;
        }
        final MarketingNewsletterSubscriber subscriber = new MarketingNewsletterSubscriber();
        subscriber.setEmail(email);
        subscriber.setSource(req.source() == null || req.source().isBlank() ? "website" : req.source().trim());
        subscriber.setActive(true);
        newsletterSubscriberRepository.save(subscriber);
        return true;
    }

    private MarketingDTOs.FeatureResponse toFeatureResponse(MarketingFeatureModule m) {
        final List<String> highlights = m.getHighlights() == null || m.getHighlights().isBlank()
                ? List.of()
                : List.of(m.getHighlights().split("\\|"));
        return new MarketingDTOs.FeatureResponse(
                m.getSlug(),
                m.getName(),
                m.getCategory(),
                m.getShortDescription(),
                m.getDetailedDescription(),
                highlights
        );
    }

    private MarketingDTOs.LeadResponse toLeadResponse(MarketingLead lead) {
        return new MarketingDTOs.LeadResponse(
                lead.getId(),
                lead.getId().substring(0, 8).toUpperCase(Locale.ROOT),
                lead.getFullName(),
                lead.getWorkEmail(),
                lead.getPhone(),
                lead.getSchoolName(),
                lead.getStatus(),
                lead.getSource(),
                lead.getCreatedAt()
        );
    }

    private static String hashIp(String rawIp) {
        if (rawIp == null || rawIp.isBlank()) {
            return null;
        }
        try {
            final MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(rawIp.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            return null;
        }
    }

    private static String sanitizeDomain(String phone) {
        if (phone == null) {
            return "unknown";
        }
        final String digits = phone.replaceAll("[^0-9]", "");
        return digits.isBlank() ? "unknown" : digits;
    }
}
