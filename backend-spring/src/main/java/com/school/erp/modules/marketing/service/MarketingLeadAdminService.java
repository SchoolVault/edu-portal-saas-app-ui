package com.school.erp.modules.marketing.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.exception.ApiErrorCode;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.marketing.dto.MarketingDTOs;
import com.school.erp.modules.marketing.entity.MarketingLead;
import com.school.erp.modules.marketing.repository.MarketingLeadRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class MarketingLeadAdminService {
    private static final DateTimeFormatter DAY_LABEL = DateTimeFormatter.ofPattern("dd MMM", Locale.ROOT);
    private static final Set<String> ALLOWED_STATUSES = Set.of("NEW", "QUALIFIED", "CONTACTED", "CLOSED");
    private final MarketingLeadRepository leadRepository;

    public MarketingLeadAdminService(MarketingLeadRepository leadRepository) {
        this.leadRepository = leadRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<MarketingDTOs.LeadAdminResponse> listLeads(
            String q, String status, String source, LocalDate fromDate, LocalDate toDate, int page, int size
    ) {
        validateDateRange(fromDate, toDate);
        final Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        final LocalDateTime fromAt = fromDate == null ? null : fromDate.atStartOfDay();
        final LocalDateTime toAt = toDate == null ? null : toDate.plusDays(1).atStartOfDay().minusNanos(1);
        final String normalizedStatus = normalizeLeadStatusOrNull(status, false);
        final Specification<MarketingLead> spec = buildLeadSpec(q, normalizedStatus, source, fromAt, toAt);
        final var rows = leadRepository.findAll(spec, pageable).map(this::toLeadAdminResponse);
        return PageResponse.fromSpringPage(rows);
    }

    @Transactional(readOnly = true)
    public MarketingDTOs.LeadDashboardResponse buildDashboard(LocalDate fromDate, LocalDate toDate) {
        validateDateRange(fromDate, toDate);
        final LocalDateTime fromAt = fromDate == null ? null : fromDate.atStartOfDay();
        final LocalDateTime toAt = toDate == null ? null : toDate.plusDays(1).atStartOfDay().minusNanos(1);
        final LocalDateTime now = LocalDateTime.now();
        final long totalLeads = leadRepository.count();
        final long leadsLast7Days = leadRepository.count(buildLeadSpec(null, null, null, now.minusDays(7), now));
        final long leadsLast30Days = leadRepository.count(buildLeadSpec(null, null, null, now.minusDays(30), now));

        final List<MarketingDTOs.LeadAnalyticsBucket> byStatus = leadRepository.groupByStatus(fromAt, toAt)
                .stream()
                .map(r -> new MarketingDTOs.LeadAnalyticsBucket(r.getKey(), r.getCount()))
                .toList();
        final List<MarketingDTOs.LeadAnalyticsBucket> bySource = leadRepository.groupBySource(fromAt, toAt)
                .stream()
                .map(r -> new MarketingDTOs.LeadAnalyticsBucket(r.getKey(), r.getCount()))
                .toList();
        final List<MarketingDTOs.LeadAnalyticsBucket> topSchools = leadRepository.groupBySchool(fromAt, toAt)
                .stream()
                .limit(8)
                .map(r -> new MarketingDTOs.LeadAnalyticsBucket(r.getKey(), r.getCount()))
                .toList();
        final List<MarketingDTOs.LeadAnalyticsTrendPoint> trend = leadRepository.groupByDay(fromAt, toAt)
                .stream()
                .map(r -> new MarketingDTOs.LeadAnalyticsTrendPoint(LocalDate.parse(r.getDay()).format(DAY_LABEL), r.getTotal()))
                .toList();
        return new MarketingDTOs.LeadDashboardResponse(
                totalLeads,
                leadsLast7Days,
                leadsLast30Days,
                leadRepository.countByStatusIgnoreCase("NEW"),
                leadRepository.countByStatusIgnoreCase("QUALIFIED"),
                leadRepository.countByStatusIgnoreCase("CONTACTED"),
                leadRepository.countByStatusIgnoreCase("CLOSED"),
                byStatus,
                bySource,
                topSchools,
                trend
        );
    }

    @Transactional
    public void updateStatus(String id, MarketingDTOs.LeadStatusUpdateRequest req) {
        final MarketingLead lead = leadRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Lead not found"));
        lead.setStatus(normalizeLeadStatusOrNull(req.status(), true));
        lead.setNotes(req.note());
        leadRepository.save(lead);
    }

    private void validateDateRange(LocalDate fromDate, LocalDate toDate) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new BusinessException("From date cannot be after to date.", ApiErrorCode.VALIDATION_FAILED);
        }
    }

    private String normalizeLeadStatusOrNull(String value, boolean required) {
        if (value == null || value.isBlank()) {
            if (required) {
                throw new BusinessException("Lead status is required.", ApiErrorCode.VALIDATION_FAILED);
            }
            return null;
        }
        final String normalized = value.trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_STATUSES.contains(normalized)) {
            final String allowed = String.join(", ", new LinkedHashSet<>(ALLOWED_STATUSES));
            throw new BusinessException("Invalid lead status. Allowed statuses: " + allowed + ".", ApiErrorCode.VALIDATION_FAILED);
        }
        return normalized;
    }

    private Specification<MarketingLead> buildLeadSpec(
            String q, String status, String source, LocalDateTime fromAt, LocalDateTime toAt
    ) {
        return Specification.where(likeText(q))
                .and(eqUpper("status", status))
                .and(eqUpper("source", source))
                .and(gteCreatedAt(fromAt))
                .and(lteCreatedAt(toAt));
    }

    private Specification<MarketingLead> likeText(String q) {
        if (q == null || q.isBlank()) {
            return null;
        }
        final String needle = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("fullName")), needle),
                cb.like(cb.lower(root.get("workEmail")), needle),
                cb.like(cb.lower(root.get("schoolName")), needle),
                cb.like(cb.lower(root.get("phone")), needle)
        );
    }

    private Specification<MarketingLead> eqUpper(String field, String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        final String normalized = value.trim().toUpperCase(Locale.ROOT);
        return (root, query, cb) -> cb.equal(cb.upper(root.get(field)), normalized);
    }

    private Specification<MarketingLead> gteCreatedAt(LocalDateTime fromAt) {
        if (fromAt == null) {
            return null;
        }
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), fromAt);
    }

    private Specification<MarketingLead> lteCreatedAt(LocalDateTime toAt) {
        if (toAt == null) {
            return null;
        }
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), toAt);
    }

    private MarketingDTOs.LeadAdminResponse toLeadAdminResponse(MarketingLead lead) {
        return new MarketingDTOs.LeadAdminResponse(
                lead.getId(),
                lead.getFullName(),
                lead.getWorkEmail(),
                lead.getPhone(),
                lead.getSchoolName(),
                lead.getSource(),
                lead.getStatus(),
                lead.getMessage(),
                lead.getNotes(),
                lead.getCreatedAt()
        );
    }
}
