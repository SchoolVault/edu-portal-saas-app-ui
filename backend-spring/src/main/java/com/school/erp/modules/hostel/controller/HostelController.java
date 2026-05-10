package com.school.erp.modules.hostel.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.security.RequireTenantFeature;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.modules.hostel.dto.HostelDTOs;
import com.school.erp.modules.hostel.entity.Hostel;
import com.school.erp.modules.hostel.entity.HostelRoom;
import com.school.erp.modules.hostel.service.HostelService;
import com.school.erp.security.rbac.RbacSpel;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/hostel")
@Tag(name = "Hostel", description = "Room Management, Student Allocation & Vacancy")
@RequireTenantFeature("hostel")
public class HostelController {
    private final HostelService service;

    @GetMapping("/buildings")
    @PreAuthorize(RbacSpel.HOSTEL_DESK_READ)
    @Operation(summary = "Hostel buildings with live availability summary")
    public ResponseEntity<ApiResponse<List<HostelDTOs.HostelSummary>>> listBuildings() {
        return ResponseEntity.ok(ApiResponse.ok(service.listHostels()));
    }

    @PostMapping("/buildings")
    @PreAuthorize(RbacSpel.HOSTEL_DESK_WRITE)
    @Operation(summary = "Create hostel building (e.g. Boys BH1)")
    public ResponseEntity<ApiResponse<Hostel>> createBuilding(@RequestBody Hostel hostel) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createHostel(hostel)));
    }

    @GetMapping("/rooms")
    @PreAuthorize(RbacSpel.HOSTEL_DESK_READ)
    @Operation(summary = "List rooms with current residents")
    public ResponseEntity<ApiResponse<List<HostelDTOs.RoomResponse>>> listRooms() {
        return ResponseEntity.ok(ApiResponse.ok(service.getRooms()));
    }

    @GetMapping("/rooms/paged")
    @PreAuthorize(RbacSpel.HOSTEL_DESK_READ)
    @Operation(summary = "List rooms (paged)")
    public ResponseEntity<ApiResponse<PageResponse<HostelDTOs.RoomResponse>>> listRoomsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(service.getRoomsPaged(page, size)));
    }

    @PostMapping("/rooms")
    @PreAuthorize(RbacSpel.HOSTEL_DESK_WRITE)
    @Operation(summary = "Create room")
    public ResponseEntity<ApiResponse<HostelRoom>> createRoom(@RequestBody HostelRoom room) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createRoom(room)));
    }

    @PutMapping("/rooms/{id}")
    @PreAuthorize(RbacSpel.HOSTEL_DESK_WRITE)
    @Operation(summary = "Update room metadata", description = "Hostel, block, floor, room number, type, capacity (cannot drop below occupancy)")
    public ResponseEntity<ApiResponse<HostelRoom>> updateRoom(@PathVariable Long id, @RequestBody HostelRoom patch) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateRoom(id, patch)));
    }

    @PostMapping("/allocate")
    @PreAuthorize(RbacSpel.HOSTEL_DESK_WRITE)
    @Operation(summary = "Allocate student to room", description = "Checks capacity before allocation. Returns error if room is full.")
    public ResponseEntity<ApiResponse<HostelDTOs.AllocationDTO>> allocate(@Valid @RequestBody HostelDTOs.AllocateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.allocateStudent(req)));
    }

    @PutMapping("/vacate/{allocationId}")
    @PreAuthorize(RbacSpel.HOSTEL_DESK_WRITE)
    @Operation(summary = "Vacate student from room", description = "Sets status to VACATED, decreases room occupancy")
    public ResponseEntity<ApiResponse<Void>> vacate(@PathVariable Long allocationId) {
        service.vacateStudent(allocationId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Student vacated"));
    }

    @PutMapping("/transfer/{allocationId}")
    @PreAuthorize(RbacSpel.HOSTEL_DESK_WRITE)
    @Operation(summary = "Transfer resident to another room", description = "Closes current allocation as TRANSFERRED and opens a new ACTIVE allocation in target room")
    public ResponseEntity<ApiResponse<HostelDTOs.AllocationDTO>> transfer(
            @PathVariable Long allocationId,
            @Valid @RequestBody HostelDTOs.TransferRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.transferStudent(allocationId, req), "Student transferred"));
    }

    @GetMapping("/stats")
    @PreAuthorize(RbacSpel.HOSTEL_DESK_READ)
    @Operation(summary = "Hostel statistics", description = "Total rooms, capacity, occupancy, available beds")
    public ResponseEntity<ApiResponse<HostelDTOs.HostelStats>> stats() {
        return ResponseEntity.ok(ApiResponse.ok(service.getStats()));
    }

    @GetMapping("/analytics/snapshot")
    @PreAuthorize(RbacSpel.HOSTEL_DESK_READ)
    @Operation(summary = "Hostel analytics snapshot", description = "Occupancy efficiency and incident risk metrics")
    public ResponseEntity<ApiResponse<HostelDTOs.HostelAnalyticsSnapshot>> analyticsSnapshot() {
        return ResponseEntity.ok(ApiResponse.ok(service.getAnalyticsSnapshot()));
    }

    @GetMapping(value = "/analytics/export.csv", produces = "text/csv")
    @PreAuthorize(RbacSpel.HOSTEL_DESK_READ)
    @Operation(summary = "Export hostel analytics CSV")
    public ResponseEntity<byte[]> exportAnalyticsCsv() {
        byte[] body = service.exportAnalyticsCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=hostel-analytics-export.csv")
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .body(body);
    }

    @GetMapping(value = "/analytics/export.pdf", produces = "application/pdf")
    @PreAuthorize(RbacSpel.HOSTEL_DESK_READ)
    @Operation(summary = "Export hostel analytics PDF")
    public ResponseEntity<byte[]> exportAnalyticsPdf() {
        byte[] body = service.exportAnalyticsPdf();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=hostel-analytics-export.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(body);
    }

    @GetMapping("/occupancy/recommendations")
    @PreAuthorize(RbacSpel.HOSTEL_DESK_READ)
    @Operation(summary = "Occupancy rebalance recommendations")
    public ResponseEntity<ApiResponse<List<HostelDTOs.OccupancyRecommendation>>> occupancyRecommendations() {
        return ResponseEntity.ok(ApiResponse.ok(service.recommendOccupancyRebalance()));
    }

    @GetMapping("/incidents/policies")
    @PreAuthorize(RbacSpel.HOSTEL_DESK_READ)
    @Operation(summary = "List hostel incident SLA policies")
    public ResponseEntity<ApiResponse<List<HostelDTOs.IncidentPolicyResponse>>> listIncidentPolicies() {
        return ResponseEntity.ok(ApiResponse.ok(service.listIncidentPolicies()));
    }

    @PutMapping("/incidents/policies")
    @PreAuthorize(RbacSpel.HOSTEL_APPROVAL_WRITE)
    @Operation(summary = "Upsert hostel incident SLA policy")
    public ResponseEntity<ApiResponse<HostelDTOs.IncidentPolicyResponse>> upsertIncidentPolicy(
            @Valid @RequestBody HostelDTOs.IncidentPolicyRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.upsertIncidentPolicy(req)));
    }

    @GetMapping("/billing/profiles")
    @PreAuthorize(RbacSpel.HOSTEL_BILLING_READ)
    @Operation(summary = "List hostel billing profiles", description = "Maps hostel residents to fee structures and billing cadence")
    public ResponseEntity<ApiResponse<List<HostelDTOs.BillingProfileResponse>>> listBillingProfiles() {
        return ResponseEntity.ok(ApiResponse.ok(service.listBillingProfiles()));
    }

    @PutMapping("/billing/profiles")
    @PreAuthorize(RbacSpel.HOSTEL_BILLING_WRITE)
    @Operation(summary = "Create/update hostel billing profile", description = "Upserts profile by tenant + student")
    public ResponseEntity<ApiResponse<HostelDTOs.BillingProfileResponse>> upsertBillingProfile(
            @Valid @RequestBody HostelDTOs.BillingProfileRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.upsertBillingProfile(req)));
    }

    @PostMapping("/billing/runs")
    @PreAuthorize(RbacSpel.HOSTEL_BILLING_WRITE)
    @Operation(summary = "Trigger hostel billing run", description = "Queues invoice hook run for auto-enabled hostel billing profiles")
    public ResponseEntity<ApiResponse<HostelDTOs.BillingRunResponse>> triggerBillingRun(
            @RequestBody(required = false) HostelDTOs.BillingRunRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.triggerBillingRun(req != null ? req : new HostelDTOs.BillingRunRequest())));
    }

    @GetMapping("/gate-passes")
    @PreAuthorize(RbacSpel.HOSTEL_DESK_READ)
    @Operation(summary = "List gate pass / leave-out requests")
    public ResponseEntity<ApiResponse<List<HostelDTOs.GatePassResponse>>> listGatePasses(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.ok(service.listGatePasses(status)));
    }

    @PostMapping("/gate-passes")
    @PreAuthorize(RbacSpel.HOSTEL_DESK_WRITE)
    @Operation(summary = "Create gate pass / leave-out request")
    public ResponseEntity<ApiResponse<HostelDTOs.GatePassResponse>> createGatePass(
            @Valid @RequestBody HostelDTOs.GatePassRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createGatePassRequest(req)));
    }

    @PutMapping("/gate-passes/{id}/approve")
    @PreAuthorize(RbacSpel.HOSTEL_APPROVAL_WRITE)
    @Operation(summary = "Approve gate pass request")
    public ResponseEntity<ApiResponse<HostelDTOs.GatePassResponse>> approveGatePass(
            @PathVariable Long id,
            @RequestBody(required = false) HostelDTOs.ApprovalActionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.approveGatePass(id, req)));
    }

    @PutMapping("/gate-passes/{id}/reject")
    @PreAuthorize(RbacSpel.HOSTEL_APPROVAL_WRITE)
    @Operation(summary = "Reject gate pass request")
    public ResponseEntity<ApiResponse<HostelDTOs.GatePassResponse>> rejectGatePass(
            @PathVariable Long id,
            @RequestBody(required = false) HostelDTOs.ApprovalActionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.rejectGatePass(id, req)));
    }

    @PutMapping("/gate-passes/{id}/return")
    @PreAuthorize(RbacSpel.HOSTEL_APPROVAL_WRITE)
    @Operation(summary = "Mark resident returned")
    public ResponseEntity<ApiResponse<HostelDTOs.GatePassResponse>> returnGatePass(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.markGatePassReturned(id)));
    }

    @GetMapping("/visitors")
    @PreAuthorize(RbacSpel.HOSTEL_DESK_READ)
    @Operation(summary = "List hostel visitor entries")
    public ResponseEntity<ApiResponse<List<HostelDTOs.VisitorEntryResponse>>> listVisitors(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.ok(service.listVisitors(status)));
    }

    @PostMapping("/visitors")
    @PreAuthorize(RbacSpel.HOSTEL_VISITOR_WRITE)
    @Operation(summary = "Create hostel visitor entry")
    public ResponseEntity<ApiResponse<HostelDTOs.VisitorEntryResponse>> createVisitor(
            @Valid @RequestBody HostelDTOs.VisitorEntryRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createVisitor(req)));
    }

    @PutMapping("/visitors/{id}/approve")
    @PreAuthorize(RbacSpel.HOSTEL_APPROVAL_WRITE)
    @Operation(summary = "Approve visitor entry")
    public ResponseEntity<ApiResponse<HostelDTOs.VisitorEntryResponse>> approveVisitor(
            @PathVariable Long id,
            @RequestBody(required = false) HostelDTOs.ApprovalActionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.approveVisitor(id, req)));
    }

    @PutMapping("/visitors/{id}/reject")
    @PreAuthorize(RbacSpel.HOSTEL_APPROVAL_WRITE)
    @Operation(summary = "Reject visitor entry")
    public ResponseEntity<ApiResponse<HostelDTOs.VisitorEntryResponse>> rejectVisitor(
            @PathVariable Long id,
            @RequestBody(required = false) HostelDTOs.ApprovalActionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.rejectVisitor(id, req)));
    }

    @PutMapping("/visitors/{id}/checkout")
    @PreAuthorize(RbacSpel.HOSTEL_VISITOR_WRITE)
    @Operation(summary = "Check-out approved visitor")
    public ResponseEntity<ApiResponse<HostelDTOs.VisitorEntryResponse>> checkoutVisitor(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.checkOutVisitor(id)));
    }

    @GetMapping("/incidents")
    @PreAuthorize(RbacSpel.HOSTEL_DESK_READ)
    @Operation(summary = "List hostel incident logs", description = "Filter by student id when required")
    public ResponseEntity<ApiResponse<List<HostelDTOs.IncidentResponse>>> listIncidents(
            @RequestParam(required = false) Long studentId) {
        return ResponseEntity.ok(ApiResponse.ok(service.listIncidents(studentId)));
    }

    @PostMapping("/incidents")
    @PreAuthorize(RbacSpel.HOSTEL_INCIDENT_WRITE)
    @Operation(summary = "Create hostel incident log", description = "High/critical incidents auto trigger escalation hooks")
    public ResponseEntity<ApiResponse<HostelDTOs.IncidentResponse>> createIncident(
            @RequestBody HostelDTOs.IncidentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createIncident(req)));
    }

    @PutMapping("/incidents/{id}/escalate")
    @PreAuthorize(RbacSpel.HOSTEL_APPROVAL_WRITE)
    @Operation(summary = "Escalate incident", description = "Raises escalation level and sends ops/parent notifications")
    public ResponseEntity<ApiResponse<HostelDTOs.IncidentResponse>> escalateIncident(
            @PathVariable Long id,
            @RequestBody(required = false) HostelDTOs.IncidentEscalationRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.escalateIncident(id, req != null ? req : new HostelDTOs.IncidentEscalationRequest())));
    }

    @PutMapping("/incidents/{id}/resolve")
    @PreAuthorize(RbacSpel.HOSTEL_INCIDENT_WRITE)
    @Operation(summary = "Resolve incident")
    public ResponseEntity<ApiResponse<HostelDTOs.IncidentResponse>> resolveIncident(
            @PathVariable Long id,
            @RequestBody(required = false) HostelDTOs.IncidentResolveRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.resolveIncident(id, req != null ? req : new HostelDTOs.IncidentResolveRequest())));
    }

    @GetMapping("/incidents/resolution-reasons")
    @PreAuthorize(RbacSpel.HOSTEL_DESK_READ)
    @Operation(summary = "Incident resolution taxonomy")
    public ResponseEntity<ApiResponse<List<String>>> listIncidentResolutionReasons() {
        return ResponseEntity.ok(ApiResponse.ok(service.listIncidentResolutionReasons()));
    }

    @GetMapping("/audit/logs")
    @PreAuthorize(RbacSpel.HOSTEL_DESK_READ)
    @Operation(summary = "List hostel audit logs")
    public ResponseEntity<ApiResponse<List<HostelDTOs.AuditLogResponse>>> listAuditLogs() {
        return ResponseEntity.ok(ApiResponse.ok(service.listAuditLogs()));
    }

    @PostMapping("/portal/bookings")
    @PreAuthorize("hasAuthority('PORTAL_PARENT')")
    @Operation(summary = "Parent creates hostel booking request")
    public ResponseEntity<ApiResponse<HostelDTOs.BookingResponse>> createBookingRequest(
            @Valid @RequestBody HostelDTOs.BookingRequestCreate req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createBookingRequestByParent(req)));
    }

    @GetMapping("/portal/bookings")
    @PreAuthorize("hasAuthority('PORTAL_PARENT')")
    @Operation(summary = "Parent booking requests")
    public ResponseEntity<ApiResponse<List<HostelDTOs.BookingResponse>>> listMyBookings() {
        return ResponseEntity.ok(ApiResponse.ok(service.listMyBookingRequests()));
    }

    @GetMapping("/bookings")
    @PreAuthorize(RbacSpel.HOSTEL_DESK_READ)
    @Operation(summary = "Desk list of booking requests")
    public ResponseEntity<ApiResponse<List<HostelDTOs.BookingResponse>>> listBookings(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.ok(service.listBookingRequests(status)));
    }

    @GetMapping("/bookings/paged")
    @PreAuthorize(RbacSpel.HOSTEL_DESK_READ)
    @Operation(summary = "Desk booking triage board (paged)", description = "Supports status/student/query filters with server pagination")
    public ResponseEntity<ApiResponse<PageResponse<HostelDTOs.BookingResponse>>> listBookingsPaged(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(service.listBookingRequestsPaged(status, studentId, query, page, size)));
    }

    @PutMapping("/bookings/{id}/approve")
    @PreAuthorize(RbacSpel.HOSTEL_APPROVAL_WRITE)
    @Operation(summary = "Approve booking and allocate room")
    public ResponseEntity<ApiResponse<HostelDTOs.BookingResponse>> approveBooking(
            @PathVariable Long id,
            @Valid @RequestBody HostelDTOs.BookingDecisionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.approveBookingRequest(id, req)));
    }

    @PutMapping("/bookings/{id}/reject")
    @PreAuthorize(RbacSpel.HOSTEL_APPROVAL_WRITE)
    @Operation(summary = "Reject booking request")
    public ResponseEntity<ApiResponse<HostelDTOs.BookingResponse>> rejectBooking(
            @PathVariable Long id,
            @RequestBody(required = false) HostelDTOs.ApprovalActionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.rejectBookingRequest(id, req != null ? req.getNote() : null)));
    }

    @GetMapping("/portal/children/{studentId}/profile")
    @PreAuthorize("hasAuthority('PORTAL_PARENT')")
    @Operation(summary = "Parent portal hostel profile", description = "Read-only hostel snapshot for a linked child")
    public ResponseEntity<ApiResponse<HostelDTOs.HostelPortalProfileResponse>> parentPortalProfile(@PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getParentPortalHostelProfile(studentId)));
    }

    @GetMapping("/portal/me/profile")
    @PreAuthorize("hasAuthority('PORTAL_STUDENT')")
    @Operation(summary = "Student portal hostel profile", description = "Read-only hostel snapshot for signed-in student")
    public ResponseEntity<ApiResponse<HostelDTOs.HostelPortalProfileResponse>> studentPortalProfile() {
        return ResponseEntity.ok(ApiResponse.ok(service.getStudentPortalHostelProfile()));
    }

    public HostelController(final HostelService service) {
        this.service = service;
    }
}
