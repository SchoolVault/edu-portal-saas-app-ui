package com.school.erp.modules.marketing.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public final class MarketingDTOs {
    private MarketingDTOs() {}

    public record LeadCreateRequest(
            @NotBlank @Size(max = 120) String fullName,
            @NotBlank @Email @Size(max = 180) String workEmail,
            @Size(max = 30) String phone,
            @Size(max = 180) String schoolName,
            @Size(max = 80) String role,
            @Size(max = 40) String studentStrengthRange,
            @Size(max = 80) String city,
            @Size(max = 80) String country,
            @Size(max = 2000) String message,
            @Size(max = 60) String preferredContactTime,
            @NotBlank @Size(max = 20) String source,
            @Size(max = 80) String utmSource,
            @Size(max = 80) String utmMedium,
            @Size(max = 80) String utmCampaign,
            @Size(max = 200) String pagePath,
            @NotNull Boolean privacyConsent,
            @NotNull Boolean marketingConsent
    ) {}

    public record CallbackRequest(
            @NotBlank @Size(max = 120) String fullName,
            @NotBlank @Size(max = 30) String phone,
            @Email @Size(max = 180) String workEmail,
            @Size(max = 180) String schoolName,
            @Size(max = 60) String preferredContactTime,
            @NotNull Boolean privacyConsent,
            @Size(max = 60) String website
    ) {}

    public record LeadResponse(
            String id,
            String reference,
            String fullName,
            String workEmail,
            String phone,
            String schoolName,
            String status,
            String source,
            LocalDateTime createdAt
    ) {}

    public record NewsletterRequest(
            @NotBlank @Email @Size(max = 180) String email,
            @Size(max = 80) String source
    ) {}

    public record FeatureResponse(
            String slug,
            String name,
            String category,
            String shortDescription,
            String detailedDescription,
            List<String> highlights
    ) {}

    public record TestimonialResponse(
            String id,
            String name,
            String designation,
            String institution,
            String quote,
            Integer rating,
            String avatarUrl,
            Boolean featured
    ) {}

    public record MarketingVideoResponse(
            String id,
            String slug,
            String title,
            String summary,
            String youtubeUrl,
            String thumbnailUrl,
            String category,
            List<String> tags,
            Boolean featured,
            Boolean published,
            Integer displayOrder,
            LocalDateTime updatedAt
    ) {}

    public record MarketingVideoUpsertRequest(
            @NotBlank @Size(max = 120) String slug,
            @NotBlank @Size(max = 220) String title,
            @Size(max = 1000) String summary,
            @NotBlank @Size(max = 600) String youtubeUrl,
            @Size(max = 600) String thumbnailUrl,
            @Size(max = 80) String category,
            @Size(max = 500) String tags,
            @NotNull Boolean featured,
            @NotNull Boolean published,
            @NotNull Integer displayOrder
    ) {}

    public record BulkPublishRequest(
            @NotNull List<String> ids,
            @NotNull Boolean published
    ) {}

    public record LeadStatusUpdateRequest(
            @NotBlank @Size(max = 20) String status,
            @Size(max = 1000) String note
    ) {}

    public record LeadAdminResponse(
            String id,
            String fullName,
            String workEmail,
            String phone,
            String schoolName,
            String source,
            String status,
            String message,
            String notes,
            LocalDateTime createdAt
    ) {}

    public record LeadAnalyticsBucket(
            String key,
            long count
    ) {}

    public record LeadAnalyticsTrendPoint(
            String label,
            long count
    ) {}

    public record LeadDashboardResponse(
            long totalLeads,
            long leadsLast7Days,
            long leadsLast30Days,
            long newLeads,
            long qualifiedLeads,
            long contactedLeads,
            long closedLeads,
            List<LeadAnalyticsBucket> byStatus,
            List<LeadAnalyticsBucket> bySource,
            List<LeadAnalyticsBucket> topSchools,
            List<LeadAnalyticsTrendPoint> trend
    ) {}

    public record FeatureUpsertRequest(
            @NotBlank @Size(max = 80) String slug,
            @NotBlank @Size(max = 120) String name,
            @NotBlank @Size(max = 60) String category,
            @NotBlank @Size(max = 280) String shortDescription,
            String detailedDescription,
            @Size(max = 1000) String highlights,
            @NotNull Boolean enabledForMarketing,
            @NotNull Integer sortOrder,
            @NotBlank @Size(max = 20) String status
    ) {}

    public record TestimonialUpsertRequest(
            @NotBlank @Size(max = 120) String name,
            @Size(max = 120) String designation,
            @Size(max = 180) String institution,
            @NotBlank @Size(max = 1500) String quote,
            @NotNull Integer rating,
            @Size(max = 400) String avatarUrl,
            @NotNull Boolean featured,
            @NotNull Boolean published,
            @NotNull Integer displayOrder
    ) {}
}
