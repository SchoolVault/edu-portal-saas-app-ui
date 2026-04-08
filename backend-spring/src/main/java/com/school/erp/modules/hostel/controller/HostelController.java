package com.school.erp.modules.hostel.controller;
import com.school.erp.common.dto.ApiResponse; import com.school.erp.modules.hostel.entity.HostelRoom;
import com.school.erp.tenant.TenantContext; import io.swagger.v3.oas.annotations.Operation; import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor; import org.springframework.http.HttpStatus; import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.web.bind.annotation.*; import java.util.List;
@RestController @RequestMapping("/api/v1/hostel") @RequiredArgsConstructor
@Tag(name = "Hostel", description = "Hostel Room Management APIs")
public class HostelController {
    private final com.school.erp.modules.hostel.repository.HostelRoomRepository repo;
    @GetMapping("/rooms") @Operation(summary = "List rooms") public ResponseEntity<ApiResponse<List<HostelRoom>>> list() { return ResponseEntity.ok(ApiResponse.ok(repo.findByTenantIdAndIsDeletedFalse(TenantContext.getTenantId()))); }
    @PostMapping("/rooms") @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Add room") public ResponseEntity<ApiResponse<HostelRoom>> create(@RequestBody HostelRoom r) { r.setTenantId(TenantContext.getTenantId()); return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(repo.save(r))); }
    @PutMapping("/rooms/{id}") @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Update room") public ResponseEntity<ApiResponse<HostelRoom>> update(@PathVariable Long id, @RequestBody HostelRoom r) { r.setId(id); r.setTenantId(TenantContext.getTenantId()); return ResponseEntity.ok(ApiResponse.ok(repo.save(r))); }
}
