package com.school.erp.modules.directory.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.security.RequireTenantFeature;
import com.school.erp.modules.directory.dto.DirectoryDTOs;
import com.school.erp.modules.directory.service.DirectoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/directory")
@RequireTenantFeature("directory")
public class DirectoryController {

    private final DirectoryService directoryService;

    public DirectoryController(DirectoryService directoryService) {
        this.directoryService = directoryService;
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DirectoryDTOs.SearchResponse>> search(
            @RequestParam("q") String q,
            @RequestParam(value = "kinds", required = false) String kindsCsv) {
        Set<String> kinds = null;
        if (kindsCsv != null && !kindsCsv.isBlank()) {
            kinds = Arrays.stream(kindsCsv.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toCollection(LinkedHashSet::new));
        }
        return ResponseEntity.ok(ApiResponse.ok(directoryService.search(q, kinds)));
    }

    @GetMapping("/search/paged")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<DirectoryDTOs.Entry>>> searchPaged(
            @RequestParam("q") String q,
            @RequestParam(value = "kinds", required = false) String kindsCsv,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Set<String> kinds = null;
        if (kindsCsv != null && !kindsCsv.isBlank()) {
            kinds = Arrays.stream(kindsCsv.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toCollection(LinkedHashSet::new));
        }
        return ResponseEntity.ok(ApiResponse.ok(directoryService.searchPaged(q, kinds, page, size)));
    }
}
