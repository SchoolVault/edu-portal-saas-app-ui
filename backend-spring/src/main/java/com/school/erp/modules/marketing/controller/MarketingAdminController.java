package com.school.erp.modules.marketing.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.marketing.dto.MarketingDTOs;
import com.school.erp.modules.marketing.entity.MarketingFeatureModule;
import com.school.erp.modules.marketing.entity.MarketingTestimonial;
import com.school.erp.modules.marketing.repository.MarketingFeatureRepository;
import com.school.erp.modules.marketing.repository.MarketingTestimonialRepository;
import com.school.erp.modules.marketing.service.MarketingLeadAdminService;
import com.school.erp.modules.marketing.service.MarketingPublicService;
import com.school.erp.modules.marketing.service.MarketingVideoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/api/v1/admin/marketing", "/api/v1/admin"})
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
public class MarketingAdminController {
    private final MarketingVideoService videoService;
    private final MarketingLeadAdminService leadAdminService;
    private final MarketingPublicService marketingPublicService;
    private final MarketingFeatureRepository featureRepository;
    private final MarketingTestimonialRepository testimonialRepository;

    public MarketingAdminController(
            MarketingVideoService videoService,
            MarketingLeadAdminService leadAdminService,
            MarketingPublicService marketingPublicService,
            MarketingFeatureRepository featureRepository,
            MarketingTestimonialRepository testimonialRepository
    ) {
        this.videoService = videoService;
        this.leadAdminService = leadAdminService;
        this.marketingPublicService = marketingPublicService;
        this.featureRepository = featureRepository;
        this.testimonialRepository = testimonialRepository;
    }

