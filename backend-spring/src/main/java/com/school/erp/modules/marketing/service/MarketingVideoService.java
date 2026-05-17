package com.school.erp.modules.marketing.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.marketing.dto.MarketingDTOs;
import com.school.erp.modules.marketing.entity.MarketingVideo;
import com.school.erp.modules.marketing.repository.MarketingVideoRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class MarketingVideoService {
    private final MarketingVideoRepository repository;

    public MarketingVideoService(MarketingVideoRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<MarketingDTOs.MarketingVideoResponse> listPublic(Boolean featured, String category, String tag, String q) {
        return repository.searchPublic(featured, blankToNull(category), blankToNull(tag), blankToNull(q))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public MarketingDTOs.MarketingVideoResponse bySlug(String slug) {
        final MarketingVideo entity = repository.findBySlugAndPublishedTrue(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Marketing video not found"));
        return toResponse(entity);
    }

    @Transactional(readOnly = true)
    public PageResponse<MarketingDTOs.MarketingVideoResponse> listAdmin(
            String q, String category, String tag, Boolean published, int page, int size, String sort
    ) {
        String field = "displayOrder";
        Sort.Direction direction = Sort.Direction.ASC;
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            if (parts.length > 0 && !parts[0].isBlank()) {
                field = parts[0];
            }
            if (parts.length > 1 && "desc".equalsIgnoreCase(parts[1])) {
                direction = Sort.Direction.DESC;
            }
        }
        final Set<String> allowedSort = Set.of("displayOrder", "updatedAt", "title", "slug");
        if (!allowedSort.contains(field)) {
            field = "displayOrder";
        }
        final Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(direction, field));
        return PageResponse.fromSpringPage(repository.searchAdmin(
                blankToNull(q), blankToNull(category), blankToNull(tag), published, pageable
        ).map(this::toResponse));
    }

    @Transactional
    public MarketingDTOs.MarketingVideoResponse create(MarketingDTOs.MarketingVideoUpsertRequest req) {
        MarketingVideo entity = new MarketingVideo();
        mapUpsert(entity, req);
        return toResponse(repository.save(entity));
    }

    @Transactional
    public MarketingDTOs.MarketingVideoResponse update(String id, MarketingDTOs.MarketingVideoUpsertRequest req) {
        MarketingVideo entity = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Marketing video not found"));
        mapUpsert(entity, req);
        return toResponse(repository.save(entity));
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Marketing video not found");
        }
        repository.deleteById(id);
    }

    @Transactional
    public int bulkPublish(MarketingDTOs.BulkPublishRequest req) {
        int updated = 0;
        for (String id : req.ids()) {
            MarketingVideo entity = repository.findById(id).orElse(null);
            if (entity == null) {
                continue;
            }
            entity.setPublished(req.published());
            repository.save(entity);
            updated++;
        }
        return updated;
    }

    private void mapUpsert(MarketingVideo entity, MarketingDTOs.MarketingVideoUpsertRequest req) {
        entity.setSlug(req.slug().trim().toLowerCase(Locale.ROOT));
        entity.setTitle(req.title().trim());
        entity.setSummary(blankToNull(req.summary()));
        entity.setYoutubeUrl(req.youtubeUrl().trim());
        entity.setThumbnailUrl(blankToNull(req.thumbnailUrl()));
        entity.setCategory(blankToNull(req.category()));
        entity.setTags(blankToNull(req.tags()));
        entity.setFeatured(req.featured());
        entity.setPublished(req.published());
        entity.setDisplayOrder(req.displayOrder());
    }

    private MarketingDTOs.MarketingVideoResponse toResponse(MarketingVideo entity) {
        List<String> tags = entity.getTags() == null || entity.getTags().isBlank()
                ? List.of()
                : List.of(entity.getTags().split("\\s*,\\s*"));
        return new MarketingDTOs.MarketingVideoResponse(
                entity.getId(),
                entity.getSlug(),
                entity.getTitle(),
                entity.getSummary(),
                entity.getYoutubeUrl(),
                entity.getThumbnailUrl(),
                entity.getCategory(),
                tags,
                entity.getFeatured(),
                entity.getPublished(),
                entity.getDisplayOrder(),
                entity.getUpdatedAt()
        );
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
