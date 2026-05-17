package com.school.erp.modules.marketing.controller;

import com.school.erp.modules.marketing.service.MarketingBrochureService;
import com.school.erp.modules.marketing.service.MarketingPublicService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/brochure")
public class MarketingBrochureController {
    private final MarketingBrochureService brochureService;
    private final MarketingPublicService marketingPublicService;

    public MarketingBrochureController(MarketingBrochureService brochureService, MarketingPublicService marketingPublicService) {
        this.brochureService = brochureService;
        this.marketingPublicService = marketingPublicService;
    }

    @GetMapping
    public ResponseEntity<ByteArrayResource> download() {
        byte[] pdf = brochureService.generate(marketingPublicService.listFeatures());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"EduPortal-Brochure.pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdf.length)
                .body(new ByteArrayResource(pdf));
    }
}
