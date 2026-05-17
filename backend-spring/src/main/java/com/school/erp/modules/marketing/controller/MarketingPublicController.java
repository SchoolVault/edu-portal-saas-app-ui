package com.school.erp.modules.marketing.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.marketing.dto.MarketingDTOs;
import com.school.erp.modules.marketing.service.MarketingPublicService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Marketing", description = "Public website and lead capture APIs")
public class MarketingPublicController {
    private final MarketingPublicService service;

    public MarketingPublicController(MarketingPublicService service) {
        this.service = service;
    }

    @PostMapping("/leads")
    public ResponseEntity<ApiResponse<MarketingDTOs.LeadResponse>> createLead(
            @Valid @RequestBody MarketingDTOs.LeadCreateRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest http
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(service.createLead(request, idempotencyKey, http)));
    }

    @PostMapping("/contact/callback")
    public ResponseEntity<ApiResponse<MarketingDTOs.LeadResponse>> callback(
            @Valid @RequestBody MarketingDTOs.CallbackRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest http
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(service.createCallbackLead(request, idempotencyKey, http)));
    }

    @PostMapping("/newsletter/subscribe")
    public ResponseEntity<ApiResponse<Map<String, Object>>> subscribe(
            @Valid @RequestBody MarketingDTOs.NewsletterRequest request
    ) {
        final boolean created = service.subscribeNewsletter(request);
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "subscribed", true,
                "alreadyExists", !created
        )));
    }

    @GetMapping("/features")
    public ResponseEntity<ApiResponse<?>> listFeatures() {
        return ResponseEntity.ok(ApiResponse.ok(service.listFeatures()));
    }

    @GetMapping("/features/{slug}")
    public ResponseEntity<ApiResponse<MarketingDTOs.FeatureResponse>> featureBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.ok(service.getFeature(slug)));
    }

    @GetMapping("/testimonials")
    public ResponseEntity<ApiResponse<?>> testimonials(@RequestParam(defaultValue = "false") boolean featured) {
        return ResponseEntity.ok(ApiResponse.ok(service.listTestimonials(featured)));
    }
}