    @GetMapping({"/videos", "/marketing/videos"})
    public ResponseEntity<ApiResponse<?>> listVideos(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) Boolean published,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "displayOrder,asc") String sort
    ) {
        return ResponseEntity.ok(ApiResponse.ok(videoService.listAdmin(q, category, tag, published, page, size, sort)));
    }

    @PostMapping({"/videos", "/marketing/videos"})
    public ResponseEntity<ApiResponse<?>> createVideo(@Valid @RequestBody MarketingDTOs.MarketingVideoUpsertRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(videoService.create(req)));
    }

    @PutMapping({"/videos/{id}", "/marketing/videos/{id}"})
    public ResponseEntity<ApiResponse<?>> updateVideo(
            @PathVariable String id,
            @Valid @RequestBody MarketingDTOs.MarketingVideoUpsertRequest req
    ) {
        return ResponseEntity.ok(ApiResponse.ok(videoService.update(id, req)));
    }

    @DeleteMapping({"/videos/{id}", "/marketing/videos/{id}"})
    public ResponseEntity<Void> deleteVideo(@PathVariable String id) {
        videoService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping({"/videos/bulk-publish", "/marketing/videos/bulk-publish"})
    public ResponseEntity<ApiResponse<?>> bulkPublish(@Valid @RequestBody MarketingDTOs.BulkPublishRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(videoService.bulkPublish(req)));
    }

    @GetMapping({"/leads", "/marketing/leads"})
    public ResponseEntity<ApiResponse<?>> listLeads(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(ApiResponse.ok(leadAdminService.listLeads(q, status, source, fromDate, toDate, page, size)));
    }

    @GetMapping({"/leads/dashboard", "/marketing/leads/dashboard"})
    public ResponseEntity<ApiResponse<?>> leadDashboard(
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate
    ) {
        return ResponseEntity.ok(ApiResponse.ok(leadAdminService.buildDashboard(fromDate, toDate)));
    }

    @PatchMapping({"/leads/{id}/status", "/marketing/leads/{id}/status"})
    public ResponseEntity<ApiResponse<?>> updateLeadStatus(
            @PathVariable String id,
            @Valid @RequestBody MarketingDTOs.LeadStatusUpdateRequest req
    ) {
        leadAdminService.updateStatus(id, req);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("updated", true)));
    }

    @GetMapping({"/features", "/marketing/features"})
    public ResponseEntity<ApiResponse<?>> adminFeatures() {
        return ResponseEntity.ok(ApiResponse.ok(featureRepository.findAll()));
    }

    @PostMapping({"/features", "/marketing/features"})
    public ResponseEntity<ApiResponse<?>> createFeature(@Valid @RequestBody MarketingDTOs.FeatureUpsertRequest req) {
        MarketingFeatureModule entity = new MarketingFeatureModule();
        applyFeature(entity, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(featureRepository.save(entity)));
    }

    @PutMapping({"/features/{id}", "/marketing/features/{id}"})
    public ResponseEntity<ApiResponse<?>> updateFeature(
            @PathVariable String id,
            @Valid @RequestBody MarketingDTOs.FeatureUpsertRequest req
    ) {
        MarketingFeatureModule entity = featureRepository.findById(id)
                .orElseThrow(() -> new com.school.erp.common.exception.ResourceNotFoundException("Feature not found"));
        applyFeature(entity, req);
        return ResponseEntity.ok(ApiResponse.ok(featureRepository.save(entity)));
    }

    @DeleteMapping({"/features/{id}", "/marketing/features/{id}"})
    public ResponseEntity<Void> deleteFeature(@PathVariable String id) {
        featureRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping({"/testimonials", "/marketing/testimonials"})
    public ResponseEntity<ApiResponse<?>> listTestimonials() {
        return ResponseEntity.ok(ApiResponse.ok(testimonialRepository.findAll()));
    }

    @PostMapping({"/testimonials", "/marketing/testimonials"})
    public ResponseEntity<ApiResponse<?>> createTestimonial(@Valid @RequestBody MarketingDTOs.TestimonialUpsertRequest req) {
        MarketingTestimonial entity = new MarketingTestimonial();
        applyTestimonial(entity, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(testimonialRepository.save(entity)));
    }

    @PutMapping({"/testimonials/{id}", "/marketing/testimonials/{id}"})
    public ResponseEntity<ApiResponse<?>> updateTestimonial(
            @PathVariable String id,
            @Valid @RequestBody MarketingDTOs.TestimonialUpsertRequest req
    ) {
        MarketingTestimonial entity = testimonialRepository.findById(id)
                .orElseThrow(() -> new com.school.erp.common.exception.ResourceNotFoundException("Testimonial not found"));
        applyTestimonial(entity, req);
        return ResponseEntity.ok(ApiResponse.ok(testimonialRepository.save(entity)));
    }

    @DeleteMapping({"/testimonials/{id}", "/marketing/testimonials/{id}"})
    public ResponseEntity<Void> deleteTestimonial(@PathVariable String id) {
        testimonialRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private static void applyFeature(MarketingFeatureModule entity, MarketingDTOs.FeatureUpsertRequest req) {
        if (entity.getId() == null || entity.getId().isBlank()) {
            entity.setId(UUID.randomUUID().toString());
        }
        entity.setSlug(req.slug().trim().toLowerCase());
        entity.setName(req.name().trim());
        entity.setCategory(req.category().trim());
        entity.setShortDescription(req.shortDescription().trim());
        entity.setDetailedDescription(req.detailedDescription());
        entity.setHighlights(req.highlights());
        entity.setEnabledForMarketing(req.enabledForMarketing());
        entity.setSortOrder(req.sortOrder());
        entity.setStatus(req.status().trim().toUpperCase());
    }

    private static void applyTestimonial(MarketingTestimonial entity, MarketingDTOs.TestimonialUpsertRequest req) {
        if (entity.getId() == null || entity.getId().isBlank()) {
            entity.setId(UUID.randomUUID().toString());
        }
        entity.setName(req.name().trim());
        entity.setDesignation(req.designation());
        entity.setInstitution(req.institution());
        entity.setQuote(req.quote().trim());
        entity.setRating(req.rating());
        entity.setAvatarUrl(req.avatarUrl());
        entity.setFeatured(req.featured());
        entity.setPublished(req.published());
        entity.setDisplayOrder(req.displayOrder());
    }
}
