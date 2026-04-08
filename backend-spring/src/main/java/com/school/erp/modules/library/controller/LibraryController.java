package com.school.erp.modules.library.controller;
import com.school.erp.common.dto.ApiResponse; import com.school.erp.modules.library.entity.*;
import com.school.erp.tenant.TenantContext; import io.swagger.v3.oas.annotations.Operation; import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor; import org.springframework.http.HttpStatus; import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.web.bind.annotation.*; import java.util.List;
@RestController @RequestMapping("/api/v1/library") @RequiredArgsConstructor
@Tag(name = "Library", description = "Book Catalog & Circulation APIs")
public class LibraryController {
    private final com.school.erp.modules.library.repository.BookRepository bookRepo;
    private final com.school.erp.modules.library.repository.BookIssueRepository issueRepo;
    @GetMapping("/books") @Operation(summary = "List books") public ResponseEntity<ApiResponse<List<Book>>> listBooks() { return ResponseEntity.ok(ApiResponse.ok(bookRepo.findByTenantIdAndIsDeletedFalse(TenantContext.getTenantId()))); }
    @PostMapping("/books") @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Add book") public ResponseEntity<ApiResponse<Book>> addBook(@RequestBody Book b) { b.setTenantId(TenantContext.getTenantId()); return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(bookRepo.save(b))); }
    @PutMapping("/books/{id}") @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Update book") public ResponseEntity<ApiResponse<Book>> updateBook(@PathVariable Long id, @RequestBody Book b) { b.setId(id); b.setTenantId(TenantContext.getTenantId()); return ResponseEntity.ok(ApiResponse.ok(bookRepo.save(b))); }
    @GetMapping("/issues") @Operation(summary = "List book issues") public ResponseEntity<ApiResponse<List<BookIssue>>> listIssues() { return ResponseEntity.ok(ApiResponse.ok(issueRepo.findByTenantIdAndIsDeletedFalse(TenantContext.getTenantId()))); }
    @PostMapping("/issues") @PreAuthorize("hasAnyRole('ADMIN','TEACHER')") @Operation(summary = "Issue book") public ResponseEntity<ApiResponse<BookIssue>> issueBook(@RequestBody BookIssue issue) { issue.setTenantId(TenantContext.getTenantId()); return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(issueRepo.save(issue))); }
    @PutMapping("/issues/{id}/return") @PreAuthorize("hasAnyRole('ADMIN','TEACHER')") @Operation(summary = "Return book") public ResponseEntity<ApiResponse<BookIssue>> returnBook(@PathVariable Long id) {
        BookIssue issue = issueRepo.findById(id).orElseThrow();
        issue.setReturnDate(java.time.LocalDate.now()); issue.setStatus(com.school.erp.common.enums.Enums.BookIssueStatus.RETURNED);
        return ResponseEntity.ok(ApiResponse.ok(issueRepo.save(issue), "Book returned")); }
}
