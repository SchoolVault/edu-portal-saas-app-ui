package com.school.erp.modules.audit.controller;
import com.school.erp.common.dto.ApiResponse; import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums; import com.school.erp.modules.audit.entity.AuditLog;
import com.school.erp.tenant.TenantContext; import io.swagger.v3.oas.annotations.Operation; import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor; import org.springframework.data.domain.Page; import org.springframework.data.domain.PageRequest; import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity; import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.web.bind.annotation.*;
import java.util.List; import java.util.stream.Collectors;

@RestController @RequestMapping("/api/v1/audit") @RequiredArgsConstructor
@Tag(name = "Audit", description = "Audit Trail APIs")
public class AuditController {
    private final com.school.erp.modules.audit.repository.AuditLogRepository repo;

    @GetMapping @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Get audit logs with pagination and filters")
    public ResponseEntity<ApiResponse<PageResponse<AuditLog>>> list(
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) Enums.AuditAction action, @RequestParam(required = false) String module) {
        Page<AuditLog> result = repo.findByTenantIdAndIsDeletedFalse(TenantContext.getTenantId(),
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        List<AuditLog> content = result.getContent();
        if (action != null) content = content.stream().filter(a -> a.getAction() == action).collect(Collectors.toList());
        if (module != null) content = content.stream().filter(a -> a.getModule().equalsIgnoreCase(module)).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(content, page, size, result.getTotalElements())));
    }
}
