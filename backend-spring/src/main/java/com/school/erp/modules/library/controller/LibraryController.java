package com.school.erp.modules.library.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.security.RequireTenantFeature;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.modules.library.dto.LibraryDTOs;
import com.school.erp.modules.library.entity.Book;
import com.school.erp.modules.library.service.LibraryService;
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
@RequestMapping("/api/v1/library")
@Tag(name = "Library", description = "Book Catalog, Issue/Return, Fine Calculation")
@RequireTenantFeature("library")
public class LibraryController {
    private final LibraryService service;

    @GetMapping("/books")
    @PreAuthorize(RbacSpel.LIBRARY_MEMBER_READ)
    @Operation(summary = "List/search books", description = "By default only catalog-active titles; pass includeInactive=true to list withdrawn titles")
    public ResponseEntity<ApiResponse<List<Book>>> listBooks(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "false") boolean includeInactive) {
        return ResponseEntity.ok(ApiResponse.ok(service.getBooks(search, includeInactive)));
    }

    @PutMapping("/books/{id}/catalog")
    @PreAuthorize(RbacSpel.LIBRARY_CATALOG_WRITE)
    @Operation(summary = "Activate or deactivate catalog title", description = "Inactive titles cannot be issued; copies on loan are unchanged")
    public ResponseEntity<ApiResponse<Book>> setCatalogActive(@PathVariable Long id, @RequestBody LibraryDTOs.CatalogActiveRequest body) {
        boolean active = body != null && Boolean.TRUE.equals(body.getActive());
        return ResponseEntity.ok(ApiResponse.ok(service.setCatalogActive(id, active)));
    }

    @PostMapping("/books")
    @PreAuthorize(RbacSpel.LIBRARY_CATALOG_WRITE)
    @Operation(summary = "Add book to catalog", description = "Admin or teacher (e.g. librarian role) may add titles")
    public ResponseEntity<ApiResponse<Book>> addBook(@RequestBody Book book) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.addBook(book)));
    }

    @GetMapping("/issues")
    @PreAuthorize(RbacSpel.LIBRARY_DESK_READ)
    @Operation(summary = "List book issues", description = "Filter by status: ISSUED, RETURNED, OVERDUE")
    public ResponseEntity<ApiResponse<List<LibraryDTOs.BookIssueResponse>>> listIssues(@RequestParam(required = false) Enums.BookIssueStatus status) {
        return ResponseEntity.ok(ApiResponse.ok(service.getIssues(status)));
    }

    @GetMapping("/books/paged")
    @PreAuthorize(RbacSpel.LIBRARY_MEMBER_READ)
    @Operation(summary = "List/search books (paged)", description = "catalogScope: ACTIVE (default), INACTIVE, or ALL")
    public ResponseEntity<ApiResponse<PageResponse<Book>>> listBooksPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false, defaultValue = "ACTIVE") String catalogScope) {
        return ResponseEntity.ok(ApiResponse.ok(service.getBooksPaged(page, size, search, category, catalogScope)));
    }

    @GetMapping("/issues/paged")
    @PreAuthorize(RbacSpel.LIBRARY_DESK_READ)
    @Operation(summary = "List book issues (paged)", description = "Filter by status: ISSUED, RETURNED, OVERDUE")
    public ResponseEntity<ApiResponse<PageResponse<LibraryDTOs.BookIssueResponse>>> listIssuesPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Enums.BookIssueStatus status) {
        return ResponseEntity.ok(ApiResponse.ok(service.getIssuesPaged(page, size, status)));
    }

    @GetMapping("/issues/me")
    @PreAuthorize(RbacSpel.LIBRARY_MEMBER_READ)
    @Operation(summary = "List own/linked borrow history", description = "Member lane: students see own issues; parents see linked ward issues")
    public ResponseEntity<ApiResponse<List<LibraryDTOs.BookIssueResponse>>> listMyIssues(
            @RequestParam(required = false) Enums.BookIssueStatus status) {
        return ResponseEntity.ok(ApiResponse.ok(service.getMemberIssues(status)));
    }

    @GetMapping("/issues/me/paged")
    @PreAuthorize(RbacSpel.LIBRARY_MEMBER_READ)
    @Operation(summary = "List own/linked borrow history (paged)", description = "Member lane paged issues for student self-service or parent-linked wards")
    public ResponseEntity<ApiResponse<PageResponse<LibraryDTOs.BookIssueResponse>>> listMyIssuesPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Enums.BookIssueStatus status) {
        return ResponseEntity.ok(ApiResponse.ok(service.getMemberIssuesPaged(page, size, status)));
    }

    @PostMapping("/issues")
    @PreAuthorize(RbacSpel.LIBRARY_CIRCULATION_ACCESS)
    @Operation(summary = "Issue book to student", description = "Decreases available copies. Default due: 14 days.")
    public ResponseEntity<ApiResponse<LibraryDTOs.BookIssueResponse>> issueBook(@Valid @RequestBody LibraryDTOs.IssueBookRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.issueBook(req)));
    }

    @PostMapping("/issues/borrower")
    @PreAuthorize(RbacSpel.LIBRARY_CIRCULATION_ACCESS)
    @Operation(summary = "Issue book to generic borrower", description = "ERP-grade borrower API using borrowerType + borrowerRefId (+ optional borrowerUserId)")
    public ResponseEntity<ApiResponse<LibraryDTOs.BorrowerIssueResponse>> issueBookToBorrower(
            @Valid @RequestBody LibraryDTOs.IssueBorrowerRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.issueBookForBorrower(req)));
    }

    @PutMapping("/issues/{id}/return")
    @PreAuthorize(RbacSpel.LIBRARY_CIRCULATION_ACCESS)
    @Operation(summary = "Return book", description = "Return date & optional fine/day override; otherwise tenant library_fine_per_day applies.")
    public ResponseEntity<ApiResponse<LibraryDTOs.BookIssueResponse>> returnBook(@PathVariable Long id, @RequestBody(required = false) LibraryDTOs.ReturnBookRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.returnBook(id, req), "Book returned"));
    }

    @GetMapping("/policies/fine")
    @PreAuthorize(RbacSpel.LIBRARY_DESK_READ)
    @Operation(summary = "List library fine policies")
    public ResponseEntity<ApiResponse<List<LibraryDTOs.LibraryFinePolicyResponse>>> listFinePolicies() {
        return ResponseEntity.ok(ApiResponse.ok(service.listFinePolicies()));
    }

    @PutMapping("/policies/fine")
    @PreAuthorize(RbacSpel.LIBRARY_POLICY_WRITE)
    @Operation(summary = "Create/update library fine policy")
    public ResponseEntity<ApiResponse<LibraryDTOs.LibraryFinePolicyResponse>> upsertFinePolicy(
            @Valid @RequestBody LibraryDTOs.LibraryFinePolicyRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.upsertFinePolicy(req)));
    }

    @GetMapping("/reservations")
    @PreAuthorize(RbacSpel.LIBRARY_DESK_READ)
    @Operation(summary = "List reservations")
    public ResponseEntity<ApiResponse<List<LibraryDTOs.LibraryReservationResponse>>> listReservations(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.ok(service.listReservations(status)));
    }

    @PostMapping("/reservations")
    @PreAuthorize(RbacSpel.LIBRARY_CIRCULATION_ACCESS)
    @Operation(summary = "Reserve a book copy")
    public ResponseEntity<ApiResponse<LibraryDTOs.LibraryReservationResponse>> createReservation(
            @Valid @RequestBody LibraryDTOs.LibraryReservationRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createReservation(req)));
    }

    @PutMapping("/reservations/{id}/cancel")
    @PreAuthorize(RbacSpel.LIBRARY_CIRCULATION_ACCESS)
    @Operation(summary = "Cancel reservation")
    public ResponseEntity<ApiResponse<LibraryDTOs.LibraryReservationResponse>> cancelReservation(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.cancelReservation(id)));
    }

    @PutMapping("/reservations/{id}/fulfill")
    @PreAuthorize(RbacSpel.LIBRARY_CIRCULATION_ACCESS)
    @Operation(summary = "Fulfill reservation by issuing copy")
    public ResponseEntity<ApiResponse<LibraryDTOs.LibraryReservationResponse>> fulfillReservation(
            @PathVariable Long id,
            @RequestParam(required = false) Integer dueDays) {
        return ResponseEntity.ok(ApiResponse.ok(service.fulfillReservation(id, dueDays)));
    }

    @PostMapping("/inventory/adjust")
    @PreAuthorize(RbacSpel.LIBRARY_INVENTORY_WRITE)
    @Operation(summary = "Inventory accession/loss/write-off adjustment")
    public ResponseEntity<ApiResponse<LibraryDTOs.LibraryInventoryLedgerResponse>> adjustInventory(
            @Valid @RequestBody LibraryDTOs.LibraryInventoryAdjustRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.adjustInventory(req)));
    }

    @GetMapping("/inventory/ledger")
    @PreAuthorize(RbacSpel.LIBRARY_DESK_READ)
    @Operation(summary = "Inventory adjustment ledger")
    public ResponseEntity<ApiResponse<List<LibraryDTOs.LibraryInventoryLedgerResponse>>> listInventoryLedger() {
        return ResponseEntity.ok(ApiResponse.ok(service.listInventoryLedger()));
    }

    @GetMapping("/analytics/snapshot")
    @PreAuthorize(RbacSpel.LIBRARY_ANALYTICS_READ)
    @Operation(summary = "Library analytics snapshot")
    public ResponseEntity<ApiResponse<LibraryDTOs.LibraryAnalyticsSnapshot>> analyticsSnapshot() {
        return ResponseEntity.ok(ApiResponse.ok(service.getAnalyticsSnapshot()));
    }

    @GetMapping("/reminders/due")
    @PreAuthorize(RbacSpel.LIBRARY_REMINDER_READ)
    @Operation(summary = "Borrower reminders preview")
    public ResponseEntity<ApiResponse<List<LibraryDTOs.BookIssueResponse>>> dueReminders(
            @RequestParam(defaultValue = "7") int dueInDays) {
        return ResponseEntity.ok(ApiResponse.ok(service.listDueReminders(dueInDays)));
    }

    @GetMapping(value = "/analytics/export.csv", produces = "text/csv")
    @PreAuthorize(RbacSpel.LIBRARY_ANALYTICS_READ)
    @Operation(summary = "Export library analytics CSV")
    public ResponseEntity<byte[]> exportAnalyticsCsv() {
        byte[] body = service.exportAnalyticsCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=library-analytics-export.csv")
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .body(body);
    }

    @GetMapping(value = "/analytics/export.pdf", produces = "application/pdf")
    @PreAuthorize(RbacSpel.LIBRARY_ANALYTICS_READ)
    @Operation(summary = "Export library analytics PDF")
    public ResponseEntity<byte[]> exportAnalyticsPdf() {
        byte[] body = service.exportAnalyticsPdf();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=library-analytics-export.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(body);
    }

    public LibraryController(final LibraryService service) {
        this.service = service;
    }
}
