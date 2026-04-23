package com.school.erp.modules.communication.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.security.RequireTenantFeature;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.modules.communication.dto.CommunicationDTOs;
import com.school.erp.modules.communication.dto.AnnouncementDTOs;
import com.school.erp.modules.communication.dto.CampaignDTOs;
import com.school.erp.modules.communication.dto.CommunicationEventDTOs;
import com.school.erp.modules.communication.dto.InboxTimelineDTOs;
import com.school.erp.modules.communication.entity.Announcement;
import com.school.erp.modules.communication.service.CommunicationService;
import com.school.erp.modules.communication.service.InboxTimelineService;
import com.school.erp.modules.notification.service.NotificationCampaignService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/communication")
@Tag(name = "Communication", description = "Announcements & Teacher-Parent Messaging")
@RequireTenantFeature("communication")
public class CommunicationController {
    private final CommunicationService service;
    private final InboxTimelineService inboxTimelineService;
    private final NotificationCampaignService campaignService;

    // --- Announcements ---
    @GetMapping("/announcements")
    @Operation(summary = "List announcements")
    public ResponseEntity<ApiResponse<List<Announcement>>> listAnnouncements() {
        return ResponseEntity.ok(ApiResponse.ok(service.getAnnouncements()));
    }

    @GetMapping("/announcements/paged")
    @Operation(summary = "List announcements (paged)")
    public ResponseEntity<ApiResponse<PageResponse<Announcement>>> listAnnouncementsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(ApiResponse.ok(service.getAnnouncementsPaged(page, size, q)));
    }

    @GetMapping("/inbox/timeline")
    @Operation(summary = "Unified inbox timeline", description = "Announcements and user notifications merged, newest first. "
            + "Optional filters: feedKind=ANNOUNCEMENT|NOTIFICATION, audiences=ALL,TEACHERS,...,ALERT, yearMonth=yyyy-MM. "
            + "Audience tokens are sanitized to the signed-in role (parents cannot apply TEACHERS/PARENTS filters, etc.).")
    public ResponseEntity<ApiResponse<PageResponse<InboxTimelineDTOs.InboxItemResponse>>> inboxTimeline(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String feedKind,
            @RequestParam(required = false) String audiences,
            @RequestParam(required = false) String yearMonth) {
        return ResponseEntity.ok(ApiResponse.ok(inboxTimelineService.getTimeline(page, size, q, feedKind, audiences, yearMonth)));
    }

    @GetMapping("/announcements/previews")
    @Operation(summary = "Announcement previews for header widgets (truncated body)")
    public ResponseEntity<ApiResponse<List<AnnouncementDTOs.AnnouncementPreviewResponse>>> announcementPreviews() {
        return ResponseEntity.ok(ApiResponse.ok(service.getAnnouncementPreviews()));
    }

    @GetMapping("/announcements/{id}")
    @Operation(summary = "Single announcement (tenant-scoped)")
    public ResponseEntity<ApiResponse<Announcement>> getAnnouncement(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getAnnouncement(id)));
    }

    @PostMapping("/announcements")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Create announcement", description = "Campus / platform administrators only; teachers and parents consume announcements read-only.")
    public ResponseEntity<ApiResponse<Announcement>> createAnnouncement(@Valid @RequestBody AnnouncementDTOs.CreateAnnouncementRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createAnnouncement(req)));
    }

    @PostMapping("/events")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Create scheduled communication event")
    public ResponseEntity<ApiResponse<CommunicationEventDTOs.EventResponse>> createEvent(
            @Valid @RequestBody CommunicationEventDTOs.CreateEventRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createEvent(req)));
    }

    @GetMapping("/events/paged")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "List communication events", description = "Paged event list with optional upcoming-only mode.")
    public ResponseEntity<ApiResponse<PageResponse<CommunicationEventDTOs.EventResponse>>> listEventsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "false") boolean upcomingOnly) {
        return ResponseEntity.ok(ApiResponse.ok(service.getEventsPaged(page, size, upcomingOnly)));
    }

    @GetMapping("/events/my")
    @Operation(summary = "List events for current user audience")
    public ResponseEntity<ApiResponse<PageResponse<CommunicationEventDTOs.EventResponse>>> listMyEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(service.getEventsForMePaged(page, size)));
    }

    @PutMapping("/announcements/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Update announcement")
    public ResponseEntity<ApiResponse<Announcement>> updateAnnouncement(@PathVariable Long id, @RequestBody Announcement ann) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateAnnouncement(id, ann)));
    }

    @DeleteMapping("/announcements/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Delete announcement")
    public ResponseEntity<ApiResponse<Void>> deleteAnnouncement(@PathVariable Long id) {
        service.deleteAnnouncement(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Deleted"));
    }

    @PostMapping("/campaigns/preview")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Preview notification campaign", description = "Estimates audience size, channel counts and cost before queueing.")
    public ResponseEntity<ApiResponse<CampaignDTOs.CampaignPreviewResponse>> previewCampaign(
            @Valid @RequestBody CampaignDTOs.CampaignRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(campaignService.preview(req)));
    }

    @PostMapping("/campaigns/send")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Queue notification campaign", description = "Queues multi-channel campaign dispatch through outbox with dedupe/retry safety.")
    public ResponseEntity<ApiResponse<CampaignDTOs.CampaignSendResponse>> sendCampaign(
            @Valid @RequestBody CampaignDTOs.CampaignRequest req) {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ApiResponse.ok(campaignService.send(req), "Campaign queued"));
    }

    @GetMapping("/campaigns/history")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Campaign history", description = "Paged list of previously queued campaigns for the tenant.")
    public ResponseEntity<ApiResponse<PageResponse<CampaignDTOs.CampaignHistoryItem>>> campaignHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(campaignService.history(page, size)));
    }

    @GetMapping("/campaigns/{campaignId}/analytics")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Campaign analytics", description = "Delivery status aggregation for a campaign.")
    public ResponseEntity<ApiResponse<CampaignDTOs.CampaignAnalyticsResponse>> campaignAnalytics(@PathVariable String campaignId) {
        return ResponseEntity.ok(ApiResponse.ok(campaignService.analytics(campaignId)));
    }

    @GetMapping("/campaign-templates")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "List campaign templates")
    public ResponseEntity<ApiResponse<List<CampaignDTOs.CampaignTemplateResponse>>> listCampaignTemplates() {
        return ResponseEntity.ok(ApiResponse.ok(campaignService.listTemplates()));
    }

    @PostMapping("/campaign-templates")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Create campaign template")
    public ResponseEntity<ApiResponse<CampaignDTOs.CampaignTemplateResponse>> createCampaignTemplate(
            @Valid @RequestBody CampaignDTOs.CampaignTemplateUpsertRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(campaignService.upsertTemplate(null, req)));
    }

    @PutMapping("/campaign-templates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Update campaign template")
    public ResponseEntity<ApiResponse<CampaignDTOs.CampaignTemplateResponse>> updateCampaignTemplate(
            @PathVariable Long id,
            @Valid @RequestBody CampaignDTOs.CampaignTemplateUpsertRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(campaignService.upsertTemplate(id, req)));
    }

    // --- Teacher-Parent Messaging ---
    @GetMapping("/messages")
    @Operation(summary = "Get my messages", description = "All messages where current user is sender or receiver")
    public ResponseEntity<ApiResponse<List<CommunicationDTOs.MessageResponse>>> getMessages() {
        return ResponseEntity.ok(ApiResponse.ok(service.getMyMessages()));
    }

    @GetMapping("/messages/conversation/{otherUserId}")
    @Operation(summary = "Get conversation with a user")
    public ResponseEntity<ApiResponse<List<CommunicationDTOs.MessageResponse>>> getConversation(@PathVariable Long otherUserId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getConversation(otherUserId)));
    }

    @PostMapping("/messages")
    @Operation(summary = "Send message", description = "Send message to another user (teacher-parent communication)")
    public ResponseEntity<ApiResponse<CommunicationDTOs.MessageResponse>> sendMessage(@Valid @RequestBody CommunicationDTOs.SendMessageRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.sendMessage(req)));
    }

    @PutMapping("/messages/{id}/read")
    @Operation(summary = "Mark message as read")
    public ResponseEntity<ApiResponse<Void>> markRead(@PathVariable Long id) {
        service.markMessageRead(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/messages/unread-count")
    @Operation(summary = "Get unread message count")
    public ResponseEntity<ApiResponse<Long>> unreadCount() {
        return ResponseEntity.ok(ApiResponse.ok(service.getUnreadMessageCount()));
    }

    public CommunicationController(
            final CommunicationService service,
            final InboxTimelineService inboxTimelineService,
            final NotificationCampaignService campaignService) {
        this.service = service;
        this.inboxTimelineService = inboxTimelineService;
        this.campaignService = campaignService;
    }
}
