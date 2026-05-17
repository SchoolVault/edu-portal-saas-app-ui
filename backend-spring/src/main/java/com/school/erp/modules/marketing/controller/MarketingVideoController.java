package com.school.erp.modules.marketing.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.marketing.service.MarketingVideoService;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/v1/videos")
public class MarketingVideoController {
    private final MarketingVideoService service;

    public MarketingVideoController(MarketingVideoService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> list(
            @RequestParam(value = "featured", required = false) Boolean featured,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "tag", required = false) String tag,
            @RequestParam(value = "q", required = false) String q
    ) {
        var data = service.listPublic(featured, category, tag, q);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(5, TimeUnit.MINUTES).cachePublic())
                .body(ApiResponse.ok(data));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<?>> bySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.ok(service.bySlug(slug)));
    }
}
