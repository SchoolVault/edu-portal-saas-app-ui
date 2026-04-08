package com.school.erp.modules.audit.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.modules.audit.entity.AuditLog;
import com.school.erp.modules.audit.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/audit")
@RequiredArgsConstructor
@Tag(name = "Audit", description = "Audit Trail APIs - Track all system actions")
public class AuditController {

    private final AuditService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get audit logs", description = "Paginated audit logs with optional action and module filters")
    public ResponseEntity<ApiResponse<PageResponse<AuditLog>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) Enums.AuditAction action,
            @RequestParam(required = false) String module) {
        Page<AuditLog> result = service.getAuditLogs(page, size, action, module);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(result.getContent(), page, size, result.getTotalElements())));
    }
}
