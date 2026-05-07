package com.school.erp.modules.documents.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.security.RequireTenantFeature;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.modules.documents.entity.Document;
import com.school.erp.modules.documents.service.DocumentService;
import com.school.erp.security.rbac.RbacSpel;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/v1/documents")
@Tag(name = "Documents", description = "Document Upload, Management & Retrieval")
@RequireTenantFeature("documents")
public class DocumentController {
    private final DocumentService service;

    @GetMapping
    @PreAuthorize(RbacSpel.SCHOOL_DOCUMENTS_READ)
    @Operation(summary = "List documents", description = "Filter by category: STUDENT, TEACHER, ADMIN, GENERAL")
    public ResponseEntity<ApiResponse<List<Document>>> list(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String ownerType,
            @RequestParam(required = false) Long ownerId,
            @RequestParam(required = false) Long academicYearId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getDocuments(category, ownerType, ownerId, academicYearId)));
    }

    @GetMapping("/paged")
    @PreAuthorize(RbacSpel.SCHOOL_DOCUMENTS_READ)
    @Operation(summary = "List documents (paged)")
    public ResponseEntity<ApiResponse<PageResponse<Document>>> listPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String ownerType,
            @RequestParam(required = false) Long ownerId,
            @RequestParam(required = false) Long academicYearId,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(ApiResponse.ok(service.getDocumentsPaged(page, size, category, ownerType, ownerId, academicYearId, q)));
    }

    @PostMapping("/upload")
    @PreAuthorize(RbacSpel.SCHOOL_DOCUMENTS_WRITE)
    @Operation(summary = "Upload document binary + metadata")
    public ResponseEntity<ApiResponse<Document>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(name = "name", required = false) String name,
            @RequestParam(name = "category", required = false) String category,
            @RequestParam(name = "ownerType", required = false) String ownerType,
            @RequestParam(name = "ownerId", required = false) Long ownerId,
            @RequestParam(name = "academicYearId", required = false) Long academicYearId,
            @RequestParam(name = "visibilityScope", required = false) String visibilityScope,
            @RequestParam(name = "parentFolderId", required = false) Long parentFolderId,
            @RequestParam(name = "tagsJson", required = false) String tagsJson) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(service.uploadBinary(
                        file, name, category, ownerType, ownerId, academicYearId, visibilityScope, parentFolderId, tagsJson)));
    }

    @PutMapping("/{id}")
    @PreAuthorize(RbacSpel.SCHOOL_DOCUMENTS_WRITE)
    @Operation(summary = "Update document metadata")
    public ResponseEntity<ApiResponse<Document>> update(@PathVariable Long id, @RequestBody Document doc) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, doc)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(RbacSpel.SCHOOL_DOCUMENTS_WRITE)
    @Operation(summary = "Delete document", description = "Admin or the user who uploaded the document may delete")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Deleted"));
    }

    @GetMapping("/{id}/download")
    @PreAuthorize(RbacSpel.SCHOOL_DOCUMENTS_READ)
    @Operation(summary = "Secure document download")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        Document d = service.getById(id);
        Resource r = service.loadBinary(id);
        ContentDisposition cd = ContentDisposition.attachment().filename(d.getName()).build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, cd.toString())
                .contentType(MediaType.parseMediaType(d.getMimeType() != null ? d.getMimeType() : MediaType.APPLICATION_OCTET_STREAM_VALUE))
                .body(r);
    }

    public DocumentController(final DocumentService service) {
        this.service = service;
    }
}
