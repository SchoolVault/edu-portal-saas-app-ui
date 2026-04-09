package com.school.erp.modules.library.controller;

import com.school.erp.common.dto.ApiResponse;
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
public class LibraryController {
    private final LibraryService service;

    @GetMapping("/books")
    @Operation(summary = "List/search books")
    public ResponseEntity<ApiResponse<List<Book>>> listBooks(@RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.ok(service.getBooks(search)));
    }

    @PostMapping("/books")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Add book to catalog")
    public ResponseEntity<ApiResponse<Book>> addBook(@RequestBody Book book) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.addBook(book)));
    }

    @GetMapping("/issues")
    @Operation(summary = "List book issues", description = "Filter by status: ISSUED, RETURNED, OVERDUE")
    public ResponseEntity<ApiResponse<List<LibraryDTOs.BookIssueResponse>>> listIssues(@RequestParam(required = false) Enums.BookIssueStatus status) {
        return ResponseEntity.ok(ApiResponse.ok(service.getIssues(status)));
    }

    @PostMapping("/issues")
    @PreAuthorize("hasAnyRole(\'ADMIN\',\'TEACHER\')")
    @Operation(summary = "Issue book to student", description = "Decreases available copies. Default due: 14 days.")
    public ResponseEntity<ApiResponse<LibraryDTOs.BookIssueResponse>> issueBook(@Valid @RequestBody LibraryDTOs.IssueBookRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.issueBook(req)));
    }

    @PutMapping("/issues/{id}/return")
    @PreAuthorize("hasAnyRole(\'ADMIN\',\'TEACHER\')")
    @Operation(summary = "Return book", description = "Auto-calculates fine if overdue ($2/day). Increases available copies.")
    public ResponseEntity<ApiResponse<LibraryDTOs.BookIssueResponse>> returnBook(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.returnBook(id), "Book returned"));
    }

    public LibraryController(final LibraryService service) {
        this.service = service;
    }
}
