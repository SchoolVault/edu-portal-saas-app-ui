package com.school.erp.modules.documents.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.modules.documents.entity.Document;
import com.school.erp.modules.documents.service.DocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/documents")
@Tag(name = "Documents", description = "Document Upload, Management & Retrieval")
public class DocumentController {
    private final DocumentService service;

    @GetMapping
    @Operation(summary = "List documents", description = "Filter by category: STUDENT, TEACHER, ADMIN, GENERAL")
    public ResponseEntity<ApiResponse<List<Document>>> list(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String ownerType,
            @RequestParam(required = false) Long ownerId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getDocuments(category, ownerType, ownerId)));
    }

    @GetMapping("/paged")
    @Operation(summary = "List documents (paged)")
    public ResponseEntity<ApiResponse<PageResponse<Document>>> listPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String ownerType,
            @RequestParam(required = false) Long ownerId,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(ApiResponse.ok(service.getDocumentsPaged(page, size, category, ownerType, ownerId, q)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole(\'ADMIN\',\'TEACHER\')")
    @Operation(summary = "Upload document metadata")
    public ResponseEntity<ApiResponse<Document>> upload(@RequestBody Document doc) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.upload(doc)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole(\'ADMIN\',\'TEACHER\')")
    @Operation(summary = "Update document metadata")
    public ResponseEntity<ApiResponse<Document>> update(@PathVariable Long id, @RequestBody Document doc) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, doc)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole(\'ADMIN\',\'TEACHER\')")
    @Operation(summary = "Delete document", description = "Admin or the user who uploaded the document may delete")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Deleted"));
    }

    public DocumentController(final DocumentService service) {
        this.service = service;
    }
}
