package com.school.erp.modules.communication.controller;
import com.school.erp.common.dto.ApiResponse; import com.school.erp.modules.communication.entity.Announcement;
import com.school.erp.tenant.TenantContext; import io.swagger.v3.oas.annotations.Operation; import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor; import org.springframework.http.HttpStatus; import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/v1/communication") @RequiredArgsConstructor
@Tag(name = "Communication", description = "Announcements & Messaging APIs")
public class CommunicationController {
    private final com.school.erp.modules.communication.repository.AnnouncementRepository repo;

    @GetMapping("/announcements") @Operation(summary = "List announcements")
    public ResponseEntity<ApiResponse<List<Announcement>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(repo.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(TenantContext.getTenantId())));
    }

    @PostMapping("/announcements") @PreAuthorize("hasAnyRole('ADMIN','TEACHER')") @Operation(summary = "Create announcement")
    public ResponseEntity<ApiResponse<Announcement>> create(@RequestBody Announcement ann) {
        ann.setTenantId(TenantContext.getTenantId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(repo.save(ann)));
    }

    @DeleteMapping("/announcements/{id}") @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Delete announcement")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        repo.findById(id).ifPresent(a -> { a.setIsDeleted(true); repo.save(a); });
        return ResponseEntity.ok(ApiResponse.ok(null, "Deleted"));
    }
}
