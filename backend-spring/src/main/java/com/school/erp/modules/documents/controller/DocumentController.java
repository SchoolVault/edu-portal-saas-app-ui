package com.school.erp.modules.documents.controller;
import com.school.erp.common.dto.ApiResponse; import com.school.erp.modules.documents.entity.Document;
import com.school.erp.tenant.TenantContext; import io.swagger.v3.oas.annotations.Operation; import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor; import org.springframework.http.HttpStatus; import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.web.bind.annotation.*; import java.util.List;
@RestController @RequestMapping("/api/v1/documents") @RequiredArgsConstructor
@Tag(name = "Documents", description = "Document Management APIs")
public class DocumentController {
    private final com.school.erp.modules.documents.repository.DocumentRepository repo;
    @GetMapping @Operation(summary = "List documents") public ResponseEntity<ApiResponse<List<Document>>> list(@RequestParam(required = false) String category) { return ResponseEntity.ok(ApiResponse.ok(repo.findByTenantIdAndIsDeletedFalse(TenantContext.getTenantId()))); }
    @PostMapping @PreAuthorize("hasAnyRole('ADMIN','TEACHER')") @Operation(summary = "Upload document metadata") public ResponseEntity<ApiResponse<Document>> upload(@RequestBody Document doc) { doc.setTenantId(TenantContext.getTenantId()); return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(repo.save(doc))); }
    @DeleteMapping("/{id}") @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Delete document") public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) { repo.findById(id).ifPresent(d -> { d.setIsDeleted(true); repo.save(d); }); return ResponseEntity.ok(ApiResponse.ok(null, "Deleted")); }
}
