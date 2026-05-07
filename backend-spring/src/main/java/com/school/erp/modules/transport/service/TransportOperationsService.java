package com.school.erp.modules.transport.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.events.domain.TenantDomainEvent;
import com.school.erp.modules.transport.dto.TransportOpsDTOs;
import com.school.erp.modules.transport.entity.RouteStop;
import com.school.erp.modules.transport.entity.TransportDeviceIngestEvent;
import com.school.erp.modules.transport.entity.TransportOpsException;
import com.school.erp.modules.transport.entity.TransportOpsPolicy;
import com.school.erp.modules.transport.entity.TransportRoute;
import com.school.erp.modules.transport.config.TransportOpsProperties;
import com.school.erp.modules.transport.repository.RouteStopRepository;
import com.school.erp.modules.transport.repository.TransportDeviceIngestEventRepository;
import com.school.erp.modules.transport.repository.TransportOpsExceptionRepository;
import com.school.erp.modules.transport.repository.TransportOpsPolicyRepository;
import com.school.erp.modules.transport.repository.TransportRouteRepository;
import com.school.erp.platform.port.DomainEventPublisher;
import com.school.erp.tenant.AcademicYearContext;
import com.school.erp.tenant.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class TransportOperationsService {

    private final TransportDeviceIngestEventRepository ingestRepo;
    private final TransportOpsExceptionRepository exceptionRepo;
    private final TransportOpsPolicyRepository policyRepo;
    private final TransportRouteRepository routeRepo;
    private final RouteStopRepository stopRepo;
    private final TransportService transportService;
    private final DomainEventPublisher eventPublisher;
    private final TransportOpsProperties transportOpsProperties;

    public TransportOperationsService(
            TransportDeviceIngestEventRepository ingestRepo,
            TransportOpsExceptionRepository exceptionRepo,
            TransportOpsPolicyRepository policyRepo,
            TransportRouteRepository routeRepo,
            RouteStopRepository stopRepo,
            TransportService transportService,
            DomainEventPublisher eventPublisher,
            TransportOpsProperties transportOpsProperties) {
        this.ingestRepo = ingestRepo;
        this.exceptionRepo = exceptionRepo;
        this.policyRepo = policyRepo;
        this.routeRepo = routeRepo;
        this.stopRepo = stopRepo;
        this.transportService = transportService;
        this.eventPublisher = eventPublisher;
        this.transportOpsProperties = transportOpsProperties;
    }

    @Transactional
    public TransportOpsDTOs.DeviceEventIngestResponse ingestDeviceEvent(TransportOpsDTOs.DeviceEventIngestRequest req) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new BusinessException("Tenant context missing");
        }
        String idempotencyKey = req.idempotencyKey().trim();
        var existing = ingestRepo.findByTenantIdAndIdempotencyKeyAndIsDeletedFalse(tenantId, idempotencyKey);
        if (existing.isPresent()) {
            return new TransportOpsDTOs.DeviceEventIngestResponse(existing.get().getId(), existing.get().getProcessingStatus(), "Already processed");
        }

        TransportDeviceIngestEvent event = new TransportDeviceIngestEvent();
        event.setTenantId(tenantId);
        event.setSourceAdapter(req.sourceAdapter().trim().toUpperCase());
        event.setEventType(req.eventType().trim().toUpperCase());
        event.setIdempotencyKey(idempotencyKey);
        event.setVehicleId(req.vehicleId());
        event.setRouteId(req.routeId());
        event.setStudentId(req.studentId());
        event.setLatitude(req.latitude());
        event.setLongitude(req.longitude());
        event.setPayloadJson(req.payloadJson());
        event.setOccurredAt(req.occurredAt() == null ? Instant.now() : req.occurredAt());
        event.setProcessingStatus("RECEIVED");
        event = ingestRepo.save(event);

        try {
            processIngestEvent(event);
            event.setProcessingStatus("PROCESSED");
            event.setFailureReason(null);
            ingestRepo.save(event);
            return new TransportOpsDTOs.DeviceEventIngestResponse(event.getId(), "PROCESSED", "Accepted");
        } catch (Exception ex) {
            event.setProcessingStatus("DEAD_LETTER");
            event.setFailureReason(ex.getMessage());
            event.setRetryCount((event.getRetryCount() == null ? 0 : event.getRetryCount()) + 1);
            ingestRepo.save(event);
            return new TransportOpsDTOs.DeviceEventIngestResponse(event.getId(), "DEAD_LETTER", "Moved to dead letter queue");
        }
    }

    @Transactional
    public TransportOpsDTOs.DeviceEventIngestResponse retryIngestEvent(Long eventId) {
        String tenantId = TenantContext.getTenantId();
        TransportDeviceIngestEvent event = ingestRepo.findByIdAndTenantIdAndIsDeletedFalse(eventId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("TransportDeviceIngestEvent", eventId));
        try {
            processIngestEvent(event);
            event.setProcessingStatus("PROCESSED");
            event.setFailureReason(null);
            event.setRetryCount((event.getRetryCount() == null ? 0 : event.getRetryCount()) + 1);
            ingestRepo.save(event);
            return new TransportOpsDTOs.DeviceEventIngestResponse(event.getId(), "PROCESSED", "Retried successfully");
        } catch (Exception ex) {
            event.setProcessingStatus("DEAD_LETTER");
            event.setFailureReason(ex.getMessage());
            event.setRetryCount((event.getRetryCount() == null ? 0 : event.getRetryCount()) + 1);
            ingestRepo.save(event);
            return new TransportOpsDTOs.DeviceEventIngestResponse(event.getId(), "DEAD_LETTER", "Retry failed");
        }
    }

    @Transactional
    public TransportOpsDTOs.OpsExceptionView createOpsException(TransportOpsDTOs.OpsExceptionCreateRequest req) {
        String tenantId = TenantContext.getTenantId();
        TransportOpsException row = new TransportOpsException();
        row.setTenantId(tenantId);
        row.setExceptionCode(req.exceptionCode().trim().toUpperCase());
        row.setSeverity(req.severity().trim().toUpperCase());
        row.setStatus("OPEN");
        row.setRouteId(req.routeId());
        row.setVehicleId(req.vehicleId());
        row.setStudentId(req.studentId());
        row.setOwnerUserId(req.ownerUserId());
        row.setEventOccurredAt(req.eventOccurredAt() == null ? Instant.now() : req.eventOccurredAt());
        row.setEscalationLevel(0);
        long slaSecs = resolveSlaSeconds(tenantId, row.getExceptionCode(), row.getSeverity());
        row.setSlaDueAt(row.getEventOccurredAt().plusSeconds(slaSecs));
        row = exceptionRepo.save(row);
        publishEvent("transport_exception_opened", "TRANSPORT_EXCEPTION", String.valueOf(row.getId()), Map.of(
                "severity", row.getSeverity(),
                "exceptionCode", row.getExceptionCode(),
                "routeId", row.getRouteId()
        ));
        return toView(row);
    }

    @Transactional
    public TransportOpsDTOs.OpsExceptionView resolveOpsException(Long exceptionId, TransportOpsDTOs.OpsExceptionResolveRequest req) {
        String tenantId = TenantContext.getTenantId();
        TransportOpsException row = exceptionRepo.findByIdAndTenantIdAndIsDeletedFalse(exceptionId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("TransportOpsException", exceptionId));
        row.setStatus("RESOLVED");
        row.setResolvedAt(Instant.now());
        row.setResolutionNotes(req.resolutionNotes().trim());
        row = exceptionRepo.save(row);
        publishEvent("transport_exception_resolved", "TRANSPORT_EXCEPTION", String.valueOf(row.getId()), Map.of(
                "severity", row.getSeverity(),
                "exceptionCode", row.getExceptionCode(),
                "resolvedAt", row.getResolvedAt().toString()
        ));
        return toView(row);
    }

    @Transactional(readOnly = true)
    public PageResponse<TransportOpsDTOs.OpsExceptionView> listOpsExceptions(int page, int size, String status) {
        String tenantId = TenantContext.getTenantId();
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("eventOccurredAt"), Sort.Order.asc("id")));
        Page<TransportOpsException> rows = (status == null || status.isBlank())
                ? exceptionRepo.findByTenantIdAndIsDeletedFalse(tenantId, pageable)
                : exceptionRepo.findByTenantIdAndStatusAndIsDeletedFalse(tenantId, status.trim().toUpperCase(), pageable);
        return PageResponse.fromSpringPage(rows.map(this::toView));
    }

    @Transactional(readOnly = true)
    public TransportOpsDTOs.RouteOptimizationResponse optimizeRoute(TransportOpsDTOs.RouteOptimizationRequest req) {
        String tenantId = TenantContext.getTenantId();
        TransportRoute route = routeRepo.findByIdAndTenantIdAndIsDeletedFalse(req.routeId(), tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Route", req.routeId()));
        List<RouteStop> stops = stopRepo.findByTenantIdAndRouteIdOrderByStopOrder(tenantId, route.getId()).stream()
                .filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()))
                .toList();
        if (stops.isEmpty()) {
            return new TransportOpsDTOs.RouteOptimizationResponse(route.getId(), "NO_STOPS", route.getAssignedStudents(), 0, 0, List.of());
        }
        int capacityLimit = req.capacityLimit() != null && req.capacityLimit() > 0 ? req.capacityLimit() : 40;
        int pressurePct = Math.max(0, Math.min(250, (int) Math.round((route.getAssignedStudents() * 100.0) / Math.max(1, capacityLimit))));
        int schoolStartMinute = req.schoolStartMinuteOfDay() != null ? req.schoolStartMinuteOfDay() : (8 * 60);

        List<RouteStop> suggested = stops.stream()
                .sorted(Comparator
                        .comparingDouble((RouteStop s) -> stopScore(s, schoolStartMinute))
                        .thenComparing(s -> s.getLatitude() == null ? java.math.BigDecimal.ZERO : s.getLatitude())
                        .thenComparing(s -> s.getLongitude() == null ? java.math.BigDecimal.ZERO : s.getLongitude())
                        .thenComparing(s -> s.getStopOrder() == null ? Integer.MAX_VALUE : s.getStopOrder()))
                .toList();

        int estimatedTotalTravelMinutes = 0;
        List<TransportOpsDTOs.RouteOptimizationStop> views = new java.util.ArrayList<>();
        for (int i = 0; i < suggested.size(); i++) {
            RouteStop st = suggested.get(i);
            int est = st.getEstimatedTravelMinutes() == null ? 8 : st.getEstimatedTravelMinutes();
            estimatedTotalTravelMinutes += est;
            views.add(new TransportOpsDTOs.RouteOptimizationStop(
                    st.getId(),
                    st.getName(),
                    st.getStopOrder(),
                    i + 1,
                    est
            ));
        }
        return new TransportOpsDTOs.RouteOptimizationResponse(
                route.getId(),
                "HEURISTIC_CAPACITY_TIME_DENSITY",
                route.getAssignedStudents(),
                pressurePct,
                estimatedTotalTravelMinutes,
                views
        );
    }

    @Transactional(readOnly = true)
    public TransportOpsDTOs.TransportOpsSnapshot snapshot() {
        String tenantId = TenantContext.getTenantId();
        long open = exceptionRepo.findByTenantIdAndStatusAndIsDeletedFalse(tenantId, "OPEN", PageRequest.of(0, 1)).getTotalElements();
        long critical = exceptionRepo.findByTenantIdAndStatusAndIsDeletedFalse(tenantId, "OPEN", PageRequest.of(0, 200))
                .getContent().stream().filter(x -> "CRITICAL".equalsIgnoreCase(x.getSeverity())).count();
        long deadLetter = ingestRepo.findTop50ByTenantIdAndProcessingStatusAndIsDeletedFalseOrderByOccurredAtAsc(tenantId, "DEAD_LETTER").size();
        long delayedRoutes = exceptionRepo.findByTenantIdAndStatusAndIsDeletedFalse(tenantId, "OPEN", PageRequest.of(0, 200))
                .getContent().stream().filter(x -> "LATE_BUS".equalsIgnoreCase(x.getExceptionCode())).count();
        return new TransportOpsDTOs.TransportOpsSnapshot(open, critical, deadLetter, delayedRoutes);
    }

    @Transactional
    public TransportOpsDTOs.OpsPolicyView upsertPolicy(TransportOpsDTOs.OpsPolicyUpsertRequest req) {
        String tenantId = TenantContext.getTenantId();
        String code = req.exceptionCode().trim().toUpperCase();
        TransportOpsPolicy row = policyRepo.findByTenantIdAndExceptionCodeAndIsDeletedFalse(tenantId, code)
                .orElseGet(() -> {
                    TransportOpsPolicy p = new TransportOpsPolicy();
                    p.setTenantId(tenantId);
                    p.setExceptionCode(code);
                    return p;
                });
        row.setSeverity(req.severity().trim().toUpperCase());
        row.setSlaMinutes(Math.max(1, req.slaMinutes()));
        row.setEscalationAfterMinutes(Math.max(1, req.escalationAfterMinutes()));
        row = policyRepo.save(row);
        return toPolicyView(row);
    }

    @Transactional(readOnly = true)
    public List<TransportOpsDTOs.OpsPolicyView> listPolicies() {
        String tenantId = TenantContext.getTenantId();
        return policyRepo.findByTenantIdAndIsDeletedFalseOrderByExceptionCodeAsc(tenantId).stream()
                .map(this::toPolicyView)
                .toList();
    }

    @Transactional
    public int runDlqRetrySweepForTenant(String tenantId) {
        List<TransportDeviceIngestEvent> all = ingestRepo
                .findByTenantIdAndProcessingStatusAndIsDeletedFalseOrderByOccurredAtAsc(tenantId, "DEAD_LETTER");
        int limit = Math.max(1, transportOpsProperties.getDlqRetryBatchSize());
        int maxRetries = Math.max(1, transportOpsProperties.getDlqMaxRetries());
        int processed = 0;
        for (TransportDeviceIngestEvent e : all) {
            if (processed >= limit) break;
            int retries = e.getRetryCount() == null ? 0 : e.getRetryCount();
            if (retries >= maxRetries) continue;
            long backoffSeconds = (long) Math.min(1800, Math.pow(2, Math.min(8, retries)) * 30);
            Instant eligibleAt = e.getOccurredAt().plusSeconds(backoffSeconds);
            if (Instant.now().isBefore(eligibleAt)) continue;
            retryIngestEvent(e.getId());
            processed++;
        }
        return processed;
    }

    @Transactional
    public int runEscalationSweepForTenant(String tenantId) {
        List<TransportOpsException> openRows = exceptionRepo.findByTenantIdAndStatusAndIsDeletedFalse(tenantId, "OPEN");
        int changed = 0;
        Instant now = Instant.now();
        for (TransportOpsException row : openRows) {
            if (row.getSlaDueAt() != null && now.isAfter(row.getSlaDueAt())) {
                row.setEscalationLevel((row.getEscalationLevel() == null ? 0 : row.getEscalationLevel()) + 1);
                row.setSlaDueAt(now.plusSeconds(resolveEscalationSeconds(tenantId, row.getExceptionCode())));
                exceptionRepo.save(row);
                changed++;
            }
        }
        return changed;
    }

    @Transactional
    public int runRetentionForTenant(String tenantId) {
        Instant hotCutoff = Instant.now().minus(Math.max(transportOpsProperties.getHotRetentionDays(), 1), ChronoUnit.DAYS);
        Instant coldCutoff = Instant.now().minus(Math.max(transportOpsProperties.getWarmRetentionDays(), 1), ChronoUnit.DAYS);
        int changed = 0;
        for (TransportDeviceIngestEvent e : ingestRepo.findByTenantIdAndOccurredAtBeforeAndIsDeletedFalse(tenantId, hotCutoff)) {
            if (!"PROCESSED_WARM".equalsIgnoreCase(e.getProcessingStatus()) && !"COLD_ARCHIVED".equalsIgnoreCase(e.getProcessingStatus())) {
                e.setProcessingStatus("PROCESSED_WARM");
                ingestRepo.save(e);
                changed++;
            }
        }
        for (TransportDeviceIngestEvent e : ingestRepo.findByTenantIdAndOccurredAtBeforeAndIsDeletedFalse(tenantId, coldCutoff)) {
            e.setProcessingStatus("COLD_ARCHIVED");
            e.markSoftDeleted();
            ingestRepo.save(e);
            changed++;
        }
        for (TransportOpsException x : exceptionRepo.findByTenantIdAndEventOccurredAtBeforeAndIsDeletedFalse(tenantId, hotCutoff)) {
            if ("OPEN".equalsIgnoreCase(x.getStatus())) {
                continue;
            }
            if (!"WARM_HISTORICAL".equalsIgnoreCase(x.getStatus()) && !"COLD_ARCHIVED".equalsIgnoreCase(x.getStatus())) {
                x.setStatus("WARM_HISTORICAL");
                exceptionRepo.save(x);
                changed++;
            }
        }
        for (TransportOpsException x : exceptionRepo.findByTenantIdAndEventOccurredAtBeforeAndIsDeletedFalse(tenantId, coldCutoff)) {
            if ("OPEN".equalsIgnoreCase(x.getStatus())) {
                continue;
            }
            x.setStatus("COLD_ARCHIVED");
            x.markSoftDeleted();
            exceptionRepo.save(x);
            changed++;
        }
        return changed;
    }

    private void processIngestEvent(TransportDeviceIngestEvent event) {
        String kind = event.getEventType() == null ? "" : event.getEventType().trim().toUpperCase();
        if ("GPS_POINT".equals(kind)) {
            if (event.getVehicleId() == null || event.getLatitude() == null || event.getLongitude() == null) {
                throw new BusinessException("GPS_POINT requires vehicleId, latitude, longitude");
            }
            transportService.reportLiveLocation(event.getVehicleId(), event.getRouteId(), event.getLatitude(), event.getLongitude());
            publishEvent("transport_gps_point_ingested", "TRANSPORT_VEHICLE", String.valueOf(event.getVehicleId()), Map.of(
                    "routeId", event.getRouteId(),
                    "adapter", event.getSourceAdapter()
            ));
            return;
        }
        if ("RFID_MISMATCH".equals(kind) || "MISSED_STOP".equals(kind) || "LATE_BUS".equals(kind) || "DEVICE_OFFLINE".equals(kind) || "GEOFENCE_BREACH".equals(kind)) {
            String severity = ("GEOFENCE_BREACH".equals(kind) || "DEVICE_OFFLINE".equals(kind)) ? "CRITICAL" : "HIGH";
            createOpsException(new TransportOpsDTOs.OpsExceptionCreateRequest(
                    kind,
                    severity,
                    event.getRouteId(),
                    event.getVehicleId(),
                    event.getStudentId(),
                    null,
                    event.getOccurredAt()
            ));
            return;
        }
        throw new BusinessException("Unsupported transport ingest eventType: " + kind);
    }

    private long slaSecondsForSeverity(String severity) {
        if ("CRITICAL".equalsIgnoreCase(severity)) {
            return 15 * 60L;
        }
        if ("HIGH".equalsIgnoreCase(severity)) {
            return 30 * 60L;
        }
        if ("MEDIUM".equalsIgnoreCase(severity)) {
            return 2 * 60 * 60L;
        }
        return 6 * 60 * 60L;
    }

    private long resolveSlaSeconds(String tenantId, String exceptionCode, String severity) {
        if (exceptionCode != null && !exceptionCode.isBlank()) {
            var p = policyRepo.findByTenantIdAndExceptionCodeAndIsDeletedFalse(tenantId, exceptionCode.trim().toUpperCase());
            if (p.isPresent()) {
                return Math.max(1, p.get().getSlaMinutes()) * 60L;
            }
        }
        return slaSecondsForSeverity(severity);
    }

    private long resolveEscalationSeconds(String tenantId, String exceptionCode) {
        if (exceptionCode != null && !exceptionCode.isBlank()) {
            var p = policyRepo.findByTenantIdAndExceptionCodeAndIsDeletedFalse(tenantId, exceptionCode.trim().toUpperCase());
            if (p.isPresent()) {
                return Math.max(1, p.get().getEscalationAfterMinutes()) * 60L;
            }
        }
        return 30 * 60L;
    }

    private TransportOpsDTOs.OpsExceptionView toView(TransportOpsException row) {
        return new TransportOpsDTOs.OpsExceptionView(
                row.getId(),
                row.getExceptionCode(),
                row.getSeverity(),
                row.getStatus(),
                row.getRouteId(),
                row.getVehicleId(),
                row.getStudentId(),
                row.getOwnerUserId(),
                row.getEscalationLevel(),
                row.getSlaDueAt(),
                row.getEventOccurredAt(),
                row.getResolvedAt(),
                row.getResolutionNotes()
        );
    }

    private TransportOpsDTOs.OpsPolicyView toPolicyView(TransportOpsPolicy row) {
        return new TransportOpsDTOs.OpsPolicyView(
                row.getId(),
                row.getExceptionCode(),
                row.getSeverity(),
                row.getSlaMinutes(),
                row.getEscalationAfterMinutes()
        );
    }

    private double stopScore(RouteStop stop, int schoolStartMinuteOfDay) {
        int travel = stop.getEstimatedTravelMinutes() == null ? 8 : stop.getEstimatedTravelMinutes();
        int arrivalMinute = stop.getStopTime() != null ? (stop.getStopTime().getHour() * 60 + stop.getStopTime().getMinute()) : schoolStartMinuteOfDay;
        int timingPenalty = Math.abs(schoolStartMinuteOfDay - arrivalMinute);
        double densityPenalty = 0.0;
        if (stop.getLatitude() != null && stop.getLongitude() != null) {
            double latAbs = Math.abs(stop.getLatitude().doubleValue());
            double lngAbs = Math.abs(stop.getLongitude().doubleValue());
            densityPenalty = (latAbs % 1.0) + (lngAbs % 1.0);
        }
        return (travel * 1.0) + (timingPenalty * 0.08) + (densityPenalty * 5.0);
    }

    private void publishEvent(String eventType, String entityType, String entityId, Map<String, Object> attrs) {
        Map<String, Object> safeAttrs = new LinkedHashMap<>(attrs);
        eventPublisher.publish(new TenantDomainEvent(
                TenantContext.getTenantId(),
                AcademicYearContext.getAcademicYearId(),
                entityType,
                entityId,
                eventType,
                Instant.now(),
                TenantContext.getUserPrincipal(),
                safeAttrs
        ));
    }
}
