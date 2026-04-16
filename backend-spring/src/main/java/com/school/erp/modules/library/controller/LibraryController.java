package com.school.erp.modules.library.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.security.RequireTenantFeature;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.modules.library.dto.LibraryDTOs;
import com.school.erp.modules.library.entity.Book;
import com.school.erp.modules.library.service.LibraryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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
    @Operation(summary = "List/search books", description = "By default only catalog-active titles; pass includeInactive=true to list withdrawn titles")
    public ResponseEntity<ApiResponse<List<Book>>> listBooks(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "false") boolean includeInactive) {
        return ResponseEntity.ok(ApiResponse.ok(service.getBooks(search, includeInactive)));
    }

    @PutMapping("/books/{id}/catalog")
    @PreAuthorize("hasRole(\'ADMIN\') or hasAuthority(\'LIBRARY_MANAGE\')")
    @Operation(summary = "Activate or deactivate catalog title", description = "Inactive titles cannot be issued; copies on loan are unchanged")
    public ResponseEntity<ApiResponse<Book>> setCatalogActive(@PathVariable Long id, @RequestBody LibraryDTOs.CatalogActiveRequest body) {
        boolean active = body != null && Boolean.TRUE.equals(body.getActive());
        return ResponseEntity.ok(ApiResponse.ok(service.setCatalogActive(id, active)));
    }

    @PostMapping("/books")
    @PreAuthorize("hasRole(\'ADMIN\') or hasAuthority(\'LIBRARY_MANAGE\')")
    @Operation(summary = "Add book to catalog", description = "Admin or teacher (e.g. librarian role) may add titles")
    public ResponseEntity<ApiResponse<Book>> addBook(@RequestBody Book book) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.addBook(book)));
    }

    @GetMapping("/issues")
    @Operation(summary = "List book issues", description = "Filter by status: ISSUED, RETURNED, OVERDUE")
    public ResponseEntity<ApiResponse<List<LibraryDTOs.BookIssueResponse>>> listIssues(@RequestParam(required = false) Enums.BookIssueStatus status) {
        return ResponseEntity.ok(ApiResponse.ok(service.getIssues(status)));
    }

    @GetMapping("/books/paged")
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
    @Operation(summary = "List book issues (paged)", description = "Filter by status: ISSUED, RETURNED, OVERDUE")
    public ResponseEntity<ApiResponse<PageResponse<LibraryDTOs.BookIssueResponse>>> listIssuesPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Enums.BookIssueStatus status) {
        return ResponseEntity.ok(ApiResponse.ok(service.getIssuesPaged(page, size, status)));
    }

    @PostMapping("/issues")
    @PreAuthorize("hasRole(\'ADMIN\') or hasAnyAuthority(\'LIBRARY_MANAGE\',\'LIBRARY_CIRCULATION\')")
    @Operation(summary = "Issue book to student", description = "Decreases available copies. Default due: 14 days.")
    public ResponseEntity<ApiResponse<LibraryDTOs.BookIssueResponse>> issueBook(@Valid @RequestBody LibraryDTOs.IssueBookRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.issueBook(req)));
    }

    @PutMapping("/issues/{id}/return")
    @PreAuthorize("hasRole(\'ADMIN\') or hasAnyAuthority(\'LIBRARY_MANAGE\',\'LIBRARY_CIRCULATION\')")
    @Operation(summary = "Return book", description = "Return date & optional fine/day override; otherwise tenant library_fine_per_day applies.")
    public ResponseEntity<ApiResponse<LibraryDTOs.BookIssueResponse>> returnBook(@PathVariable Long id, @RequestBody(required = false) LibraryDTOs.ReturnBookRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.returnBook(id, req), "Book returned"));
    }

    public LibraryController(final LibraryService service) {
        this.service = service;
    }
}
