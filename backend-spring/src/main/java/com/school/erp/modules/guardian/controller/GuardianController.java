package com.school.erp.modules.guardian.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.guardian.dto.GuardianDTOs;
import com.school.erp.modules.guardian.service.GuardianService;
import com.school.erp.security.rbac.RbacSpel;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/guardians")
@Tag(name = "Guardians", description = "Parent/guardian directory and lookup")
public class GuardianController {

    private final GuardianService guardianService;

    public GuardianController(GuardianService guardianService) {
        this.guardianService = guardianService;
    }

    @GetMapping("/search")
    @PreAuthorize(RbacSpel.GUARDIAN_DIRECTORY_READ)
    @Operation(summary = "Search guardians by primary phone", description = "Used to attach an existing guardian to a student")
    public ResponseEntity<ApiResponse<List<GuardianDTOs.GuardianResponse>>> searchByPhone(@RequestParam String phone) {
        return ResponseEntity.ok(ApiResponse.ok(guardianService.searchByPhone(phone)));
    }

    @GetMapping("/{id}")
    @PreAuthorize(RbacSpel.GUARDIAN_DIRECTORY_READ)
    @Operation(summary = "Get guardian by id")
    public ResponseEntity<ApiResponse<GuardianDTOs.GuardianResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(guardianService.getById(id)));
    }

    @PostMapping
    @PreAuthorize(RbacSpel.GUARDIAN_DIRECTORY_WRITE)
    @Operation(summary = "Create guardian record")
    public ResponseEntity<ApiResponse<GuardianDTOs.GuardianResponse>> create(@Valid @RequestBody GuardianDTOs.CreateGuardianRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(guardianService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize(RbacSpel.GUARDIAN_DIRECTORY_WRITE)
    @Operation(summary = "Update guardian")
    public ResponseEntity<ApiResponse<GuardianDTOs.GuardianResponse>> update(
            @PathVariable Long id, @RequestBody GuardianDTOs.UpdateGuardianRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(guardianService.update(id, request)));
    }
}
