package com.school.erp.modules.transport.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class TransportOpsDTOs {

    public record DeviceEventIngestRequest(
            @NotBlank String sourceAdapter,
            @NotBlank String eventType,
            @NotBlank String idempotencyKey,
            Long vehicleId,
            Long routeId,
            Long studentId,
            BigDecimal latitude,
            BigDecimal longitude,
            Instant occurredAt,
            String payloadJson
    ) {}

    public record DeviceEventIngestResponse(
            Long id,
            String processingStatus,
            String message
    ) {}

    public record OpsExceptionCreateRequest(
            @NotBlank String exceptionCode,
            @NotBlank String severity,
            Long routeId,
            Long vehicleId,
            Long studentId,
            Long ownerUserId,
            Instant eventOccurredAt
    ) {}

    public record OpsExceptionResolveRequest(
            @NotBlank String resolutionNotes
    ) {}

    public record OpsExceptionView(
            Long id,
            String exceptionCode,
            String severity,
            String status,
            Long routeId,
            Long vehicleId,
            Long studentId,
            Long ownerUserId,
            Integer escalationLevel,
            Instant slaDueAt,
            Instant eventOccurredAt,
            Instant resolvedAt,
            String resolutionNotes
    ) {}

    public record OpsPolicyUpsertRequest(
            @NotBlank String exceptionCode,
            @NotBlank String severity,
            @NotNull Integer slaMinutes,
            @NotNull Integer escalationAfterMinutes
    ) {}

    public record OpsPolicyView(
            Long id,
            String exceptionCode,
            String severity,
            Integer slaMinutes,
            Integer escalationAfterMinutes
    ) {}

    public record RouteOptimizationRequest(
            @NotNull Long routeId,
            Integer capacityLimit,
            Integer schoolStartMinuteOfDay
    ) {}

    public record RouteOptimizationStop(
            Long stopId,
            String stopName,
            Integer oldOrder,
            Integer suggestedOrder,
            Integer estimatedTravelMinutes
    ) {}

    public record RouteOptimizationResponse(
            Long routeId,
            String strategy,
            Integer totalStudents,
            Integer capacityPressurePct,
            Integer estimatedTotalTravelMinutes,
            List<RouteOptimizationStop> stops
    ) {}

    public record TransportOpsSnapshot(
            long openExceptions,
            long criticalExceptions,
            long deadLetterEvents,
            long delayedRoutes
    ) {}
}
